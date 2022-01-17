package io.hazelnet.external.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import java.util.*

@JsonIgnoreProperties(ignoreUnknown = true)
data class WhitelistSignup @JsonCreator constructor(
        val address: String,
        val signupTime: Date
)