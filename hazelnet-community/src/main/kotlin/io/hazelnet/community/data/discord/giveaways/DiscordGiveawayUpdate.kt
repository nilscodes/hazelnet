package io.hazelnet.community.data.discord.giveaways

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer

interface DiscordGiveawayUpdateProjection {
    fun getGuildId(): Long
    fun getGiveawayId(): Int
    fun getChannelId(): Long
    fun getMessageId(): Long?
}

data class DiscordGiveawayUpdate(
    @JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,
    val giveawayId: Int,
    @JsonSerialize(using = ToStringSerializer::class)
    val channelId: Long,
    @JsonSerialize(using = ToStringSerializer::class)
    val messageId: Long?,
)