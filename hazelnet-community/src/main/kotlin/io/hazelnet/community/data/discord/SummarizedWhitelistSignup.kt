package io.hazelnet.community.data.discord

import java.util.*

data class SummarizedWhitelistSignup constructor(
    val externalAccountId: Long,
    var guildId: Long,
    var guildName: String,
    var whitelistDisplayName: String,
    var signupTime: Date,
    val launchDate: Date?,
)