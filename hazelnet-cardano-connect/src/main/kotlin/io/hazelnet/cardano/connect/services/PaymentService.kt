package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.payment.PaymentConfirmation
import io.hazelnet.cardano.connect.data.transactions.NoTransactionFoundException
import io.hazelnet.cardano.connect.persistence.verification.VerificationDao
import org.springframework.stereotype.Service
import java.util.*

@Service
class PaymentService(
    private val verificationDao: VerificationDao
) {
    fun verify(walletAddress: String, paymentAmount: Long, earliestBlockTime: Date): PaymentConfirmation {
        val qualifyingTransactions =
            verificationDao.getQualifyingTransactions(walletAddress, paymentAmount, earliestBlockTime)
        if (qualifyingTransactions.isNotEmpty()) {
            val firstTransaction = qualifyingTransactions[0]
            return PaymentConfirmation(firstTransaction.hash)
        }
        throw NoTransactionFoundException("No transaction found for wallet address $walletAddress and payment amount $paymentAmount")
    }
}