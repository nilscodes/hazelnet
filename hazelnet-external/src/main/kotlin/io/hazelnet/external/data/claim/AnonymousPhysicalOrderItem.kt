package io.hazelnet.external.data.claim

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class AnonymousPhysicalOrderItem @JsonCreator constructor(
    val productId: Int,
    val count: Int,
    val variation: Map<String, Any>?,
)
