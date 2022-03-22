package io.hazelnet.community.data.premium

import java.util.*

data class DiscordServerPremiumInfo(
    val totalDelegation: Long,
    val maxDelegation: Long,
    val monthlyCost: Long,
    val actualMonthlyCost: Long,
    val guildMemberCount: Int,
    val remainingBalance: Long,
    val lastBillingGuildMemberCount: Int,
    val lastBillingTime: Date?,
    val lastBillingAmount: Long,
    val premiumUntil: Date?,
    val currentPremium: Boolean,
)