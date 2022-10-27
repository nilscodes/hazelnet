package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.giveaways.DiscordGiveaway
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordGiveawayRepository : CrudRepository<DiscordGiveaway, Int> {
    fun findByDiscordServerId(discordServerId: Int): List<DiscordGiveaway>
}