package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.payment.PaymentConfirmation
import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.AdminAnnouncement
import io.hazelnet.community.data.AdminAnnouncementType
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.premium.DiscordBilling
import io.hazelnet.community.data.premium.DiscordPayment
import io.hazelnet.community.data.premium.DiscordServerPremiumInfo
import io.hazelnet.community.data.premium.IncomingDiscordPayment
import io.hazelnet.community.persistence.DiscordBillingRepository
import io.hazelnet.community.persistence.DiscordPaymentRepository
import io.hazelnet.community.persistence.DiscordServerRepository
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalAdjusters
import java.util.*
import javax.transaction.Transactional
import kotlin.math.min
import kotlin.math.round

val REFERRAL_BONUS_MONTHS = mapOf(Pair("re23", 30))

@Service
class BillingService(
    private val config: CommunityApplicationConfiguration,
    private val stakepoolService: StakepoolService,
    private val discordServerService: DiscordServerService,
    private val discordServerRepository: DiscordServerRepository,
    private val billingRepository: DiscordBillingRepository,
    private val paymentRepository: DiscordPaymentRepository,
    private val rabbitTemplate: RabbitTemplate,
) {

    /**
     * Everything in this and the callee methods works with ZonedDateTime in UTC.
     * Be careful when mixing this with date comparisons with other tables or Date() objects.
     */
    @Transactional
    @Scheduled(fixedDelay = 60000, initialDelay = 5000)
    fun billPremiumStatus() {
        val currentTime = ZonedDateTime.now(ZoneId.of("UTC"))
        val endOfMonth = ZonedDateTime.now(ZoneId.of("UTC"))
            .with(TemporalAdjusters.lastDayOfMonth())
            .withHour(23).withMinute(59).withSecond(59)
        billPremiumStatusWithTimes(currentTime, endOfMonth)
    }

    @Transactional
    @Scheduled(fixedDelay = 60000, initialDelay = 5000)
    fun applyReferralBonuses() {
        val currentTime = ZonedDateTime.now(ZoneId.of("UTC"))
        REFERRAL_BONUS_MONTHS.entries.forEach {
            val unpaidReferrals = discordServerRepository.findByReferralAndReferralPaidOut(it.key, false)
            unpaidReferrals.forEach { discordServer ->
                var startDate = currentTime
                if (discordServer.premiumUntil != null) {
                    val premiumUntil = discordServer.premiumUntil!!.toInstant().atZone(ZoneId.of("UTC"))
                    if (premiumUntil.isAfter(startDate)) {
                        startDate = premiumUntil
                    }
                }
                discordServer.premiumUntil = Date.from(startDate.plusDays(it.value.toLong()).toInstant())
                discordServer.referralPaidOut = true
                discordServerRepository.save(discordServer)
                val bill = billingRepository.save(
                    DiscordBilling(null, discordServer, Date.from(currentTime.toInstant()), 0, discordServer.guildMemberCount, 0, 0 )
                )
                paymentRepository.save(
                    DiscordPayment(null, discordServer, it.key, Date.from(currentTime.toInstant()), 0, bill)
                )
            }
        }
    }

    fun billPremiumStatusWithTimes(currentTime: ZonedDateTime, endOfMonth: ZonedDateTime) {
        val percentageOfMonthCompleted = (currentTime.dayOfMonth - 1.0) / endOfMonth.dayOfMonth
        val discordServers = discordServerService.getDiscordServers()
        discordServers.forEach { discordServer ->
            if (discordServer.premiumUntil == null || currentTime.isAfter(ZonedDateTime.ofInstant(discordServer.premiumUntil!!.toInstant(), ZoneId.of("UTC")))) {
                val premiumInfo = getPremiumInfoForServer(discordServer, false)
                val proratedCost = ((1 - percentageOfMonthCompleted) * premiumInfo.actualMonthlyCost).toLong()
                val serverIsSponsored = discordServer.settings.any { it.name == "SPONSORED_BY" }
                if (serverIsSponsored || premiumInfo.remainingBalance > 0 || (proratedCost == 0L && premiumInfo.remainingBalance >= 0)) {
                    val bill = billingRepository.save(
                        DiscordBilling(null, discordServer, Date.from(currentTime.toInstant()), proratedCost, discordServer.guildMemberCount, premiumInfo.maxDelegation, premiumInfo.totalDelegation )
                    )
                    paymentRepository.save(
                        DiscordPayment(null, discordServer, null, Date.from(currentTime.toInstant()), -proratedCost, bill)
                    )
                    discordServer.premiumUntil = Date.from(endOfMonth.withZoneSameInstant(ZoneId.of("UTC")).toInstant())
                    discordServerRepository.save(discordServer)
                }
            }
        }
    }

    fun getPremiumInfo(guildId: Long): DiscordServerPremiumInfo {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return getPremiumInfoForServer(discordServer, true)
    }

    private fun getPremiumInfoForServer(discordServer: DiscordServer, includeLastBilling: Boolean): DiscordServerPremiumInfo {
        val monthlyCost = calculateMonthlyTotalCostInLovelace(discordServer.guildMemberCount)
        val currentDelegation = getBotFunding(discordServer.guildId)
        val maxDelegation = calculateMaximumDelegationDiscountAmountInLovelace(discordServer.guildMemberCount)
        val actualMonthlyCost = calculateMonthlyActualCostInLovelace(monthlyCost, currentDelegation, maxDelegation)
        val currentBalance = getCurrentBalance(discordServer).orElse(0)
        val lastBilling = if (includeLastBilling) billingRepository.findFirstByDiscordServerIdOrderByBillingTimeDesc(discordServer.id!!) else Optional.empty()
        return DiscordServerPremiumInfo(
            currentDelegation,
            maxDelegation,
            monthlyCost,
            actualMonthlyCost,
            discordServer.guildMemberCount,
            currentBalance,
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
                    val declaredPercentage = discordMemberDelegations.find { delegation -> delegation.getCardanoStakeAddress() == it.stakeAddress }?.getStakePercentage() ?: -1
                    val percentage = if (declaredPercentage >= 0) declaredPercentage / 100.0 else 1.0 / stakeAddressesToServerMembershipCounts[it.stakeAddress]!!
                    (it.amount * percentage).toLong()
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
        return memberCount * 20000000L
    }

    fun calculateMonthlyTotalCostInLovelace(memberCount: Int): Long {
        return 1000000L * if (memberCount < 1000) {
            50
        } else if(memberCount < 5000) {
            100
        } else if(memberCount < 10000) {
            150
        } else if(memberCount < 25000) {
            200
        } else if(memberCount < 50000) {
            250
        } else if(memberCount < 100000) {
            300
        } else if(memberCount < 250000) {
            350
        } else {
            400
        }
    }

    fun confirmPayment(incomingDiscordPayment: IncomingDiscordPayment, confirmation: PaymentConfirmation): DiscordPayment {
        val currentTime = ZonedDateTime.now()
        return paymentRepository.save(DiscordPayment(
            null,
            incomingDiscordPayment.discordServer,
            confirmation.transactionHash,
            Date.from(currentTime.toInstant()),
            incomingDiscordPayment.amount,
            null
        ))
    }

    @Scheduled(fixedDelay = 3600000, initialDelay = 600000)
    fun remindersForRefills() {
        val currentTime = ZonedDateTime.now(ZoneId.of("UTC"))
        val endOfMonth = ZonedDateTime.now(ZoneId.of("UTC"))
            .with(TemporalAdjusters.lastDayOfMonth())
            .withHour(23).withMinute(59).withSecond(59)
        if (ChronoUnit.DAYS.between(currentTime, endOfMonth) <= 3) {
            discordServerRepository.getDiscordServersThatNeedPremiumReminder(Date())
                .forEach { discordServer ->
                    val premiumInfo = getPremiumInfoForServer(discordServer, false)
                    val serverIsSponsored = discordServer.settings.any { it.name == "SPONSORED_BY" }
                    val premiumUntil = discordServer.premiumUntil?.toInstant()?.atZone(ZoneId.of("UTC")) ?: currentTime
                    val remainingPremiumDays = ChronoUnit.DAYS.between(currentTime, premiumUntil)
                    if (remainingPremiumDays < 20 && !serverIsSponsored && premiumInfo.remainingBalance <= 0 && premiumInfo.actualMonthlyCost > 0) {
                        rabbitTemplate.convertAndSend("adminannouncements", AdminAnnouncement(discordServer.guildId, AdminAnnouncementType.PREMIUM_REFILL))
                        discordServer.premiumReminder = Date.from(currentTime.plusDays(14).toInstant())
                        discordServerRepository.save(discordServer)
                    }
                }
        }
    }
}