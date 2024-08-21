package io.hazelnet.cardano.connect.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty

data class BlockfrostDelegator @JsonCreator constructor(
    @JsonProperty("address")
    val address: String,

    @JsonProperty("live_stake")
    val delegation: Long,
)

data class BlockfrostPoolInfo @JsonCreator constructor(
    @JsonProperty("live_delegators")
    val liveDelegators: Int,
)