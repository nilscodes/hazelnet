package io.hazelnet.community.data.discord.widgets

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer

interface DiscordWidgetUpdateProjection {
    fun getGuildId(): Long
    fun getChannelId(): Long
}

data class DiscordWidgetUpdate(
    @JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,
    @JsonSerialize(using = ToStringSerializer::class)
    val channelId: Long,
)
