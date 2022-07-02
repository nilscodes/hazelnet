package io.hazelnet.shared.data

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import java.util.*

data class SummarizedWhitelistSignup constructor(
    @field:JsonSerialize(using = ToStringSerializer::class)
    val externalAccountId: Long,
    @field:JsonSerialize(using = ToStringSerializer::class)
    var guildId: Long,
    var guildName: String,
    var whitelistDisplayName: String,
    var signupTime: Date,
    val launchDate: Date?,
    val logoUrl: String?
)