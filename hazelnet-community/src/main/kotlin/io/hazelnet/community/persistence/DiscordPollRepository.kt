package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.polls.DiscordPoll
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordPollRepository : CrudRepository<DiscordPoll, Int> {
    fun findByDiscordServerId(discordServerId: Int): List<DiscordPoll>
}