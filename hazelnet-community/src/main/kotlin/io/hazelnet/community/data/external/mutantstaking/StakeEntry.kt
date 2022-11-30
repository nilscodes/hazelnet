package io.hazelnet.community.data.external.mutantstaking

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

@JsonIgnoreProperties(ignoreUnknown = true)
data class StakeEntry @JsonCreator constructor(
    @JsonProperty("_id")
    val stakeId: String,

    @JsonProperty("stakerPaymentAddress")
    val stakerPaymentAddress: String,

    @JsonProperty("stakerStakeAddress")
    val stakerStakeAddress: String,

    @JsonProperty("assets")
    val assets: List<StakedAssetEntry>,
)
