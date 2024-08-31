package io.hazelnet.external.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonFormat
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import io.hazelnet.shared.data.BlockchainType
import io.hazelnet.shared.data.ExternalAccountType
import java.util.*

data class SanitizedWhitelistSignup @JsonCreator constructor(
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