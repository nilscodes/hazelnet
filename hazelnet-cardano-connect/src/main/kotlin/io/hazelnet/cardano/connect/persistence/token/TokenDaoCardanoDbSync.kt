package io.hazelnet.cardano.connect.persistence.token

import io.hazelnet.cardano.connect.data.token.AssetFingerprint
import io.hazelnet.cardano.connect.data.token.PolicyId
import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfo
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import java.sql.Types
import java.util.*

const val GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_ALL =
    "SELECT encode(ma.policy, 'hex') AS policy, SUM(mto.quantity) AS number FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=? GROUP BY policy"
const val GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_FOR_POLICIES =
    "SELECT encode(ma.policy, 'hex') AS policy, SUM(mto.quantity) AS number FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=? AND ma.policy IN (%s) GROUP BY policy"
const val GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_FOR_POLICIES_BY_FINGERPRINT =
    "SELECT encode(ma.policy, 'hex') AS policy, fingerprint, SUM(mto.quantity) AS number FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=? AND ma.policy IN (%s) AND ma.fingerprint IN (%s) GROUP BY policy, fingerprint"


@Repository
class TokenDaoCardanoDbSync(
    private val jdbcTemplate: JdbcTemplate
) : TokenDao {
    override fun getMultiAssetsForStakeAddress(stakeAddress: String): List<TokenOwnershipInfo> {
        return jdbcTemplate.query(GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_ALL, { rs, _ ->
            TokenOwnershipInfo(stakeAddress, rs.getString("policy"), rs.getLong("number"))
        }, stakeAddress)
    }

    override fun getMultiAssetsWithPolicyIdForStakeAddress(
        stakeAddress: String,
        policyIds: List<PolicyId>
    ): List<TokenOwnershipInfo> {
        val policyIdInClause = Collections.nCopies(policyIds.size, "decode(?, 'hex')").joinToString(",")
        val sql = String.format(GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_FOR_POLICIES, policyIdInClause)
        val sqlParameters = mutableListOf(stakeAddress)
        sqlParameters.addAll(policyIds.map { it.policyId })
        val sqlParameterTypes = Collections.nCopies(policyIds.size + 1, Types.VARCHAR).toIntArray()
        return jdbcTemplate.query(sql, sqlParameters.toTypedArray(), sqlParameterTypes) { rs, _ ->
            TokenOwnershipInfo(stakeAddress, rs.getString("policy"), rs.getLong("number"))
        }
    }

    override fun getMultiAssetsWithPolicyIdAndAssetFingerprintForStakeAddress(
        stakeAddress: String,
        policyIdsWithAssetFingerprint: List<Pair<PolicyId, AssetFingerprint>>
    ): List<TokenOwnershipInfo> {
        val policyIdInClause = Collections.nCopies(policyIdsWithAssetFingerprint.size, "decode(?, 'hex')").joinToString(",")
        val fingerprintInClause = Collections.nCopies(policyIdsWithAssetFingerprint.size, "?").joinToString(",")
        val sql = String.format(GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_FOR_POLICIES_BY_FINGERPRINT, policyIdInClause, fingerprintInClause)
        val sqlParameters = mutableListOf(stakeAddress)
        sqlParameters.addAll(policyIdsWithAssetFingerprint.map { it.first.policyId })
        sqlParameters.addAll(policyIdsWithAssetFingerprint.map { it.second.assetFingerprint })
        val sqlParameterTypes = Collections.nCopies(policyIdsWithAssetFingerprint.size * 2 + 1, Types.VARCHAR).toIntArray()
        return jdbcTemplate.query(sql, sqlParameters.toTypedArray(), sqlParameterTypes) { rs, _ ->
            TokenOwnershipInfo(stakeAddress, rs.getString("policy") + rs.getString("fingerprint"), rs.getLong("number"))
        }
    }
}