package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator

data class WhitelistPartial @JsonCreator constructor(
    val closed: Boolean?,
    val sharedWithServer: Int?,
)
