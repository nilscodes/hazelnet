package io.hazelnet.community.services

import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.premium.DiscordBilling
import io.hazelnet.community.data.premium.DiscordPayment
import io.hazelnet.community.data.premium.DiscordServerPremiumInfo
import io.hazelnet.community.persistence.DiscordBillingRepository
import io.hazelnet.community.persistence.DiscordPaymentRepository
import io.hazelnet.community.persistence.DiscordServerRepository
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.time.temporal.TemporalAdjusters
import java.util.*
import javax.transaction.Transactional
import kotlin.math.ceil
import kotlin.math.min
import kotlin.math.round

@Service
class BillingService(
    private val config: CommunityApplicationConfiguration,
    private val stakepoolService: StakepoolService,
    private val discordServerService: DiscordServerService,
    private val discordServerRepository: DiscordServerRepository,
    private val billingRepository: DiscordBillingRepository,
    private val paymentRepository: DiscordPaymentRepository
) {

    @Transactional
    @Scheduled(fixedDelay = 60000, initialDelay = 5000)
    fun billPremiumStatus() {
        val currentTime = ZonedDateTime.now()
        val endOfMonth = ZonedDateTime.now()
            .with(TemporalAdjusters.lastDayOfMonth())
            .withHour(23).withMinute(59).withSecond(59)
        billPremiumStatusWithTimes(currentTime, endOfMonth)
    }

    fun billPremiumStatusWithTimes(currentTime: ZonedDateTime, endOfMonth: ZonedDateTime) {
        val percentageOfMonthCompleted = (currentTime.dayOfMonth - 1.0) / endOfMonth.dayOfMonth
        val discordServers = discordServerService.getDiscordServers()
        discordServers.forEach { discordServer ->
            if (discordServer.premiumUntil == null || Date().after(discordServer.premiumUntil)) {
                val monthlyCost = calculateMonthlyTotalCostInLovelace(discordServer.guildMemberCount)
                val currentDelegation = getBotFunding(discordServer.guildId)
                val maxDelegation = calculateMaximumDelegationDiscountAmountInLovelace(discordServer.guildMemberCount)
                val actualMonthlyCost = calculateMonthlyActualCostInLovelace(monthlyCost, currentDelegation, maxDelegation)
                val proratedCost = ((1 - percentageOfMonthCompleted) * actualMonthlyCost).toLong()
                val currentBalance = getCurrentBalance(discordServer)
                if (currentBalance.orElse(0) > 0 || proratedCost == 0L) {
                    val bill = billingRepository.save(
                        DiscordBilling(null, discordServer, Date.from(currentTime.toInstant()), proratedCost, discordServer.guildMemberCount, maxDelegation, currentDelegation )
                    )
                    paymentRepository.save(
                        DiscordPayment(null, discordServer, null, Date.from(currentTime.toInstant()), -proratedCost, bill)
                    )
                    discordServer.premiumUntil = Date.from(endOfMonth.toInstant())
                    discordServerRepository.save(discordServer)
                }
            }
        }
    }

    fun getPremiumInfo(guildId: Long): DiscordServerPremiumInfo {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val monthlyCost = calculateMonthlyTotalCostInLovelace(discordServer.guildMemberCount)
        val currentDelegation = getBotFunding(discordServer.guildId)
        val maxDelegation = calculateMaximumDelegationDiscountAmountInLovelace(discordServer.guildMemberCount)
        val actualMonthlyCost = calculateMonthlyActualCostInLovelace(monthlyCost, currentDelegation, maxDelegation)
        val currentBalance = getCurrentBalance(discordServer)
        val lastBilling = billingRepository.findFirstByDiscordServerIdOrderByBillingTimeDesc(discordServer.id!!)
        return DiscordServerPremiumInfo(
            currentDelegation,
            maxDelegation,
            monthlyCost,
            actualMonthlyCost,
            discordServer.guildMemberCount,
            currentBalance.orElse(0),
            if (lastBilling.isPresent) lastBilling.get().memberCount else 0,
            if (lastBilling.isPresent) lastBilling.get().billingTime else null,
            if (lastBilling.isPresent) lastBilling.get().amount else 0,
            discordServer.premiumUntil,
            discordServer.getPremium(),
        )
    }

    fun getBotFunding(guildId: Long): Long {
        if(config.fundedpool != null) {
            val discordServer = discordServerService.getDiscordServer(guildId)
            val discordMemberDelegations = discordServerRepository.getDiscordMembersWithStakeAndPremiumPledge(discordServer.id!!)
            val stakeAddressesOnThisServer = discordMemberDelegations
                .filter { it.getDiscordServerId() == discordServer.id }
                .map { it.getCardanoStakeAddress() }
            // Get a map of stake addresses to number of servers each unique stake address is registered on
            val stakeAddressesToServerMembershipCounts = discordMemberDelegations
                .groupBy { it.getCardanoStakeAddress() }
                .mapValues {
                    it.value.distinctBy {
                        stakeInfo -> "${stakeInfo.getDiscordServerId()}.${stakeInfo.getCardanoStakeAddress()}"
                    }.size
                }
            val allDelegationToFundedPool = stakepoolService.getDelegation(config.fundedpool)
            // Divide each stake amount by the number of Discord servers the respective stake is pledged to, then sum it up
            return allDelegationToFundedPool
                .filter { stakeAddressesOnThisServer.contains(it.stakeAddress) }
                .sumOf {
                    it.amount / (stakeAddressesToServerMembershipCounts[it.stakeAddress] ?: 1)
                }
        }
        return 0
    }

    fun getCurrentBalance(discordServer: DiscordServer) =
        paymentRepository.getCurrentBalance(discordServer.id!!)

    fun calculateMonthlyActualCostInLovelace(monthlyCost: Long, currentDelegation: Long, maxDelegation: Long): Long {
        return round(monthlyCost * (1 - min(1.0, currentDelegation.toDouble() / maxDelegation.toDouble()))).toLong()
    }

    fun calculateMaximumDelegationDiscountAmountInLovelace(memberCount: Int): Long {
        return memberCount * 10000000L
    }

    fun calculateMonthlyTotalCostInLovelace(memberCount: Int): Long {
        return 1000000L * if (memberCount < 1000) {
            10
        } else if(memberCount < 5000) {
            20
        } else if(memberCount < 10000) {
            30
        } else if(memberCount < 25000) {
            40
        } else if(memberCount < 50000) {
            50
        } else if(memberCount < 100000) {
            60
        } else {
            70
        }
    }
}