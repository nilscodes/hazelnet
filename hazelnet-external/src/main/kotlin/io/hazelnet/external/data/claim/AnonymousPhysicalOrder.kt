package io.hazelnet.external.data.claim

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import java.util.*

@JsonIgnoreProperties(ignoreUnknown = true)
data class AnonymousPhysicalOrder @JsonCreator constructor(
    val id: Int,
    val createTime: Date,
    val shipTo: String,
    val country: String,
    val phone: String?,
    val zipCode: String,
    val city: String,
    val street: String,
    val items: List<AnonymousPhysicalOrderItem>,
    val processed: Boolean,
)
