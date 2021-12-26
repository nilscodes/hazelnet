package io.hazelnet.cardano.connect.persistence.stakepool

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import java.io.IOException

const val GET_ALL_STAKEPOOL_INFO: String = "SELECT encode(h.hash_raw, 'hex') as hash, offl.ticker_name, h.view, offl.json, u.pledge FROM pool_update u JOIN pool_offline_data offl ON u.hash_id=offl.pool_id JOIN pool_hash h ON u.hash_id=h.id" +
        " WHERE registered_tx_id IN (SELECT max(registered_tx_id) FROM pool_update GROUP BY hash_id)"
const val GET_DELEGATION_TO_POOL_IN_EPOCH = "SELECT e.amount, sa.view FROM epoch_stake e JOIN pool_hash h ON e.pool_id=h.id JOIN stake_address sa ON e.addr_id = sa.id WHERE h.hash_raw=decode(?, 'hex') AND epoch_no=?;"
const val GET_ACTIVE_DELEGATION_TO_POOL = "WITH stake AS\n" +
        "         (SELECT d1.addr_id, sa.view\n" +
        "          FROM delegation d1, pool_hash, stake_address sa\n" +
        "          WHERE pool_hash.id=d1.pool_hash_id\n" +
        "            AND pool_hash.hash_raw=decode(?, 'hex')\n" +
        "            AND d1.addr_id=sa.id\n" +
        "            AND NOT EXISTS\n" +
        "              (SELECT TRUE\n" +
        "               FROM delegation d2\n" +
        "               WHERE d2.addr_id=d1.addr_id\n" +
        "                 AND d2.tx_id>d1.tx_id)\n" +
        "            AND NOT EXISTS\n" +
        "              (SELECT TRUE\n" +
        "               FROM stake_deregistration\n" +
        "               WHERE stake_deregistration.addr_id=d1.addr_id\n" +
        "                 AND stake_deregistration.tx_id>d1.tx_id))\n" +
        "SELECT sum(total) AS amount, view\n" +
        "FROM\n" +
        "    (SELECT sum(value) total, stake.view AS view\n" +
        "     FROM utxo_view\n" +
        "              INNER JOIN stake ON utxo_view.stake_address_id=stake.addr_id\n" +
        "     GROUP BY stake.view\n" +
        "     UNION SELECT sum(amount), stake.view\n" +
        "     FROM reward\n" +
        "              INNER JOIN stake ON reward.addr_id=stake.addr_id\n" +
        "     WHERE reward.spendable_epoch <= (SELECT MAX(epoch_no) FROM block)\n" +
        "     GROUP BY stake.view\n" +
        "     UNION SELECT -sum(amount), stake.view\n" +
        "     FROM withdrawal\n" +
        "              INNER JOIN stake ON withdrawal.addr_id=stake.addr_id\n" +
        "     GROUP BY stake.view\n" +
        "    ) AS t\n" +
        "GROUP BY view"

@Repository
class StakepoolDaoCardanoDbSync(
        private val jdbcTemplate: JdbcTemplate
) : StakepoolDao {
    override fun listStakepools(): List<StakepoolInfo> {
        return jdbcTemplate.query(GET_ALL_STAKEPOOL_INFO
        ) { rs, _ ->

            var ticker: String? = null
            var name: String? = null
            var website: String? = null
            var description: String? = null
            try {
                val metadata = ObjectMapper().readValue(rs.getString("json"), object : TypeReference<Map<String, String>>() {})
                ticker = metadata["ticker"]
                name = metadata["name"]
                website = metadata["homepage"]
                description = metadata["description"]
            } catch (ioe: IOException) {
            }
            StakepoolInfo(
                    hash = rs.getString("hash"),
                    view = rs.getString("view"),
                    ticker = ticker ?: "UNKNOWN",
                    name = name ?: "UNKNOWN",
                    website = website ?: "",
                    description = description ?: ""
            )

        }

    }

    override fun getActiveDelegation(poolHash: String): List<DelegationInfo> {
        return jdbcTemplate.query(GET_ACTIVE_DELEGATION_TO_POOL, { rs, _ ->
            DelegationInfo(poolHash, rs.getLong("amount"), rs.getString("view"))
        }, poolHash)
    }

    override fun getDelegationInEpoch(poolHash: String, epochNo: Int): List<DelegationInfo> {
        return jdbcTemplate.query(GET_DELEGATION_TO_POOL_IN_EPOCH, { rs, _ ->
            DelegationInfo(poolHash, rs.getLong("amount"), rs.getString("view"))
        }, poolHash, epochNo)
    }

}