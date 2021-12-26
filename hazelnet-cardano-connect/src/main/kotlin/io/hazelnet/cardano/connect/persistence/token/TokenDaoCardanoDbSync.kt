package io.hazelnet.cardano.connect.persistence.token

import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfo
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import java.sql.Types
import java.util.*

const val GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_ALL = "SELECT encode(ma.policy, 'hex') AS policy, SUM(ma.quantity) AS number FROM utxo_view u JOIN ma_tx_out ma ON u.id = ma.tx_out_id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=? GROUP BY policy;"
const val GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_FOR_POLICIES = "SELECT encode(ma.policy, 'hex') AS policy, SUM(ma.quantity) AS number FROM utxo_view u JOIN ma_tx_out ma ON u.id = ma.tx_out_id JOIN stake_address sa ON u.stake_address_id = sa.id WHERE sa.view=? AND ma.policy IN (%s) GROUP BY policy;"

@Repository
class TokenDaoCardanoDbSync(
        private val jdbcTemplate: JdbcTemplate
): TokenDao {
    override fun getMultiAssetsForStakeAddress(stakeAddress: String, policyIds: List<String>): List<TokenOwnershipInfo> {
        return if(policyIds.isEmpty()) {
            jdbcTemplate.query(GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_ALL, { rs, _ ->
                TokenOwnershipInfo(stakeAddress, rs.getString("policy"), rs.getLong("number"))
            }, stakeAddress)
        } else {
            val policyIdInClause = Collections.nCopies(policyIds.size, "decode(?, 'hex')").joinToString(",")
            val sql = String.format(GET_ALL_MULTI_ASSETS_IN_STAKE_ADDRESS_FOR_POLICIES, policyIdInClause)
            val sqlParameters = mutableListOf(stakeAddress)
            sqlParameters.addAll(policyIds)
            val sqlParameterTypes = Collections.nCopies(policyIds.size + 1, Types.VARCHAR).toIntArray()
            jdbcTemplate.query(sql, sqlParameters.toTypedArray(), sqlParameterTypes) { rs, _ ->
                TokenOwnershipInfo(stakeAddress, rs.getString("policy"), rs.getLong("number"))
            }
        }
    }
}