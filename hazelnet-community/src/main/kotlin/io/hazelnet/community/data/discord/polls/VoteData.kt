package io.hazelnet.community.data.discord.polls

import com.fasterxml.jackson.annotation.JsonCreator

data class VoteData @JsonCreator constructor(
    val votes: Map<Long, Long>
)