package io.hazelnet.cardano.connect.persistence.verification

import io.hazelnet.cardano.connect.data.transactions.TransactionDetails
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import java.util.*

const val GET_QUALIFYING_TRANSACTIONS: String = "select tx_id as transaction_id, encode(t.hash, 'hex') as transaction_hash from tx_out o join tx t on o.tx_id=t.id WHERE value=? and address=?" +
        " and block_id in (select id from block where time>=?)"
const val GET_QUALIFYING_STAKE_ADDRESSES: String = "select sa.view from stake_address sa join ((select stake_address_id from tx_out where tx_id=?) union (select stake_address_id from tx_in i join tx_out o on o.tx_id=i.tx_out_id and o.index=i.tx_out_index where tx_in_id=?)) s on sa.id=s.stake_address_id"

@Repository
class VerificationDaoCardanoDbSync(
        private val jdbcTemplate: JdbcTemplate
) : VerificationDao {

    override fun getQualifyingTransactions(walletAddress: String, verificationAmount: Long, earliestBlockTime: Date): List<TransactionDetails> {
        val utcCalendarWithEarliestBlockTime = Calendar.getInstance()
        utcCalendarWithEarliestBlockTime.time = earliestBlockTime
        utcCalendarWithEarliestBlockTime.timeZone = TimeZone.getTimeZone("UTC")
        return jdbcTemplate.query(GET_QUALIFYING_TRANSACTIONS,
                { rs, _ -> TransactionDetails(rs.getLong("transaction_id"), rs.getString("transaction_hash")) },
                verificationAmount, walletAddress, utcCalendarWithEarliestBlockTime)
    }

    override fun getQualifyingStakeAddresses(transactionId: Long): List<String> {
        return jdbcTemplate.queryForList(GET_QUALIFYING_STAKE_ADDRESSES, String::class.java, transactionId, transactionId)
    }
}