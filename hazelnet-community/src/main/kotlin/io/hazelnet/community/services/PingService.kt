package io.hazelnet.community.services

import io.hazelnet.community.data.Account
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.ping.*
import io.hazelnet.community.persistence.PingRepository
import io.hazelnet.community.persistence.VerificationRepository
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit
import java.util.*
import kotlin.math.ceil

@Service
class PingService(
    private val pingRepository: PingRepository,
    private val externalAccountService: ExternalAccountService,
    private val accountService: AccountService,
    private val discordServerRetriever: DiscordServerRetriever,
    private val connectService: ConnectService,
    private val verificationRepository: VerificationRepository,
) {

    fun addPing(externalAccountPing: ExternalAccountPingDto): ExternalAccountPingDto {
        val sender = externalAccountService.getExternalAccount(externalAccountPing.sender)
        val discordServer = if (externalAccountPing.sentFromServer != null) {
            discordServerRetriever.getDiscordServerByInternalId(externalAccountPing.sentFromServer)
        } else {
            null
        }
        verifyPingCanBeSent(sender)
        val recipientExternalAccount = this.lookupRecipient(externalAccountPing.recipientAddress)
        val recipient = accountService.setAccountForExternalAccount(recipientExternalAccount.id!!)
        val disableReceivePingsSetting = recipient.settings.find { it.name == "OPTION_RECEIVEPINGS" }
        val sendPing = (disableReceivePingsSetting == null || disableReceivePingsSetting.value == "true")
        val newPing = pingRepository.save(
            ExternalAccountPing(
                id = null,
                sender = sender,
                recipient = recipient,
                recipientAddress = externalAccountPing.recipientAddress,
                senderMessage = externalAccountPing.senderMessage,
                sentFromServer = discordServer,
                createTime = Date.from(ZonedDateTime.now().toInstant())
            )
        )
        return ExternalAccountPingDto(
            id = newPing.id,
            sender = sender.id!!,
            senderLocal = sender.referenceId.toLong(),
            recipient = recipient.id!!,
            sentFromServer = discordServer?.id,
            recipientAddress = externalAccountPing.recipientAddress,
            recipientLocal = if(sendPing) recipientExternalAccount.referenceId.toLong() else null,
            senderMessage = externalAccountPing.senderMessage,
            createTime = newPing.createTime
        )
    }

    fun lookupRecipient(recipientAddress: String): ExternalAccount {
        var stakeAddress: String? = null
        if (recipientAddress[0] == '$') {
            val handle = connectService.resolveHandle(recipientAddress.substring(1))
            if (handle.resolved) {
                stakeAddress = lookupWalletAddress(handle.address!!)
            }
        } else if (recipientAddress.startsWith("addr1")) {
            stakeAddress = lookupWalletAddress(recipientAddress)
        } else if (recipientAddress.startsWith("asset1")) {
            stakeAddress = connectService.getWalletForAsset(recipientAddress).stakeAddress
        } else {
            stakeAddress = recipientAddress
        }
        if (stakeAddress != null) {
            val verificationsWithSameStakeAddress =
                verificationRepository.findAllByCardanoStakeAddress(stakeAddress)
                    .filter { v -> !v.obsolete && v.confirmed }
            if (verificationsWithSameStakeAddress.isNotEmpty()) {
                return verificationsWithSameStakeAddress.first().externalAccount
            }
        }
        throw PingTargetNotFoundException("No verified user for recipient target $recipientAddress found")
    }

    private fun lookupWalletAddress(walletAddress: String): String? {
        val walletInfo = connectService.getWalletInfo(walletAddress)
        return walletInfo.stakeAddress
    }

    fun getExternalAccountPings(externalAccountId: Long): List<ExternalAccountPingDto> {
        val externalAccount = externalAccountService.getExternalAccount(externalAccountId) // Ensure account exists
        val account = accountService.setAccountForExternalAccount(externalAccountId) // Ensure main account exists
        val allPings = getAllPingsForUser(externalAccount, account)
        return allPings
            .distinctBy { it.id } // Filter out duplicates due to self-pings
            .map {
                ExternalAccountPingDto(
                    id = it.id,
                    sender = it.sender.id!!,
                    senderLocal = it.sender.referenceId.toLong(),
                    recipient = it.recipient.id!!,
                    sentFromServer = it.sentFromServer?.id,
                    recipientAddress = it.recipientAddress,
                    recipientLocal = null,
                    senderMessage = it.senderMessage,
                    sentTime = it.sentTime,
                    createTime = it.createTime,
                    reported = it.reported
                )
            }
    }

    fun updateExternalAccountPing(externalAccountId: Long, pingId: Long, externalAccountPingPartial: ExternalAccountPingPartial): ExternalAccountPing {
        val externalAccount = externalAccountService.getExternalAccount(externalAccountId) // Ensure account exists
        val account = accountService.setAccountForExternalAccount(externalAccountId) // Ensure main account exists
        val sentPings = pingRepository.findAllBySender(externalAccount)
        var pingToPatch = sentPings.find { it.id == pingId }
        if (pingToPatch == null) {
            val receivedPings = pingRepository.findAllByRecipient(account)
            pingToPatch = receivedPings.find { it.id == pingId }
        }
        if (pingToPatch != null) {
            if (externalAccountPingPartial.sentTime != null && pingToPatch.sender.id == externalAccount.id) {
                // Only senders can set the sentTime, and we prevent this if they do not have the rights to send it
                verifyPingCanBeSent(externalAccount)
                pingToPatch.sentTime = externalAccountPingPartial.sentTime
            }
            if (externalAccountPingPartial.reported != null && pingToPatch.recipient.id == account.id) {
                // Only recipients can report a ping
                pingToPatch.reported = externalAccountPingPartial.reported
            }
            return pingRepository.save(pingToPatch)
        }
        throw NoSuchElementException()
    }

    fun getAllPingsForUser(externalAccount: ExternalAccount, account: Account): List<ExternalAccountPing> {
        val sentPings = pingRepository.findAllBySender(externalAccount)
        val receivedPings = pingRepository.findAllByRecipient(account)
        return (sentPings + receivedPings)
    }

    fun verifyPingCanBeSent(sender: ExternalAccount) {
        val lastPing = pingRepository.getLastPingSent(sender)
        val currentTime = ZonedDateTime.now().toInstant()
        val sendLimit = if (sender.premium) 5L else 60L
        val lastPingBefore = currentTime.minus(sendLimit, ChronoUnit.MINUTES)
        val canSendPing = lastPing.isEmpty || lastPing.get().before(Date.from(lastPingBefore))
        if (!canSendPing) {
            throw LastPingTooRecentException(
                "Last ping was too recent (at ${lastPing.get()})",
                ceil((currentTime.epochSecond - (lastPing.get().time / 1000.0)) / 60).toInt()
            )
        }
    }

    @Scheduled(fixedDelay = 3600000)
    fun deletedObsoletePings() {
        val expirationDateForUnsentPings = Date.from(ZonedDateTime.now().toInstant().minus(60, ChronoUnit.MINUTES))
        pingRepository.removeUnsentPings(expirationDateForUnsentPings)
        val expirationDateForSentPings = Date.from(ZonedDateTime.now().toInstant().minus(24 * 7, ChronoUnit.HOURS))
        pingRepository.removeSentPings(expirationDateForSentPings)
    }

}