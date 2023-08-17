package io.hazelnet.external.data

import com.fasterxml.jackson.annotation.JsonCreator
import java.util.*

data class DiscordMemberDto @JsonCreator constructor(
    val externalAccountId: Long,
    val joinTime: Date,
)