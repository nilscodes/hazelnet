package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import java.util.*

data class WhitelistPartial @JsonCreator constructor(
    val closed: Boolean?,
    val sharedWithServer: Int?,
    val launchDate: Date?,
)
