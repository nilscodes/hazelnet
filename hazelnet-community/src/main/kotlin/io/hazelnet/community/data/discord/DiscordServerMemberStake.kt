package io.hazelnet.community.data.discord

interface DiscordServerMemberStake {
    fun getDiscordServerId(): Int
    fun getExternalAccountId(): Long
    fun getCardanoStakeAddress(): String
}

data class DiscordServerMemberStakeImpl(
        private val discordServerId: Int,
        private val externalAccountId: Long,
        private val cardanoStakeAddress: String
): DiscordServerMemberStake {
    override fun getDiscordServerId() = discordServerId
    override fun getExternalAccountId() = externalAccountId
    override fun getCardanoStakeAddress() = cardanoStakeAddress
}