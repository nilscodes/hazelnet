package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.Whitelist
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordWhitelistRepository: CrudRepository<Whitelist, Long> {
    fun findBySharedWithServer(sharedWithServer: Int): List<Whitelist>
}