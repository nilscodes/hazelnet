package io.hazelnet.community.data.discord

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer

data class DiscordRoleAssignmentListForGuildMember(
    @field:JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,

    @field:JsonSerialize(using = ToStringSerializer::class)
    val userId: Long,

    val assignments: Set<DiscordRoleAssignment>,
)