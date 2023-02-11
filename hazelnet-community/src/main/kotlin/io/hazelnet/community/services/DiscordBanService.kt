package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordBan
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.marketplace.TrackerMetadataFilter
import io.hazelnet.community.persistence.DiscordBanRepository
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*

@Service
class DiscordBanService(
    private val discordServerService: DiscordServerService,
    private val discordBanRepository: DiscordBanRepository,
    private val rabbitTemplate: RabbitTemplate,
) {
    fun listBans(guildId: Long): List<DiscordBan> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return discordBanRepository.findByDiscordServerId(discordServer.id!!)
    }

    fun addBan(guildId: Long, discordBan: DiscordBan): DiscordBan {
        val discordServer = discordServerService.getDiscordServer(guildId)
        discordBan.discordServerId = discordServer.id
        discordBan.createTime = Date.from(ZonedDateTime.now().toInstant())
        return discordBanRepository.save(discordBan)
    }

    fun getBan(guildId: Long, banId: Int): Any {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return getBan(discordServer, banId)
    }

    fun deleteBan(guildId: Long, banId: Int) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val ban = getBan(discordServer, banId)
        discordBanRepository.delete(ban)
    }

    private fun getBan(discordServer: DiscordServer, banId: Int): DiscordBan {
        val ban = discordBanRepository.findByDiscordServerId(discordServer.id!!).find { banId == it.id }
        if (ban != null) {
            return ban
        }
        throw NoSuchElementException("No ban with ID $banId found on Discord server with guild ID ${discordServer.guildId}")
    }

}