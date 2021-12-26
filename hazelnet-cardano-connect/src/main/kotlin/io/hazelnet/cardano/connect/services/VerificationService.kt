package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.verifications.VerificationConfirmation
import io.hazelnet.cardano.connect.persistence.verification.VerificationDao
import org.springframework.stereotype.Service
import java.util.*

@Service
class VerificationService(
        private val verificationDao : VerificationDao
) {
    fun verify(walletAddress : String, verificationAmount : Long, earliestBlockTime : Date) : VerificationConfirmation {
        val qualifyingTransactions = verificationDao.getQualifyingTransactions(walletAddress, verificationAmount, earliestBlockTime)
        for(transaction in qualifyingTransactions)
        {
            val associatedStakeAddresses = verificationDao.getQualifyingStakeAddresses(transaction.id)
            if(associatedStakeAddresses.size == 1)
            {
                return VerificationConfirmation(associatedStakeAddresses.first(), transaction.hash)
            }
        }
        throw IllegalArgumentException()
    }
}