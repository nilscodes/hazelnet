package io.hazelnet.community.data.discord.widgets

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer

interface DiscordMintCounterUpdateProjection {
    fun getGuildId(): Long
    fun getUpdateInfo(): String
}

data class DiscordMintCounterUpdate(
    @JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,
    @JsonSerialize(using = ToStringSerializer::class)
    val channelId: Long,
    val policyId: String,
    @JsonSerialize(using = ToStringSerializer::class)
    val tokenCount: Long,
    @JsonSerialize(using = ToStringSerializer::class)
    val maxCount: Long,
    val cip68: Boolean = false
) {
    fun withCount(tokenCount: Long) = DiscordMintCounterUpdate(guildId, channelId, policyId, tokenCount, maxCount, cip68)
}
