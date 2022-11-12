package io.hazelnet.community.data.discord.giveaways

import com.fasterxml.jackson.annotation.JsonCreator

data class WinnerList @JsonCreator constructor(
    val winners: List<String>,
    val winnerCount: Int,
    val winnerType: GiveawayDrawType,
)