package io.hazelnet.community.data.premium

import com.fasterxml.jackson.annotation.JsonCreator
import javax.validation.constraints.Min

data class IncomingDiscordPaymentRequest @JsonCreator constructor(
    @field:Min(5000000L)
    val refillAmount: Long,
)
