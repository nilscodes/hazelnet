package io.hazelnet.community.services

import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.ExternalAccountPremiumInfo
import io.hazelnet.community.data.ExternalAccountType
import io.hazelnet.community.data.Verification
import io.hazelnet.community.data.premium.PremiumStakedInfo
import io.hazelnet.community.persistence.DiscordServerRepository
import io.hazelnet.community.persistence.ExternalAccountRepository
import io.hazelnet.community.persistence.VerificationRepository
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*
import javax.transaction.Transactional
import kotlin.NoSuchElementException

@Service
class ExternalAccountService(
    private val externalAccountRepository: ExternalAccountRepository,
    private val verificationRepository: VerificationRepository,
    private val discordServerRepository: DiscordServerRepository,
    private val config: CommunityApplicationConfiguration,
    private val stakepoolService: StakepoolService,
    private val connectService: ConnectService,
) {
    fun createExternalAccount(externalAccount: ExternalAccount): ExternalAccount {
        externalAccount.registrationTime = Date.from(ZonedDateTime.now().toInstant())
        return externalAccountRepository.save(externalAccount)
    }

    fun getExternalAccount(externalAccountId: Long): ExternalAccount = externalAccountRepository.findById(externalAccountId).orElseThrow()
    fun setExternalAccountForDiscordUser(externalAccount: ExternalAccount, discordUserId: Long): ExternalAccount {
        val existingExternalAccount = externalAccountRepository.findByReferenceId(discordUserId.toString())
        if(existingExternalAccount.isEmpty || existingExternalAccount.get().type != ExternalAccountType.DISCORD)
        {
            externalAccount.referenceId = discordUserId.toString()
            externalAccount.type = ExternalAccountType.DISCORD
            return createExternalAccount(externalAccount)
        }
        return existingExternalAccount.get()
    }

    fun getExternalAccountVerifications(externalAccountId: Long): List<Verification> {
        val externalAccount = getExternalAccount(externalAccountId) // Ensure account exists
        return verificationRepository.findAllByExternalAccount(externalAccount)
    }

    fun getVerifiedStakeAddressesForExternalAccount(externalAccountId: Long): Set<String> {
        val verifications = getExternalAccountVerifications(externalAccountId)
        return verifications
            .filter { it.confirmed && !it.obsolete && it.cardanoStakeAddress != null }
            .map { it.cardanoStakeAddress!! }
            .toSet()
    }

    fun getExternalAccountForDiscordUser(discordUserId: Long): ExternalAccount {
        val existingExternalAccount = externalAccountRepository.findByReferenceId(discordUserId.toString())
        if(existingExternalAccount.isEmpty || existingExternalAccount.get().type != ExternalAccountType.DISCORD)
        {
            throw NoSuchElementException("No external account found for Discord user id $discordUserId")
        }
        return existingExternalAccount.get()
    }

    fun getPremiumInfo(externalAccountId: Long): ExternalAccountPremiumInfo {
        getExternalAccount(externalAccountId) // Ensure account exists
        val verifiedStakeAddresses = getVerifiedStakeAddressesForExternalAccount(externalAccountId)
        if (config.fundedpool != null) {
            val premiumDelegationInfo = stakepoolService.getDelegation(config.fundedpool)
            val totalAmountStaked = premiumDelegationInfo
                .filter { verifiedStakeAddresses.contains(it.stakeAddress) }
                .sumOf { it.amount }
            val discordServers = discordServerRepository.getDiscordServersForPremiumMember(externalAccountId)
            return ExternalAccountPremiumInfo(discordServers, totalAmountStaked, 0)
        }
        return ExternalAccountPremiumInfo(emptyList(), 0, 0)
    }

    @Transactional
    @Scheduled(cron = "0 0 0 * * *", zone = "UTC")
    fun storePremiumSnapshot() {
        if (config.fundedpool != null) {
            val lastSnapshottedEpoch = externalAccountRepository.getLastSnapshottedEpoch()
            val currentEpoch = connectService.getCurrentEpoch()
            if (lastSnapshottedEpoch.isEmpty || currentEpoch > lastSnapshottedEpoch.get()) {
                val snapshotTime = Date.from(ZonedDateTime.now().toInstant())
                val externalAccountsToDelegationMap = mutableMapOf<ExternalAccount, Long>()
                val delegationSnapshot =
                    connectService.getDelegationSnapshotForPools(listOf(config.fundedpool), currentEpoch)
                delegationSnapshot.forEach {
                    val e = externalAccountRepository.findByVerifiedStakeAddress(it.stakeAddress)
                    if (e.isPresent) {
                        externalAccountsToDelegationMap.compute(e.get()) { _, v -> (v ?: 0) + it.amount }
                    }
                }
                externalAccountsToDelegationMap.forEach {
                    it.key.stakeInfo.add(PremiumStakedInfo(currentEpoch, it.value, snapshotTime))
                    externalAccountRepository.save(it.key)
                }
            }
        }
    }
}