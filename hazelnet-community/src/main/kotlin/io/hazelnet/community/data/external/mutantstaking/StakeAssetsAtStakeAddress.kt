package io.hazelnet.community.data.external.mutantstaking

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

@JsonIgnoreProperties(ignoreUnknown = true)
data class StakeAssetsAtStakeAddress @JsonCreator constructor(
    @JsonProperty("_id")
    val id: String?,

    @JsonProperty("assetsPerPolicy")
    val assetsPerPolicy: Map<String, List<StakedAssetEntry>>
)
