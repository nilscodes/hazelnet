package io.hazelnet.marketplace.data.plutusart

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

@JsonIgnoreProperties(ignoreUnknown = true)
data class PlutusArtState @JsonCreator constructor(
    @JsonProperty("isConfirmed")
    val isConfirmed: Boolean = false,

    @JsonProperty("isSubmitted")
    val isSubmitted: Boolean = false,

    @JsonProperty("isFailed")
    val isFailed: Boolean = false,

    @JsonProperty("isSpent")
    val isSpent: Boolean = false,
)
