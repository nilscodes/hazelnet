package io.hazelnet.external.data.claim

import com.fasterxml.jackson.annotation.JsonCreator

data class PhysicalProduct @JsonCreator constructor(
    val id: Int,
    val name: String,
    val variations: Map<String, Any>?
)
