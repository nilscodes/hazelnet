package io.hazelnet.community.data.external.voteaire

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import java.util.*

data class ProposalResults @JsonCreator constructor(
    @JsonProperty("proposal_id")
    val id: UUID,

    @JsonProperty("questions")
    val questions: List<QuestionResult>,
)

data class QuestionResult @JsonCreator constructor(
    @JsonProperty("question_id")
    val id: UUID,

    @JsonProperty("question_name")
    val question: String,

    @JsonProperty("responses")
    val responses: List<ChoiceResult>,
)

data class ChoiceResult @JsonCreator constructor(
    @JsonProperty("choice_id")
    val id: UUID,

    @JsonProperty("choice_name")
    val choice: String,

    @JsonProperty("choice_votes")
    val choiceVotes: Int?,

    @JsonProperty("choice_weight")
    val choiceWeight: Long?,
)