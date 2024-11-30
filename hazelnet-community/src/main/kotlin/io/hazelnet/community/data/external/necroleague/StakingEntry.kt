package io.hazelnet.community.data.external.necroleague

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty

@JsonInclude(JsonInclude.Include.NON_NULL)
data class StakingEntry(
    @JsonProperty("address") val address: String,
    @JsonProperty("stakingAddress") val stakingAddress: String? = null
)
