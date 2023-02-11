package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.DiscordBan
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordBanRepository : CrudRepository<DiscordBan, Int> {
    fun findByDiscordServerId(discordServerId: Int): List<DiscordBan>
}