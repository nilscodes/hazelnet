package io.hazelnet.community.data.external.tokenregistry

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

@JsonIgnoreProperties(ignoreUnknown = true, value = ["logo"], allowSetters = true)
data class TokenMetadata @JsonCreator constructor(
    @JsonProperty("subject")
    val subject: String,

    @JsonProperty("policy")
    val policyScript: String,

    @JsonProperty("name")
    val name: TokenNameData?,

    @JsonProperty("description")
    val description: TokenDescriptionData?,

    @JsonProperty("url")
    val url: TokenUrlData?,

    @JsonProperty("ticker")
    val ticker: TokenTickerData?,

    @JsonProperty("decimals")
    val decimals: TokenDecimalData?,

    @JsonProperty("logo")
    val logo: TokenLogoData?,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class TokenNameData @JsonCreator constructor(
    @JsonProperty("value")
    val name: String,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class TokenDescriptionData @JsonCreator constructor(
    @JsonProperty("value")
    val description: String,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class TokenUrlData @JsonCreator constructor(
    @JsonProperty("value")
    val url: String,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class TokenTickerData @JsonCreator constructor(
    @JsonProperty("value")
    val ticker: String,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class TokenDecimalData @JsonCreator constructor(
    @JsonProperty("value")
    val decimals: Int,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class TokenLogoData @JsonCreator constructor(
    @JsonProperty("value")
    val logoBase64: String,
)