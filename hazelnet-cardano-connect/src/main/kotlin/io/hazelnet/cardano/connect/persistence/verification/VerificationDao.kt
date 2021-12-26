package io.hazelnet.cardano.connect.persistence.verification

import io.hazelnet.cardano.connect.data.transactions.TransactionDetails
import java.util.*

interface VerificationDao {
    fun getQualifyingTransactions(
            walletAddress : String,
            verificationAmount : Long,
            earliestBlockTime : Date
    ) : List<TransactionDetails>

    fun getQualifyingStakeAddresses(transactionId : Long) : List<String>
}