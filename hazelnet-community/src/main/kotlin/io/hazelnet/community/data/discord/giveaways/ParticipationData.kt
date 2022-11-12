package io.hazelnet.community.data.discord.giveaways

import com.fasterxml.jackson.annotation.JsonCreator

data class ParticipationData @JsonCreator constructor(
    val participants: Int,
    val totalEntries: Long,
)
