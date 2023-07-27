package io.hazelnet.community.data.discord.quizzes

import com.fasterxml.jackson.annotation.JsonCreator
import org.springframework.lang.NonNull
import javax.persistence.*
import javax.validation.constraints.Min
import javax.validation.constraints.Size

@Embeddable
class DiscordQuizQuestion @JsonCreator constructor(
    @Column(name = "quiz_question_id", insertable = false, updatable = false, unique = true)
    var id: Int? = null,

    @Column(name = "question_text")
    @field:NonNull
    @field:Size(min = 1, max = 512)
    var text: String,

    @Column(name = "question_order")
    @field:NonNull
    @field:Min(0)
    var order: Int = 0,

    @Column(name = "answer_0")
    @field:NonNull
    @field:Size(min = 1, max = 90)
    var answer0: String,

    @Column(name = "answer_1")
    @field:NonNull
    @field:Size(min = 1, max = 90)
    var answer1: String,

    @Column(name = "answer_2")
    @field:Size(min = 1, max = 90)
    var answer2: String? = null,

    @Column(name = "answer_3")
    @field:Size(min = 1, max = 90)
    var answer3: String? = null,

    @Column(name = "correct_answer_index")
    @field:NonNull
    var correctAnswer: Int = 0,

    @Column(name = "correct_answer_details")
    @field:Size(min = 1, max = 512)
    var correctAnswerDetails: String? = null,

    @Column(name = "shuffle_answers")
    var shuffleAnswers: Boolean? = false,

    ) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordQuizQuestion

        if (id != other.id) return false
        if (text != other.text) return false
        if (order != other.order) return false
        if (answer0 != other.answer0) return false
        if (answer1 != other.answer1) return false
        if (answer2 != other.answer2) return false
        if (answer3 != other.answer3) return false
        if (correctAnswer != other.correctAnswer) return false
        if (correctAnswerDetails != other.correctAnswerDetails) return false
        if (shuffleAnswers != other.shuffleAnswers) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + text.hashCode()
        result = 31 * result + order
        result = 31 * result + answer0.hashCode()
        result = 31 * result + answer1.hashCode()
        result = 31 * result + (answer2?.hashCode() ?: 0)
        result = 31 * result + (answer3?.hashCode() ?: 0)
        result = 31 * result + correctAnswer
        result = 31 * result + (correctAnswerDetails?.hashCode() ?: 0)
        result = 31 * result + (shuffleAnswers?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordQuizQuestion(id=$id, text='$text', order=$order, answer0=$answer0, answer1=$answer1, answer2=$answer2, answer3=$answer3, correctAnswer=$correctAnswer, correctAnswerDetails=$correctAnswerDetails, shuffleAnswers=$shuffleAnswers)"
    }

}
