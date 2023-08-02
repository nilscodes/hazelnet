package io.hazelnet.community.services

import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.*
import io.hazelnet.community.data.premium.PremiumStakedInfo
import io.hazelnet.community.persistence.DiscordServerRepository
import io.hazelnet.community.persistence.ExternalAccountRepository
import io.hazelnet.community.persistence.VerificationRepository
import io.hazelnet.shared.data.ExternalAccountType
import io.micrometer.core.instrument.Gauge
import io.micrometer.core.instrument.MeterRegistry
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*
import javax.transaction.Transactional

@Service
class ExternalAccountService(
    private val externalAccountRepository: ExternalAccountRepository,
    private val verificationRepository: VerificationRepository,
    private val discordServerRepository: DiscordServerRepository,
    private val config: CommunityApplicationConfiguration,
    private val stakepoolService: StakepoolService,
    private val connectService: ConnectService,
    meterRegistry: MeterRegistry,
) {
    init {
        Gauge.builder("discord_lifetime_unique_user_count", externalAccountRepository) {
            it.countByType(ExternalAccountType.DISCORD).toDouble()
        }
            .description("Lifetime number of unique Discord users interacting with the bot")
            .register(meterRegistry)

        Gauge.builder("discord_current_premium_user_count", externalAccountRepository) {
            it.countByTypeAndPremium(ExternalAccountType.DISCORD, true).toDouble()
        }
            .description("Current number of premium Discord users")
            .register(meterRegistry)
    }

    fun createExternalAccount(externalAccount: ExternalAccount): ExternalAccount {
        externalAccount.registrationTime = Date.from(ZonedDateTime.now().toInstant())
        return externalAccountRepository.save(externalAccount)
    }

    fun getExternalAccount(externalAccountId: Long): ExternalAccount = externalAccountRepository.findById(externalAccountId).orElseThrow()

    fun getExternalAccountsForAccount(account: Account): List<ExternalAccount> = externalAccountRepository.findByAccount(account)

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

    @Transactional
    fun addExternalAccountVerification(externalAccountId: Long, verification: VerificationDto): Verification {
        val externalAccount = getExternalAccount(externalAccountId) // Ensure account exists
        val newVerification = Verification(
            id = null,
            externalAccount = externalAccount,
            address = verification.address,
            blockchain = verification.blockchain,
            cardanoStakeAddress = verification.cardanoStakeAddress,
            transactionHash = verification.transactionHash,
            amount = verification.amount,
            validAfter = verification.validAfter,
            validBefore = verification.validBefore,
            confirmed = verification.confirmed,
            confirmedAt = verification.confirmedAt,
            obsolete = verification.obsolete,
            succeededBy = verification.succeededBy,
        )
        val createdVerification = verificationRepository.save(newVerification);
        verificationRepository.invalidateOutdatedVerifications(createdVerification.cardanoStakeAddress!!, createdVerification.id!!)
        return createdVerification
    }

    fun getVerifiedStakeAddressesForExternalAccount(externalAccountId: Long): Set<String> {
        return getConfirmedExternalAccountVerifications(externalAccountId)
            .map { it.cardanoStakeAddress!! }
            .toSet()
    }

    fun getConfirmedExternalAccountVerifications(externalAccountId: Long): List<Verification> {
        val verifications = getExternalAccountVerifications(externalAccountId)
        return verifications
            .filter { it.confirmed && !it.obsolete && it.cardanoStakeAddress != null }
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
        val externalAccount = getExternalAccount(externalAccountId) // Ensure account exists
        if (config.fundedpool != null) {
            val verifiedStakeAddresses = getVerifiedStakeAddressesForExternalAccount(externalAccountId)
            val premiumDelegationInfo = stakepoolService.getDelegation(config.fundedpool)
            val totalAmountStaked = premiumDelegationInfo
                .filter { verifiedStakeAddresses.contains(it.stakeAddress) }
                .sumOf { it.amount }
            val discordServers = discordServerRepository.getDiscordServersForPremiumMember(externalAccountId)
            val premiumInfo = ExternalAccountPremiumInfo(discordServers, totalAmountStaked, 0)
            if (premiumInfo.isPremium()) {
                externalAccount.premium = true
                externalAccountRepository.save(externalAccount)
            }
            return premiumInfo
        }
        return ExternalAccountPremiumInfo(emptyList(), 0, 0)
    }

    @Transactional
    @Scheduled(cron = "0 0 0 * * *", zone = "UTC")
    fun storePremiumSnapshot() {
        if (config.fundedpool != null) {
            val lastSnapshottedEpoch = externalAccountRepository.getLastSnapshottedEpoch()
            val currentEpoch = connectService.getSyncInfo().currentEpoch
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

    @Transactional
    @Scheduled(cron = "0 15 0 * * *", zone = "UTC")
    fun updatePremiumAccounts() {
        if (config.fundedpool != null) {
            val oldPremiums = externalAccountRepository.findByPremium(true).toMutableList()
            val allDelegationToFundedPool = stakepoolService.getDelegation(config.fundedpool)
            allDelegationToFundedPool
                .filter { it.amount > 0 }
                .forEach { delegation ->
                    val maybeExternalAccount =
                        externalAccountRepository.findByVerifiedStakeAddress(delegation.stakeAddress)
                    maybeExternalAccount.ifPresent { externalAccount ->
                        if (!externalAccount.premium) {
                            externalAccount.premium = true
                            externalAccountRepository.save(externalAccount)
                        }
                        oldPremiums.removeIf { it.id == externalAccount.id }
                    }
                }
            // Remove premium for anyone who is not delegating any more
            oldPremiums.forEach {
                it.premium = false
                externalAccountRepository.save(it)
            }
        }
    }

    fun updateExternalAccount(externalAccount: ExternalAccount) = externalAccountRepository.save(externalAccount)

}