package io.hazelnet.marketplace.data.plutusart

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

@JsonIgnoreProperties(ignoreUnknown = true)
data class PlutusArtTotalCost @JsonCreator constructor(
    @JsonProperty("lovelace")
    var lovelace: Long,
)

