package io.hazelnet.community.services

import io.hazelnet.community.data.*
import io.hazelnet.community.persistence.ExternalAccountRepository
import io.hazelnet.community.persistence.VerificationRepository
import mu.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClientResponseException
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit
import java.util.*
import javax.transaction.Transactional

private val logger = KotlinLogging.logger {}

@Service
class VerificationService(
    private val connectService: ConnectService,
    private val verificationRepository: VerificationRepository,
    private val externalAccountRepository: ExternalAccountRepository
) {
    @Transactional
    fun createVerificationRequest(verificationRequest: VerificationRequest): Verification {
        val associatedExternalAccount = externalAccountRepository.findById(verificationRequest.externalAccountId)
        if (associatedExternalAccount.isPresent) {
            val walletInfo = connectService.getWalletInfo(verificationRequest.address)
            if (walletInfo.stakeAddress != null) {
                val verificationsWithSameStakeAddress =
                    verificationRepository.findAllByCardanoStakeAddress(walletInfo.stakeAddress!!)
                if (verificationsWithSameStakeAddress.isEmpty()) {
                    return generateAndSaveVerificationRequest(verificationRequest, associatedExternalAccount.get())
                } else {
                    throw StakeAddressInUseException("The stake address ${walletInfo.stakeAddress} that belongs to address ${verificationRequest.address} is already in use.")
                }
            } else {
                throw InvalidAddressException("The address ${verificationRequest.address} does not have a valid stake address associated with it.")
            }
        } else {
            throw NoSuchElementException("No external account found matching this external account ID: " + verificationRequest.externalAccountId)
        }
    }

    private fun generateAndSaveVerificationRequest(
        verificationRequest: VerificationRequest,
        associatedExternalAccount: ExternalAccount
    ): Verification {
        val verificationAmount = getUniqueVerificationAmount()
        val validAfter = ZonedDateTime.now().toInstant()
        val validBefore = validAfter.plus(15, ChronoUnit.MINUTES)
        val newVerification = Verification(
            null,
            verificationAmount,
            verificationRequest.blockchain,
            verificationRequest.address,
            null,
            null,
            associatedExternalAccount,
            Date.from(validAfter),
            Date.from(validBefore),
            false,
            null,
            false
        )
        return verificationRepository.save(newVerification)
    }

    private fun getUniqueVerificationAmount(): Long {
        val outstandingVerifications = verificationRepository.findAllOutstanding()
        val usedAmounts = outstandingVerifications.map { it.amount }
        var verificationAmount: Long
        var amountFound = false
        do {
            verificationAmount = (2000000..2999999).random().toLong()
            if (!usedAmounts.contains(verificationAmount)) {
                amountFound = true
            }
        } while (!amountFound)
        return verificationAmount
    }

    fun getVerificationInfo(verificationId: Long): Verification {
        return verificationRepository.findById(verificationId).orElseThrow()
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 5000)
    fun runVerifications() {
        verificationRepository.markObsolete(Date())
        val outstandingVerifications = verificationRepository.findAllOutstanding()
        for (verification in outstandingVerifications) {
            try {
                val confirmation = connectService.getVerificationStatus(verification)
                verification.cardanoStakeAddress = confirmation.stakeAddress
                verification.transactionHash = confirmation.transactionHash
                verification.confirmed = true
                verification.confirmedAt = Date.from(ZonedDateTime.now().toInstant())
                verificationRepository.save(verification)
            } catch (e: WebClientResponseException) {
                logger.info { "No valid verification found for ${verification.address} for verification with ID ${verification.id}" }
            }
        }
    }


    fun deleteVerification(verificationId: Long) {
        verificationRepository.deleteById(verificationId)
    }

    fun getAllCompletedVerificationsForDiscordServer(discordServerId: Int) =
        verificationRepository.getAllCompletedVerificationsForDiscordServer(discordServerId)
}