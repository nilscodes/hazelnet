package io.hazelnet.community.data

import io.hazelnet.community.data.discord.DiscordServerMemberPledge

data class ExternalAccountPremiumInfo(
    val discordServers: List<DiscordServerMemberPledge>,
    val stakeAmount: Long,
    val tokenBalance: Long,
) {
    fun isPremium(): Boolean = stakeAmount > 0
}