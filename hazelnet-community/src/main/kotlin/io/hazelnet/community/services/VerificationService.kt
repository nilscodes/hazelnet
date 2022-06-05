package io.hazelnet.community.services

import io.hazelnet.community.data.*
import io.hazelnet.community.persistence.ExternalAccountRepository
import io.hazelnet.community.persistence.VerificationImportRepository
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
    private val verificationImportRepository: VerificationImportRepository,
    private val externalAccountRepository: ExternalAccountRepository,
    private val globalCommunityService: GlobalCommunityService
) {
    @Transactional
    fun createVerificationRequest(verificationRequest: VerificationRequest): Verification {
        val associatedExternalAccount = externalAccountRepository.findById(verificationRequest.externalAccountId)
        if (associatedExternalAccount.isPresent) {
            val walletInfo = connectService.getWalletInfo(verificationRequest.address)
            if (walletInfo.stakeAddress != null) {
                return generateAndSaveVerificationRequest(verificationRequest, associatedExternalAccount.get())
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
        val maxVerificationWaitTimeInMinutes = getMaxVerificationWaitTimeInMinutes()
        val verificationAmount = getUniqueVerificationAmount()
        val validAfter = ZonedDateTime.now().toInstant()
        val validBefore = validAfter.plus(maxVerificationWaitTimeInMinutes, ChronoUnit.MINUTES)
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

    private fun getMaxVerificationWaitTimeInMinutes(): Long {
        return try {
            globalCommunityService.getSettings().getOrDefault("VERIFICATION_TIMEOUT_MINUTES", "15").toLong()
        } catch (e: NumberFormatException) {
            15
        }
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
        val syncStatus = connectService.getSyncInfo()
        val minutesUntilConsideredDesynchronized = 15 * 60;
        if (syncStatus.getSecondsSinceLastSync() > minutesUntilConsideredDesynchronized) {
            verificationRepository.bumpObsoleteTime(Date(), Date(System.currentTimeMillis() + minutesUntilConsideredDesynchronized * 1000L))
        }
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
                verificationRepository.invalidateOutdatedVerifications(verification.cardanoStakeAddress!!, verification.id!!)
            } catch (e: WebClientResponseException) {
                logger.debug { "No valid verification found for ${verification.address} for verification with ID ${verification.id}" }
            }
        }
    }

    fun deleteVerification(verificationId: Long) {
        verificationRepository.deleteById(verificationId)
    }

    fun getAllCompletedVerificationsForDiscordServer(discordServerId: Int) =
        verificationRepository.getAllCompletedVerificationsForDiscordServer(discordServerId)

    @Transactional
    fun importExternalVerifications(externalAccount: ExternalAccount): List<VerificationImport> {
        val importableVerifications = verificationImportRepository.findByReferenceIdAndType(externalAccount.referenceId, externalAccount.type)
        val importedVerifications = mutableListOf<VerificationImport>()
        importableVerifications.forEach {
            val walletInfo = connectService.getWalletInfo(it.address)
            if (walletInfo.stakeAddress != null) {
                val stakeAddress = walletInfo.stakeAddress!!
                val verificationsWithSameStakeAddress =
                    verificationRepository.findAllByCardanoStakeAddress(stakeAddress)
                if (verificationsWithSameStakeAddress.isEmpty()) {
                    val now = ZonedDateTime.now().toInstant()
                    verificationRepository.save(Verification(
                        id = null,
                        amount = 0,
                        blockchain = BlockchainType.CARDANO,
                        address = it.address,
                        cardanoStakeAddress = stakeAddress,
                        transactionHash = it.source,
                        externalAccount = externalAccount,
                        validAfter = Date.from(now),
                        validBefore = Date.from(now),
                        confirmed = true,
                        confirmedAt = Date.from(now),
                        obsolete = false
                    ))
                    importedVerifications.add(it)
                } else {
                    logger.info { "Tried to import verification for ${externalAccount.type} account with reference ID ${externalAccount.referenceId}, but stake address $stakeAddress is already verified. Deleting entry." }
                }
            }
            verificationImportRepository.delete(it)
        }
        return importedVerifications
    }
}