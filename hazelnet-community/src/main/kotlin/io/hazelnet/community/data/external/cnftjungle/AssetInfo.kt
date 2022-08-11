package io.hazelnet.community.data.external.cnftjungle

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

@JsonIgnoreProperties(ignoreUnknown = true)
data class AssetInfo @JsonCreator constructor(
    @JsonProperty("asset_id")
    val assetId: String,

    @JsonProperty("rarity_rank")
    val rarityRank: Int? = null,

    @JsonProperty("collection_id")
    val collectionId: Int? = null,

    @JsonProperty("collection_name")
    val collectionName: String? = null,

    @JsonProperty("policy_id")
    val policyId: String,

    @JsonProperty("floor")
    val floor: Double? = null,
)
