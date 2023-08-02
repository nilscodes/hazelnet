package io.hazelnet.community.data.discord

interface DiscordServerMemberPledge {
    fun getGuildName(): String
    fun getPremiumWeight(): Int
}

data class DiscordServerMemberPledgeImpl(
    private val guildName: String,
    private val premiumWeight: Int,
): DiscordServerMemberPledge {
    override fun getGuildName() = guildName
    override fun getPremiumWeight() = premiumWeight
}