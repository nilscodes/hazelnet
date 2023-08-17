package io.hazelnet.external.data

import com.fasterxml.jackson.annotation.JsonCreator
import io.hazelnet.shared.data.ExternalAccountType
import java.util.*

data class ExternalAccountDto @JsonCreator constructor(
    val id: Long,
    val referenceId: String,
    val referenceName: String?,
    val registrationTime: Date?,
    val type: ExternalAccountType,
    val account: Long? = 0,
)