package io.hazelnet.external.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonInclude
import io.hazelnet.shared.data.ExternalAccountType
import java.util.*

data class SanitizedWhitelistSignup @JsonCreator constructor(
    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val address: String? = null,
    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val referenceId: String? = null,
    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val referenceName: String? = null,
    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val referenceType: ExternalAccountType? = null,

    val signupTime: Date
)