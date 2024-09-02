package io.hazelnet.cardano.connect.persistence.stakepool

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import java.io.IOException
import java.sql.ResultSet

const val GET_ALL_STAKEPOOL_INFO: String = "SELECT encode(h.hash_raw, 'hex') as hash, offl.ticker_name, h.view, offl.json, u.pledge FROM pool_update u JOIN off_chain_pool_data offl ON u.hash_id=offl.pool_id JOIN pool_hash h ON u.hash_id=h.id" +
        " WHERE registered_tx_id IN (SELECT max(registered_tx_id) FROM pool_update GROUP BY hash_id) AND offl.id IN (SELECT max(id) FROM off_chain_pool_data GROUP BY pool_id)"
const val GET_ALL_STAKEPOOL_INFO_BY_VIEW: String = "SELECT encode(h.hash_raw, 'hex') as hash, offl.ticker_name, h.view, offl.json, u.pledge FROM pool_update u JOIN off_chain_pool_data offl ON u.hash_id=offl.pool_id JOIN pool_hash h ON u.hash_id=h.id" +
        " WHERE h.view=? AND registered_tx_id IN (SELECT max(registered_tx_id) FROM pool_update GROUP BY hash_id) ORDER BY offl.id DESC LIMIT 1"
const val GET_ALL_STAKEPOOL_INFO_BY_HASH: String = "SELECT encode(h.hash_raw, 'hex') as hash, offl.ticker_name, h.view, offl.json, u.pledge FROM pool_update u JOIN off_chain_pool_data offl ON u.hash_id=offl.pool_id JOIN pool_hash h ON u.hash_id=h.id" +
        " WHERE h.hash_raw=decode(?, 'hex') AND registered_tx_id IN (SELECT max(registered_tx_id) FROM pool_update GROUP BY hash_id) ORDER BY offl.id DESC LIMIT 1"
const val GET_DELEGATION_TO_POOL_IN_EPOCH = "SELECT e.amount, sa.view FROM epoch_stake e JOIN pool_hash h ON e.pool_id=h.id JOIN stake_address sa ON e.addr_id = sa.id WHERE h.hash_raw=decode(?, 'hex') AND epoch_no=?;"
const val GET_ACTIVE_DELEGATION_TO_POOL = """
        WITH stake AS
                 (SELECT d1.addr_id, sa.view
                  FROM delegation d1, pool_hash, stake_address sa
                  WHERE pool_hash.id=d1.pool_hash_id
                    AND pool_hash.hash_raw=decode(?, 'hex')
                    AND d1.addr_id=sa.id
                    AND NOT EXISTS
                      (SELECT TRUE
                       FROM delegation d2
                       WHERE d2.addr_id=d1.addr_id
                         AND d2.tx_id>d1.tx_id)
                    AND NOT EXISTS
                      (SELECT TRUE
                       FROM stake_deregistration
                       WHERE stake_deregistration.addr_id=d1.addr_id
                         AND stake_deregistration.tx_id>d1.tx_id))
        SELECT sum(total) AS amount, view
        FROM
            (SELECT sum(value) total, stake.view AS view
             FROM tx_out
                      INNER JOIN stake ON tx_out.stake_address_id=stake.addr_id
             WHERE tx_out.consumed_by_tx_id IS NULL
             GROUP BY stake.view
             UNION SELECT sum(amount), stake.view
             FROM reward
                      INNER JOIN stake ON reward.addr_id=stake.addr_id
             WHERE reward.spendable_epoch <= (SELECT MAX(epoch_no) FROM block)
             GROUP BY stake.view
             UNION SELECT -sum(amount), stake.view
             FROM withdrawal
                      INNER JOIN stake ON withdrawal.addr_id=stake.addr_id
             GROUP BY stake.view
            ) AS t
        GROUP BY view
"""

const val SQL_GET_ACTIVE_DELEGATION_TO_POOL_WITHOUT_AMOUNT = """
        SELECT sa.view
          FROM delegation d1, pool_hash, stake_address sa
          WHERE pool_hash.id=d1.pool_hash_id
            AND pool_hash.hash_raw=decode(?, 'hex')
            AND d1.addr_id=sa.id
            AND NOT EXISTS
              (SELECT TRUE
               FROM delegation d2
               WHERE d2.addr_id=d1.addr_id
                 AND d2.tx_id>d1.tx_id)
            AND NOT EXISTS
              (SELECT TRUE
               FROM stake_deregistration
               WHERE stake_deregistration.addr_id=d1.addr_id
                 AND stake_deregistration.tx_id>d1.tx_id)
"""

@Repository
class StakepoolDaoCardanoDbSync(
        private val jdbcTemplate: JdbcTemplate
) : StakepoolDao {

    val mapRowToStakepool: (rs: ResultSet, rowNum: Int) -> StakepoolInfo? = { rs, _ ->

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

    override fun listStakepools(): List<StakepoolInfo> {
        return jdbcTemplate.query(GET_ALL_STAKEPOOL_INFO, mapRowToStakepool)
    }

    override fun findByView(poolView: String): List<StakepoolInfo> {
        return jdbcTemplate.query(GET_ALL_STAKEPOOL_INFO_BY_VIEW, mapRowToStakepool, poolView)
    }

    override fun findByHash(poolHash: String): List<StakepoolInfo> {
        return jdbcTemplate.query(GET_ALL_STAKEPOOL_INFO_BY_HASH, mapRowToStakepool, poolHash)
    }

    override fun getActiveDelegation(poolHash: String): List<DelegationInfo> {
        return jdbcTemplate.query(GET_ACTIVE_DELEGATION_TO_POOL, { rs, _ ->
            DelegationInfo(poolHash, rs.getLong("amount"), rs.getString("view"))
        }, poolHash)
    }

    override fun getActiveDelegationWithoutAmount(poolHash: String): List<DelegationInfo> {
        return jdbcTemplate.query(SQL_GET_ACTIVE_DELEGATION_TO_POOL_WITHOUT_AMOUNT, { rs, _ ->
            DelegationInfo(poolHash, 1, rs.getString("view"))
        }, poolHash)
    }

    override fun getDelegationInEpoch(poolHash: String, epochNo: Int): List<DelegationInfo> {
        return jdbcTemplate.query(GET_DELEGATION_TO_POOL_IN_EPOCH, { rs, _ ->
            DelegationInfo(poolHash, rs.getLong("amount"), rs.getString("view"))
        }, poolHash, epochNo)
    }

}