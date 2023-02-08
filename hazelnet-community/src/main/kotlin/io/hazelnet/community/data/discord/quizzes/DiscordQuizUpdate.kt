package io.hazelnet.community.data.discord.quizzes

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer

interface DiscordQuizUpdateProjection {
    fun getGuildId(): Long
    fun getQuizId(): Int
    fun getChannelId(): Long
    fun getMessageId(): Long?
}

data class DiscordQuizUpdate(
    @JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,
    val quizId: Int,
    @JsonSerialize(using = ToStringSerializer::class)
    val channelId: Long,
    @JsonSerialize(using = ToStringSerializer::class)
    val messageId: Long?,
)