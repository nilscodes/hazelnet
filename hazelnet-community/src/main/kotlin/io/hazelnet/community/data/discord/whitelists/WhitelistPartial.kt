package io.hazelnet.community.data.discord.whitelists

import com.fasterxml.jackson.annotation.JsonCreator
import io.hazelnet.community.data.discord.DiscordRequiredRole
import java.util.*
import javax.validation.Valid

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
    @field:Valid
    val requiredRoles: MutableSet<DiscordRequiredRole>?,
)
