package io.hazelnet.shared.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonFormat
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import java.util.*

@JsonIgnoreProperties(ignoreUnknown = true)
data class WhitelistSignup @JsonCreator constructor(
    @field:JsonSerialize(using = ToStringSerializer::class)
    val externalAccountId: Long,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val address: String? = null,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    val blockchain: BlockchainType? = null,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val referenceId: String? = null,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val referenceName: String? = null,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val referenceType: ExternalAccountType? = null,

    val signupTime: Date
)