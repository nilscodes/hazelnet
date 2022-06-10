package io.hazelnet.community.data.discord.polls

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer

interface DiscordPollUpdateProjection {
    fun getGuildId(): Long
    fun getPollId(): Int
    fun getChannelId(): Long
    fun getMessageId(): Long?
}

data class DiscordPollUpdate(
    @JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,
    val pollId: Int,
    @JsonSerialize(using = ToStringSerializer::class)
    val channelId: Long,
    @JsonSerialize(using = ToStringSerializer::class)
    val messageId: Long?,
)