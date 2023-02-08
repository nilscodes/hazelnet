package io.hazelnet.community.data.discord.quizzes

import com.fasterxml.jackson.annotation.JsonCreator
import io.hazelnet.community.data.discord.DiscordRequiredRole
import java.util.*
import javax.validation.Valid
import javax.validation.constraints.Min
import javax.validation.constraints.Size

data class DiscordQuizPartial @JsonCreator constructor(
    val channelId: Long?,
    val messageId: Long?,
    @field:Size(min = 1, max = 256)
    val displayName: String?,
    @field:Size(min = 1, max = 4096)
    val description: String?,
    val openAfter: Date?,
    val openUntil: Date?,
    @field:Min(1)
    val winnerCount: Int?,
    val attemptsPerQuestion: Int?,
    val correctAnswersRequired: Int?,
    val archived: Boolean?,
    val awardedRole: Long?,
    @field:Valid
    val requiredRoles: MutableSet<DiscordRequiredRole>?,
    val logoUrl: String?,
)