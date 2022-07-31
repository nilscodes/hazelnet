package io.hazelnet.external.data

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer

data class SanitizedSharedWhitelist(
    @field:JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,
    val guildName: String,
    val whitelistName: String,
    val whitelistDisplayName: String,
    val signups: Set<SanitizedWhitelistSignup>,
)
