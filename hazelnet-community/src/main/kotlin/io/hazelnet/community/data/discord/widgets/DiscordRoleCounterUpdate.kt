package io.hazelnet.community.data.discord.widgets

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer

interface DiscordRoleCounterUpdateProjection {
    fun getGuildId(): Long
    fun getChannelId(): Long
    fun getWidgetName(): String
}

data class DiscordRoleCounterUpdate(
    @JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,
    @JsonSerialize(using = ToStringSerializer::class)
    val channelId: Long,
    @JsonSerialize(using = ToStringSerializer::class)
    val roleId: Long,
)
