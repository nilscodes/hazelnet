package io.hazelnet.shared.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonFormat
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonInclude
import java.util.Date

data class WhitelistAutojoinDto @JsonCreator constructor(
    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val address: String,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    val blockchain: BlockchainType,

    val autojoinCreation: Date,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class NewWhitelistAutojoinDto @JsonCreator constructor(
    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val address: String,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    val blockchain: BlockchainType,
)