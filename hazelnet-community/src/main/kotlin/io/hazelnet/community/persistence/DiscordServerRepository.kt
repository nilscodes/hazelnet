package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.DiscordServer
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DiscordServerRepository: CrudRepository<DiscordServer, Int> {
    fun findByGuildId(guildId: Long): Optional<DiscordServer>
}