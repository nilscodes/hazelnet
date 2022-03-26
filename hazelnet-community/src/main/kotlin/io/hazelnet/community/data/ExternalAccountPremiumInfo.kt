package io.hazelnet.community.data

data class ExternalAccountPremiumInfo(
    val discordServers: List<String>,
    val stakeAmount: Long,
    val tokenBalance: Long,
) {
    fun isPremium(): Boolean = stakeAmount > 0
}