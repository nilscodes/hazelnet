package io.hazelnet.community.data.discord.whitelists

import com.fasterxml.jackson.annotation.JsonCreator
import java.util.*

data class WhitelistPartial @JsonCreator constructor(
    val displayName: String?,
    val maxUsers: Int?,
    val signupAfter: Date?,
    val signupUntil: Date?,
    val closed: Boolean?,
    val sharedWithServer: Int?,
    val launchDate: Date?,
    val logoUrl: String?,
    val awardedRole: Long?,
)
