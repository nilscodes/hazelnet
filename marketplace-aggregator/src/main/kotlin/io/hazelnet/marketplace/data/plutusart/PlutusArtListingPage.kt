package io.hazelnet.marketplace.data.plutusart

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty

data class PlutusArtListingPage @JsonCreator constructor(
    @JsonProperty("data")
    val listings: List<PlutusArtActivityInfo>,

    @JsonProperty("success")
    val success: Boolean,
)