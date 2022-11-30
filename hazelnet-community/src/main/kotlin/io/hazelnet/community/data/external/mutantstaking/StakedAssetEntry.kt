package io.hazelnet.community.data.external.mutantstaking

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

@JsonIgnoreProperties(ignoreUnknown = true)
data class StakedAssetEntry @JsonCreator constructor(
    @JsonProperty("_id")
    val stakedAssetId: String?,

    @JsonProperty("assetName")
    val assetNameHex: String,

    @JsonProperty("policyId")
    val policyId: String?,

    @JsonProperty("name")
    val assetName: String,
)