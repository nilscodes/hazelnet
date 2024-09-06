package io.hazelnet.cardano.connect.persistence.drep

import io.hazelnet.cardano.connect.data.drep.DRepDelegationInfo
import io.hazelnet.cardano.connect.data.drep.DRepInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import io.hazelnet.cardano.connect.persistence.stakepool.GET_ALL_STAKEPOOL_INFO
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import java.sql.ResultSet

const val GET_ALL_DREP_INFO = """
    WITH latestRegistrations AS (SELECT * FROM drep_registration r1
        WHERE
        NOT EXISTS
        (SELECT TRUE
        FROM drep_registration r2
        WHERE r2.drep_hash_id=r1.drep_hash_id
        AND r2.tx_id>r1.tx_id)
        )
    SELECT encode(h.raw, 'hex') as hash, offl.given_name as name, h.view
    FROM latestRegistrations u
             JOIN drep_hash h ON u.drep_hash_id = h.id
             LEFT OUTER JOIN off_chain_vote_data ovd ON u.voting_anchor_id = ovd.voting_anchor_id
             LEFT OUTER JOIN off_chain_vote_drep_data offl ON ovd.id = offl.off_chain_vote_data_id
    ORDER BY offl.id DESC
"""

const val GET_ALL_DREP_INFO_BY_VIEW: String = """
    SELECT encode(h.raw, 'hex') as hash, offl.given_name as name, h.view
    FROM drep_registration u
             JOIN drep_hash h ON u.drep_hash_id = h.id
             LEFT OUTER JOIN off_chain_vote_data ovd ON u.voting_anchor_id = ovd.voting_anchor_id
             LEFT OUTER JOIN off_chain_vote_drep_data offl ON ovd.id = offl.off_chain_vote_data_id
    WHERE h.view = ?
      AND u.tx_id IN (SELECT max(tx_id) FROM drep_registration GROUP BY drep_hash_id)
    ORDER BY offl.id DESC
    LIMIT 1
"""

const val GET_ALL_DREP_INFO_BY_HASH: String = """
    SELECT encode(h.raw, 'hex') as hash, offl.given_name as name, h.view
    FROM drep_registration u
             JOIN drep_hash h ON u.drep_hash_id = h.id
             LEFT OUTER JOIN off_chain_vote_data ovd ON u.voting_anchor_id = ovd.voting_anchor_id
             LEFT OUTER JOIN off_chain_vote_drep_data offl ON ovd.id = offl.off_chain_vote_data_id
    WHERE h.raw = decode(?, 'hex')
      AND u.tx_id IN (SELECT max(tx_id) FROM drep_registration GROUP BY drep_hash_id)
    ORDER BY offl.id DESC
    LIMIT 1
"""

const val GET_ACTIVE_DELEGATION_TO_DREP = """
        WITH stake AS
                 (SELECT d1.addr_id, sa.view
                  FROM delegation_vote d1, drep_hash, stake_address sa
                  WHERE drep_hash.id=d1.drep_hash_id
                    AND drep_hash.raw=decode(?, 'hex')
                    AND d1.addr_id=sa.id
                    AND NOT EXISTS
                      (SELECT TRUE
                       FROM delegation_vote d2
                       WHERE d2.addr_id=d1.addr_id
                         AND d2.tx_id>d1.tx_id))
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

const val SQL_GET_ACTIVE_DELEGATION_TO_DREP_WITHOUT_AMOUNT = """
        SELECT sa.view
          FROM delegation_vote d1, drep_hash, stake_address sa
          WHERE drep_hash.id=d1.drep_hash_id
            AND drep_hash.raw=decode(?, 'hex')
            AND d1.addr_id=sa.id
            AND NOT EXISTS
              (SELECT TRUE
               FROM delegation_vote d2
               WHERE d2.addr_id=d1.addr_id
                 AND d2.tx_id>d1.tx_id)
"""

@Repository
class DRepDaoCardanoDbSync(
        private val jdbcTemplate: JdbcTemplate
) : DRepDao {

    val mapRowToDRep: (rs: ResultSet, rowNum: Int) -> DRepInfo? = { rs, _ ->

        val name: String? = rs.getString("name")
        DRepInfo(
                hash = rs.getString("hash"),
                view = rs.getString("view"),
                name = name ?: "",
        )

    }

    override fun listDReps(): List<DRepInfo> {
        return jdbcTemplate.query(GET_ALL_DREP_INFO, mapRowToDRep)
    }

    override fun findByView(dRepView: String): List<DRepInfo> {
        return jdbcTemplate.query(GET_ALL_DREP_INFO_BY_VIEW, mapRowToDRep, dRepView)
    }

    override fun findByHash(dRepHash: String): List<DRepInfo> {
        return jdbcTemplate.query(GET_ALL_DREP_INFO_BY_HASH, mapRowToDRep, dRepHash)
    }

    override fun getActiveDelegation(dRepHash: String): List<DRepDelegationInfo> {
        return jdbcTemplate.query(GET_ACTIVE_DELEGATION_TO_DREP, { rs, _ ->
            DRepDelegationInfo(dRepHash, rs.getLong("amount"), rs.getString("view"))
        }, dRepHash)
    }

    override fun getActiveDelegationWithoutAmount(dRepHash: String): List<DRepDelegationInfo> {
        return jdbcTemplate.query(SQL_GET_ACTIVE_DELEGATION_TO_DREP_WITHOUT_AMOUNT, { rs, _ ->
            DRepDelegationInfo(dRepHash, 1, rs.getString("view"))
        }, dRepHash)
    }

}