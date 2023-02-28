package io.hazelnet.marketplace.data.plutusart

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

@JsonIgnoreProperties(ignoreUnknown = true)
data class PlutusArtTokenInfo @JsonCreator constructor(
    @JsonProperty("unit")
    var unit: String,

    @JsonProperty("policyId")
    var policyId: String,

    @JsonProperty("assetName")
    var assetName: String,

    @JsonProperty("assetNameHex")
    var assetNameHex: String,

    @JsonProperty("name") // CIP-68 variants (latest data, also available for CIP-25)
    var name: String,

    @JsonProperty("nameHex") // CIP-68 variants (latest data, also available for CIP-25)
    var nameHex: String,
)
