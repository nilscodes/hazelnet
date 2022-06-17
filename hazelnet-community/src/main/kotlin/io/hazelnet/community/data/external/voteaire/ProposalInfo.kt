package io.hazelnet.community.data.external.voteaire

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import com.fasterxml.jackson.databind.node.TextNode
import io.hazelnet.cardano.connect.data.token.PolicyId
import java.util.*
import java.util.concurrent.TimeUnit


data class ProposalInfo @JsonCreator constructor(
    @JsonProperty("proposal_id")
    val id: UUID,

    @JsonProperty("ballot_type")
    val ballotType: BallotType,

    @JsonProperty("title")
    val title: String,

    @JsonProperty("creator_stake_address")
    val creatorStakeAddress: String,

    @JsonProperty("network_id")
    val networkId: String,

    @JsonProperty("end_date")
    @JsonDeserialize(using = UnixTimestampDeserializer::class)
    val endDate: Date,

    @JsonProperty("end_epoch")
    val endEpoch: Int,

    @JsonProperty("start_date")
    @JsonDeserialize(using = UnixTimestampDeserializer::class)
    val startDate: Date,

    @JsonProperty("start_epoch")
    val startEpoch: Int,

    @JsonProperty("snapshot_date")
    @JsonDeserialize(using = UnixTimestampDeserializer::class)
    val snapshotDate: Date,

    @JsonProperty("snapshot_epoch")
    val snapshotEpoch: Int,

    @JsonProperty("state")
    val state: ProposalState,

    @JsonProperty("status")
    @JsonDeserialize(using = ProposalStatusDeserializer::class)
    val status: ProposalStatus,

    @JsonProperty("version")
    val version: String,

    @JsonProperty("questions")
    val questions: List<Question>,

    @JsonProperty("proposal_url")
    val url: String?,
)

data class Question @JsonCreator constructor(
    @JsonProperty("question_id")
    val id: UUID,

    @JsonProperty("choice_limit")
    val choiceLimit: Int,

    @JsonProperty("question")
    val question: String,

    @JsonProperty("choices")
    val choices: List<Choice>,

    @JsonProperty("description")
    val description: String,


    )

data class Choice @JsonCreator constructor(
    @JsonProperty("choice_id")
    val id: UUID,

    @JsonProperty("choice")
    val choice: String,

    @JsonProperty("description")
    val description: String,
)

enum class ProposalState {
    active,
    upcoming,
    completed,
}

enum class ProposalStatus {
    draft,
    submitted,
    onchain,
}

class ProposalStatusDeserializer : JsonDeserializer<ProposalStatus>() {
    override fun deserialize(parser: JsonParser?, context: DeserializationContext?): ProposalStatus {
        val node: JsonNode? = parser?.codec?.readTree(parser)
        if (node !== null && node is TextNode) {
            return ProposalStatus.valueOf(node.textValue().replace("-", ""))
        }
        throw IllegalArgumentException("Invalid Proposal Status enum coming from voteaire: $node")
    }
}

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "name")
@JsonSubTypes(
    JsonSubTypes.Type(value = BallotTypeSimple::class, name = "Simple"),
    JsonSubTypes.Type(value = BallotTypeDelegated::class, name = "Delegated"),
    JsonSubTypes.Type(value = BallotTypePolicyId::class, name = "PolicyId"),
)
open class BallotType @JsonCreator constructor()

class BallotTypeSimple : BallotType() {
    override fun toString(): String {
        return "BallotTypeSimple()"
    }
}

class BallotTypeDelegated(
    @JsonProperty("pool_id")
    val poolId: String,
) : BallotType() {
    override fun toString(): String {
        return "BallotTypeDelegated(poolId='$poolId')"
    }
}

class BallotTypePolicyId(
    @JsonProperty("policy_id")
    val policyId: PolicyId,
) : BallotType() {
    override fun toString(): String {
        return "BallotTypePolicyId(policyId=$policyId)"
    }
}

class UnixTimestampDeserializer : JsonDeserializer<Date>() {

    override fun deserialize(parser: JsonParser, context: DeserializationContext): Date {
        val unixTimestamp = parser.text.trim { it <= ' ' }
        return Date(TimeUnit.SECONDS.toMillis(java.lang.Long.valueOf(unixTimestamp)))
    }
}
