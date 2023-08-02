package io.hazelnet.community.data.discord

interface DiscordServerMemberStake {
    fun getDiscordServerId(): Int
    fun getExternalAccountId(): Long
    fun getCardanoStakeAddress(): String
    fun getStakePercentage(): Int
}

data class DiscordServerMemberStakeImpl(
    private val discordServerId: Int,
    private val externalAccountId: Long,
    private val cardanoStakeAddress: String,
    private val stakePercentage: Int = -1,
): DiscordServerMemberStake {
    override fun getDiscordServerId() = discordServerId
    override fun getExternalAccountId() = externalAccountId
    override fun getCardanoStakeAddress() = cardanoStakeAddress
    override fun getStakePercentage() = stakePercentage
}