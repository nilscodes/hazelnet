package io.hazelnet.cardano.connect.persistence.token

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import io.hazelnet.cardano.connect.data.address.AddressDetails
import io.hazelnet.cardano.connect.data.token.*
import io.hazelnet.shared.decodeHex
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import java.sql.ResultSet
import java.sql.Types
import java.util.*

const val GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_ALL =
    "SELECT encode(ma.policy, 'hex') AS policy, SUM(mto.quantity) AS number FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=? GROUP BY policy"
const val GET_ALL_MULTI_ASSET_NAMES_IN_STAKE_ADDRESS_ALL =
    "SELECT encode(ma.policy, 'hex') AS policy, encode(ma.name, 'hex') as name FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=?"
const val GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_FOR_POLICIES =
    "SELECT encode(ma.policy, 'hex') AS policy, SUM(mto.quantity) AS number FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=? AND ma.policy IN (%s) %s GROUP BY policy"
const val GET_ALL_MULTI_ASSET_NAMES_IN_STAKE_ADDRESS_FOR_POLICIES =
    "SELECT encode(ma.policy, 'hex') AS policy, encode(ma.name, 'hex') as name FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=? AND ma.policy IN (%s)"
const val GET_ALL_MULTI_ASSET_NAMES_IN_WALLET_ADDRESS_FOR_POLICIES =
    "SELECT encode(ma.policy, 'hex') AS policy, encode(ma.name, 'hex') as name FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id WHERE u.address=? AND ma.policy IN (%s)"
const val GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_FOR_POLICIES_BY_FINGERPRINT =
    "SELECT encode(ma.policy, 'hex') AS policy, fingerprint, SUM(mto.quantity) AS number FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=? AND ma.policy IN (%s) AND ma.fingerprint IN (%s) GROUP BY policy, fingerprint"
const val GET_ALL_MULTI_ASSET_NAMES_IN_STAKE_ADDRESS_FOR_POLICIES_BY_FINGERPRINT =
    "SELECT encode(ma.policy, 'hex') AS policy, fingerprint, encode(ma.name, 'hex') as name FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=? AND ma.policy IN (%s) AND ma.fingerprint IN (%s)"

const val GET_SNAPSHOT_OF_STAKES_BY_POLICIES =
    "SELECT encode(ma.policy, 'hex') AS policy, sa.view AS stakeview, SUM(mto.quantity) AS number FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE ma.policy IN (%s) GROUP BY policy, sa.view"
const val GET_SNAPSHOT_OF_STAKES_BY_POLICIES_AND_FINGERPRINT =
    "SELECT encode(ma.policy, 'hex') AS policy, fingerprint, sa.view AS stakeview, SUM(mto.quantity) AS number FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE ma.policy IN (%s) AND ma.fingerprint IN (%s) GROUP BY policy, fingerprint, sa.view"

const val GET_STAKE_ADDRESS_BY_ASSET_FINGERPRINT =
    "SELECT sa.view FROM utxo_view u JOIN ma_tx_out mto ON u.id = mto.tx_out_id JOIN multi_asset ma ON mto.ident = ma.id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE ma.fingerprint=?"

const val GET_ASSET_MINT_METADATA_BY_POLICY_AND_NAME =
    "SELECT ma.fingerprint, encode(ma.name, 'hex') as name, encode(ma.policy, 'hex') as policy, mtm.quantity, encode(tx.hash, 'hex') as hash, tm.json FROM multi_asset ma JOIN ma_tx_mint mtm ON ma.id = mtm.ident JOIN tx_metadata tm ON mtm.tx_id = tm.tx_id JOIN tx ON mtm.tx_id = tx.id WHERE policy=DECODE(?, 'hex') AND name=cast(? as asset32type) AND key=? AND mtm.quantity>0 ORDER BY mtm.tx_id DESC LIMIT 1"
const val GET_ASSET_MINT_METADATA_BY_ASSET_FINGERPRINT =
    "SELECT ma.fingerprint, encode(ma.name, 'hex') as name, encode(ma.policy, 'hex') as policy, mtm.quantity, encode(tx.hash, 'hex') as hash FROM multi_asset ma JOIN ma_tx_mint mtm ON ma.id = mtm.ident JOIN tx ON mtm.tx_id = tx.id WHERE ma.fingerprint=? AND mtm.quantity>0 ORDER BY mtm.tx_id DESC LIMIT 1"

const val GET_POLICY_INFO_BY_POLICY_ID =
    "select sum(quantity) as count FROM multi_asset ma JOIN ma_tx_mint mtm on ma.id = mtm.ident WHERE ma.policy=decode(?, 'hex')"

const val NFT_METADATA_KEY = 721

@Repository
class TokenDaoCardanoDbSync(
    private val jdbcTemplate: JdbcTemplate
) : TokenDao {
    override fun getMultiAssetCountsForStakeAddress(stakeAddress: String): List<TokenOwnershipInfoWithAssetCount> {
        return jdbcTemplate.query(GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_ALL, { rs, _ ->
            TokenOwnershipInfoWithAssetCount(stakeAddress, rs.getString("policy"), rs.getLong("number"))
        }, stakeAddress)
    }

    override fun getMultiAssetCountsWithPolicyIdForStakeAddress(
        stakeAddress: String,
        policyIds: List<PolicyId>,
        excludedAssetFingerprints: List<AssetFingerprint>,
    ): List<TokenOwnershipInfoWithAssetCount> {
        val (sql, sqlParameters, sqlParameterTypes) = getPartsForPolicyIdBasedQuery(
            GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_FOR_POLICIES,
            policyIds,
            excludedAssetFingerprints,
            stakeAddress
        )
        return jdbcTemplate.query(sql, sqlParameters.toTypedArray(), sqlParameterTypes) { rs, _ ->
            TokenOwnershipInfoWithAssetCount(stakeAddress, rs.getString("policy"), rs.getLong("number"))
        }
    }

    override fun getMultiAssetCountsWithPolicyIdAndAssetFingerprintForStakeAddress(
        stakeAddress: String,
        policyIdsWithAssetFingerprint: List<Pair<PolicyId, AssetFingerprint>>
    ): List<TokenOwnershipInfoWithAssetCount> {
        val (sql, sqlParameters, sqlParameterTypes) = getPartsForAssetFingerprintBasedQuery(
            GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_FOR_POLICIES_BY_FINGERPRINT,
            policyIdsWithAssetFingerprint,
            stakeAddress
        )
        return jdbcTemplate.query(sql, sqlParameters.toTypedArray(), sqlParameterTypes) { rs, _ ->
            TokenOwnershipInfoWithAssetCount(
                stakeAddress,
                rs.getString("policy") + rs.getString("fingerprint"),
                rs.getLong("number")
            )
        }
    }

    override fun getMultiAssetListForStakeAddress(stakeAddress: String): List<TokenOwnershipInfoWithAssetList> {
        val policiesToAssets = mutableMapOf<String, MutableSet<String>>()
        jdbcTemplate.query(GET_ALL_MULTI_ASSET_NAMES_IN_STAKE_ADDRESS_ALL, { rs, _ ->
            val assetNameList = policiesToAssets.computeIfAbsent(rs.getString("policy")) { mutableSetOf() }
            assetNameList.add(rs.getString("name"))
        }, stakeAddress)
        return policiesToAssets.map { TokenOwnershipInfoWithAssetList(stakeAddress = stakeAddress, policyIdWithOptionalAssetFingerprint = it.key, assetList = it.value) }
    }

    override fun getMultiAssetListWithPolicyIdForStakeAddress(
        stakeAddress: String,
        policyIds: List<PolicyId>,
    ): List<TokenOwnershipInfoWithAssetList> {
        val (sql, sqlParameters, sqlParameterTypes) = getPartsForPolicyIdBasedQuery(
            GET_ALL_MULTI_ASSET_NAMES_IN_STAKE_ADDRESS_FOR_POLICIES,
            policyIds,
            emptyList(),
            stakeAddress
        )
        val policiesToAssets = mutableMapOf<String, MutableSet<String>>()
        jdbcTemplate.query(sql, sqlParameters.toTypedArray(), sqlParameterTypes) { rs, _ ->
            val assetNameList = policiesToAssets.computeIfAbsent(rs.getString("policy")) { mutableSetOf() }
            assetNameList.add(rs.getString("name"))
        }
        return policiesToAssets.map { TokenOwnershipInfoWithAssetList(stakeAddress = stakeAddress, policyIdWithOptionalAssetFingerprint = it.key, assetList = it.value) }
    }

    override fun getMultiAssetListWithPolicyIdAndAssetFingerprintForStakeAddress(
        stakeAddress: String,
        policyIdsWithAssetFingerprint: List<Pair<PolicyId, AssetFingerprint>>
    ): List<TokenOwnershipInfoWithAssetList> {
        val (sql, sqlParameters, sqlParameterTypes) = getPartsForAssetFingerprintBasedQuery(
            GET_ALL_MULTI_ASSET_NAMES_IN_STAKE_ADDRESS_FOR_POLICIES_BY_FINGERPRINT,
            policyIdsWithAssetFingerprint,
            stakeAddress
        )
        val policiesToAssets = mutableMapOf<String, MutableSet<String>>()
        jdbcTemplate.query(sql, sqlParameters.toTypedArray(), sqlParameterTypes) { rs, _ ->
            val assetNameList =
                policiesToAssets.computeIfAbsent(rs.getString("policy") + rs.getString("fingerprint")) { mutableSetOf() }
            assetNameList.add(rs.getString("name"))
        }
        return policiesToAssets.map { TokenOwnershipInfoWithAssetList(stakeAddress = stakeAddress, policyIdWithOptionalAssetFingerprint = it.key, assetList = it.value) }
    }

    override fun getMultiAssetListWithPolicyIdForWalletAddress(
        walletAddress: String,
        policyIds: List<PolicyId>
    ): List<TokenOwnershipInfoWithAssetList> {
        val (sql, sqlParameters, sqlParameterTypes) = getPartsForPolicyIdBasedQuery(
            GET_ALL_MULTI_ASSET_NAMES_IN_WALLET_ADDRESS_FOR_POLICIES,
            policyIds,
            emptyList(),
            walletAddress
        )
        val policiesToAssets = mutableMapOf<String, MutableSet<String>>()
        jdbcTemplate.query(sql, sqlParameters.toTypedArray(), sqlParameterTypes) { rs, _ ->
            val assetNameList = policiesToAssets.computeIfAbsent(rs.getString("policy")) { mutableSetOf() }
            assetNameList.add(rs.getString("name"))
        }
        return policiesToAssets.map { TokenOwnershipInfoWithAssetList(walletAddress = walletAddress, policyIdWithOptionalAssetFingerprint = it.key, assetList = it.value) }
    }

    private fun getPartsForPolicyIdBasedQuery(
        sqlBase: String,
        policyIds: List<PolicyId>,
        excludedAssetFingerprints: List<AssetFingerprint>,
        address: String
    ): Triple<String, MutableList<String>, IntArray> {
        val policyIdInClause = Collections.nCopies(policyIds.size, "decode(?, 'hex')").joinToString(",")
        val excludedAssetClause = when (excludedAssetFingerprints.isEmpty()) {
            true -> ""
            else -> "AND ma.fingerprint NOT IN (" + Collections.nCopies(excludedAssetFingerprints.size, "?").joinToString(",") + ")"
        }
        val sql = String.format(sqlBase, policyIdInClause, excludedAssetClause)
        val sqlParameters = mutableListOf(address)
        sqlParameters.addAll(policyIds.map { it.policyId })
        sqlParameters.addAll(excludedAssetFingerprints.map { it.assetFingerprint })
        val sqlParameterTypes = Collections.nCopies(policyIds.size + excludedAssetFingerprints.size + 1, Types.VARCHAR).toIntArray()
        return Triple(sql, sqlParameters, sqlParameterTypes)
    }

    private fun getPartsForAssetFingerprintBasedQuery(
        sqlBase: String,
        policyIdsWithAssetFingerprint: List<Pair<PolicyId, AssetFingerprint>>,
        stakeAddress: String
    ): Triple<String, MutableList<String>, IntArray> {
        val policyIdInClause =
            Collections.nCopies(policyIdsWithAssetFingerprint.size, "decode(?, 'hex')").joinToString(",")
        val fingerprintInClause = Collections.nCopies(policyIdsWithAssetFingerprint.size, "?").joinToString(",")
        val sql = String.format(
            sqlBase,
            policyIdInClause,
            fingerprintInClause
        )
        val sqlParameters = mutableListOf(stakeAddress)
        sqlParameters.addAll(policyIdsWithAssetFingerprint.map { it.first.policyId })
        sqlParameters.addAll(policyIdsWithAssetFingerprint.map { it.second.assetFingerprint })
        val sqlParameterTypes =
            Collections.nCopies(policyIdsWithAssetFingerprint.size * 2 + 1, Types.VARCHAR).toIntArray()
        return Triple(sql, sqlParameters, sqlParameterTypes)
    }

    override fun getMultiAssetCountSnapshotForPolicyId(policyIds: List<PolicyId>): List<TokenOwnershipInfoWithAssetCount> {
        val policyIdInClause = Collections.nCopies(policyIds.size, "decode(?, 'hex')").joinToString(",")
        val sql = String.format(GET_SNAPSHOT_OF_STAKES_BY_POLICIES, policyIdInClause)
        val sqlParameters = policyIds.map { it.policyId }
        val sqlParameterTypes = Collections.nCopies(policyIds.size, Types.VARCHAR).toIntArray()
        return jdbcTemplate.query(sql, sqlParameters.toTypedArray(), sqlParameterTypes) { rs, _ ->
            TokenOwnershipInfoWithAssetCount(rs.getString("stakeview"), rs.getString("policy"), rs.getLong("number"))
        }
    }

    override fun getMultiAssetCountSnapshotForPolicyIdAndAssetFingerprint(policyIdsWithAssetFingerprint: List<Pair<PolicyId, AssetFingerprint>>): List<TokenOwnershipInfoWithAssetCount> {
        val policyIdInClause =
            Collections.nCopies(policyIdsWithAssetFingerprint.size, "decode(?, 'hex')").joinToString(",")
        val fingerprintInClause = Collections.nCopies(policyIdsWithAssetFingerprint.size, "?").joinToString(",")
        val sql =
            String.format(GET_SNAPSHOT_OF_STAKES_BY_POLICIES_AND_FINGERPRINT, policyIdInClause, fingerprintInClause)
        val sqlParameters = mutableListOf<String>()
        sqlParameters.addAll(policyIdsWithAssetFingerprint.map { it.first.policyId })
        sqlParameters.addAll(policyIdsWithAssetFingerprint.map { it.second.assetFingerprint })
        val sqlParameterTypes = Collections.nCopies(policyIdsWithAssetFingerprint.size * 2, Types.VARCHAR).toIntArray()
        return jdbcTemplate.query(sql, sqlParameters.toTypedArray(), sqlParameterTypes) { rs, _ ->
            TokenOwnershipInfoWithAssetCount(
                rs.getString("stakeview"),
                rs.getString("policy") + rs.getString("fingerprint"),
                rs.getLong("number")
            )
        }
    }

    override fun getMultiAssetInfo(policyId: String, assetName: String): MultiAssetInfo {
        return try {
            jdbcTemplate.queryForObject(GET_ASSET_MINT_METADATA_BY_POLICY_AND_NAME, { rs, _ ->
                mapMultiAssetInfo(rs, true)
            }, policyId, assetName, NFT_METADATA_KEY)!!
        } catch (erdae: EmptyResultDataAccessException) {
            // TODO should be changed to return null and a 404 on the controller, but need to adjust connectService on the community end to deal with that in a healthy way
            MultiAssetInfo(PolicyId(policyId), assetName, AssetFingerprint("asset1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"), "", "", 0)
        }
    }

    override fun getMultiAssetInfoForAssetFingerprint(assetFingerprint: AssetFingerprint): MultiAssetInfo {
        return jdbcTemplate.queryForObject(GET_ASSET_MINT_METADATA_BY_ASSET_FINGERPRINT, { rs, _ ->
            mapMultiAssetInfo(rs, false)
        }, assetFingerprint.assetFingerprint)!!
    }

    private fun mapMultiAssetInfo(
        rs: ResultSet,
        includeMetadata: Boolean,
    ): MultiAssetInfo {
        val policyId = rs.getString("policy")
        val assetName = rs.getString("name").decodeHex()
        val objectMapper = ObjectMapper()
        var metadataOfAsset = emptyMap<String, Any>()
        if (includeMetadata) {
            val mintMetadata =
                objectMapper.readValue(rs.getString("json"), object : TypeReference<Map<String, Any>>() {})
            val metadataOfPolicyId = mintMetadata[policyId] as Map<String, Any>
            metadataOfAsset = (metadataOfPolicyId[assetName] as Map<String, Any>?) ?: mapOf()
        }
        return MultiAssetInfo(
            PolicyId(policyId),
            assetName,
            AssetFingerprint(rs.getString("fingerprint")),
            objectMapper.writeValueAsString(metadataOfAsset),
            rs.getString("hash"),
            rs.getLong("quantity"),
        )
    }

    override fun getWalletForAsset(assetFingerprint: AssetFingerprint): AddressDetails {
        return AddressDetails(
            jdbcTemplate.queryForObject(
                GET_STAKE_ADDRESS_BY_ASSET_FINGERPRINT,
                String::class.java,
                assetFingerprint.assetFingerprint
            )
        )
    }

    override fun getPolicyInfo(policyId: String): PolicyInfo {
        return PolicyInfo(
            PolicyId(policyId),
            jdbcTemplate.queryForObject(GET_POLICY_INFO_BY_POLICY_ID, Long::class.java, policyId),
        )
    }
}