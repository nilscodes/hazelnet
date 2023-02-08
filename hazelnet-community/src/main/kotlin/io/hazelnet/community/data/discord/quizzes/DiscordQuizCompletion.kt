package io.hazelnet.community.data.discord.quizzes

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.persistence.Temporal
import javax.persistence.TemporalType
import javax.validation.constraints.Min
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Embeddable
class DiscordQuizCompletion @JsonCreator constructor(
    @Column(name = "external_account_id")
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var externalAccountId: Long,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "quiz_completion_time", updatable = false)
    var time: Date?,

    @Column(name = "correct_answers_given")
    @field:NonNull
    @field:Min(0)
    var correctAnswers: Int = 0,

    @Column(name = "qualifies")
    @field:NonNull
    var qualifies: Boolean,

    @Column(name = "address")
    @field:Size(min = 10, max = 103)
    @field:Pattern(regexp = "[a-zA-Z0-9]+")
    var address: String? = null,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordQuizCompletion

        if (externalAccountId != other.externalAccountId) return false
        if (time != other.time) return false
        if (correctAnswers != other.correctAnswers) return false
        if (qualifies != other.qualifies) return false
        if (address != other.address) return false

        return true
    }

    override fun hashCode(): Int {
        var result = externalAccountId.hashCode()
        result = 31 * result + (time?.hashCode() ?: 0)
        result = 31 * result + correctAnswers
        result = 31 * result + qualifies.hashCode()
        result = 31 * result + (address?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordQuizCompletion(externalAccountId=$externalAccountId, time=$time, correctAnswers=$correctAnswers, qualifies=$qualifies, address=$address)"
    }

}
