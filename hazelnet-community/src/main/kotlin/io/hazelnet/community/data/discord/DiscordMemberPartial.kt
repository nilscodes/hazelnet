package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator

data class DiscordMemberPartial @JsonCreator constructor(
    val premiumSupport: Boolean
)
