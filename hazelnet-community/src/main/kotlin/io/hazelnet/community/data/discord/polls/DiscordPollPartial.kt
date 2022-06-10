package io.hazelnet.community.data.discord.polls

import com.fasterxml.jackson.annotation.JsonCreator
import java.util.*
import javax.validation.Valid
import javax.validation.constraints.Size

data class DiscordPollPartial @JsonCreator constructor(
    val channelId: Long?,
    val messageId: Long?,
    @field:Size(min = 1, max = 256)
    val displayName: String?,
    @field:Size(min = 1, max = 4096)
    val description: String?,
    val openAfter: Date?,
    val openUntil: Date?,
    val resultsVisible: Boolean?,
    val archived: Boolean?,
    @field:Valid
    val requiredRoles: MutableSet<DiscordPollRequiredRole>?,
)