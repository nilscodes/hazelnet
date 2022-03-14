package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator

data class DiscordServerPartial @JsonCreator constructor(
    val guildName: String,
    val guildOwner: Long,
    val guildMemberCount: Int,
)
