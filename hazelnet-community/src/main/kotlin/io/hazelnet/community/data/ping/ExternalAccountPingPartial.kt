package io.hazelnet.community.data.ping

import com.fasterxml.jackson.annotation.JsonCreator
import java.util.*

data class ExternalAccountPingPartial @JsonCreator constructor(
    val sentTime: Date?,
    val reported: Boolean?,
)