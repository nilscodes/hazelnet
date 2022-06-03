package io.hazelnet.shared.data

data class SharedWhitelist(
    val guildId: Long,
    val guildName: String,
    val whitelistName: String,
    val whitelistDisplayName: String,
    val signups: Set<WhitelistSignup>,
)