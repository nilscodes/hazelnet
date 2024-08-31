package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.persistence.DiscordServerRepository
import org.springframework.stereotype.Service
import java.util.NoSuchElementException

@Service
class DiscordServerRetriever(
    private val discordServerRepository: DiscordServerRepository,
) {
    fun getDiscordServers(): Iterable<DiscordServer> = discordServerRepository.findAll()

    fun getDiscordServer(guildId: Long): DiscordServer {
        return discordServerRepository.findByGuildId(guildId)
            .orElseThrow { NoSuchElementException("No Discord Server with guild ID $guildId found") }
    }

    fun getDiscordServerByInternalId(serverId: Int): DiscordServer {
        return discordServerRepository.findById(serverId)
            .orElseThrow { NoSuchElementException("No Discord Server with server ID $serverId found") }
    }

    fun getDiscordServersForMember(externalAccountId: Long) = discordServerRepository.getDiscordServersForMember(externalAccountId)

}