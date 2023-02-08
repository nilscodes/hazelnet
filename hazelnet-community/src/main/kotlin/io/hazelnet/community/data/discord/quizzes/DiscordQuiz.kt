package io.hazelnet.community.data.discord.quizzes

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.community.data.discord.DiscordRequiredRole
import io.hazelnet.community.data.discord.DiscordServer
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.*
import javax.validation.Valid
import javax.validation.constraints.Min
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_quiz")
class DiscordQuiz @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "discord_quiz_id")
    var id: Int?,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discord_server_id")
    @JsonIgnore
    var discordServer: DiscordServer?,

    @Column(name = "external_account_id")
    @field:NonNull
    @field:Min(1)
    var creator: Long,

    @Column(name = "discord_channel_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var channelId: Long?,

    @Column(name = "discord_message_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var messageId: Long?,

    @Column(name = "quiz_name")
    @field:NonNull
    @field:Size(min = 1, max = 30)
    @field:Pattern(regexp = "^[A-Za-z][-A-Za-z0-9]{0,29}$")
    var name: String,

    @Column(name = "quiz_displayname")
    @field:NonNull
    @field:Size(min = 1, max = 256)
    var displayName: String,

    @Column(name = "quiz_description")
    @field:NonNull
    @field:Size(min = 1, max = 4096)
    var description: String,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "quiz_creation", updatable = false)
    var createTime: Date?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "quiz_open_after")
    var openAfter: Date?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "quiz_open_until")
    var openUntil: Date?,

    @Column(name = "quiz_archived")
    var archived: Boolean = false,

    @Column(name = "quiz_winner_count")
    @field:Min(1)
    var winnerCount: Int = 1,

    @Column(name = "attempts_per_question")
    @field:Min(0)
    var attemptsPerQuestion: Int = 0,

    @Column(name = "correct_answers_required")
    @field:Min(0)
    var correctAnswersRequired: Int = 0,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "discord_quiz_required_roles", joinColumns = [JoinColumn(name = "discord_quiz_id")])
    @field:Valid
    var requiredRoles: MutableSet<DiscordRequiredRole> = mutableSetOf(),

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "discord_quiz_questions", joinColumns = [JoinColumn(name = "discord_quiz_id")])
    @field:JsonIgnore
    var questions: MutableSet<DiscordQuizQuestion> = mutableSetOf(),

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "discord_quiz_completion", joinColumns = [JoinColumn(name = "discord_quiz_id")])
    @field:JsonIgnore
    var completions: MutableSet<DiscordQuizCompletion> = mutableSetOf(),

    @Column(name = "awarded_discord_role_id")
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var awardedRole: Long? = null,

    @Column(name = "quiz_logo_url")
    @field:Size(min = 1, max = 1000)
    var logoUrl: String? = null,

    ) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordQuiz

        if (id != other.id) return false
        if (discordServer != other.discordServer) return false
        if (creator != other.creator) return false
        if (channelId != other.channelId) return false
        if (messageId != other.messageId) return false
        if (name != other.name) return false
        if (displayName != other.displayName) return false
        if (description != other.description) return false
        if (createTime != other.createTime) return false
        if (openAfter != other.openAfter) return false
        if (openUntil != other.openUntil) return false
        if (archived != other.archived) return false
        if (winnerCount != other.winnerCount) return false
        if (attemptsPerQuestion != other.attemptsPerQuestion) return false
        if (correctAnswersRequired != other.correctAnswersRequired) return false
        if (requiredRoles != other.requiredRoles) return false
        if (questions != other.questions) return false
        if (completions != other.completions) return false
        if (awardedRole != other.awardedRole) return false
        if (logoUrl != other.logoUrl) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + (discordServer?.hashCode() ?: 0)
        result = 31 * result + creator.hashCode()
        result = 31 * result + (channelId?.hashCode() ?: 0)
        result = 31 * result + (messageId?.hashCode() ?: 0)
        result = 31 * result + name.hashCode()
        result = 31 * result + displayName.hashCode()
        result = 31 * result + description.hashCode()
        result = 31 * result + (createTime?.hashCode() ?: 0)
        result = 31 * result + (openAfter?.hashCode() ?: 0)
        result = 31 * result + (openUntil?.hashCode() ?: 0)
        result = 31 * result + archived.hashCode()
        result = 31 * result + winnerCount
        result = 31 * result + attemptsPerQuestion
        result = 31 * result + correctAnswersRequired
        result = 31 * result + requiredRoles.hashCode()
        result = 31 * result + questions.hashCode()
        result = 31 * result + completions.hashCode()
        result = 31 * result + (awardedRole?.hashCode() ?: 0)
        result = 31 * result + (logoUrl?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordQuiz(id=$id, discordServer=$discordServer, creator=$creator, channelId=$channelId, messageId=$messageId, name='$name', displayName='$displayName', description='$description', createTime=$createTime, openAfter=$openAfter, openUntil=$openUntil, archived=$archived, winnerCount=$winnerCount, attemptsPerQuestion=$attemptsPerQuestion, correctAnswersRequired=$correctAnswersRequired, requiredRoles=$requiredRoles, questions=$questions, completions=$completions, awardedRole=$awardedRole, logoUrl=$logoUrl)"
    }

}