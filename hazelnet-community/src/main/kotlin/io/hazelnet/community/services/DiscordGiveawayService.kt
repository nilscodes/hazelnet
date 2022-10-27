package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.giveaways.DiscordGiveaway
import io.hazelnet.community.data.discord.giveaways.DiscordGiveawayPartial
import io.hazelnet.community.persistence.DiscordGiveawayRepository
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*

@Service
class DiscordGiveawayService(
    private val discordGiveawayRepository: DiscordGiveawayRepository,
    private val discordServerService: DiscordServerService,
) {
    fun listGiveaways(guildId: Long): List<DiscordGiveaway> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return discordGiveawayRepository.findByDiscordServerId(discordServer.id!!)
    }

    fun addGiveaway(guildId: Long, discordGiveaway: DiscordGiveaway): DiscordGiveaway {
        val discordServer = discordServerService.getDiscordServer(guildId)
        discordGiveaway.discordServer = discordServer
        discordGiveaway.createTime = Date.from(ZonedDateTime.now().toInstant())
        return discordGiveawayRepository.save(discordGiveaway)
    }

    fun updateGiveaway(guildId: Long, giveawayId: Int, discordGiveawayPartial: DiscordGiveawayPartial): DiscordGiveaway {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val giveaway = getGiveaway(discordServer, giveawayId)
        if (discordGiveawayPartial.channelId != null) {
            giveaway.channelId = discordGiveawayPartial.channelId
        }
        if (discordGiveawayPartial.messageId != null) {
            giveaway.messageId = discordGiveawayPartial.messageId
        }
        if (discordGiveawayPartial.displayName != null) {
            giveaway.displayName = discordGiveawayPartial.displayName
        }
        if (discordGiveawayPartial.description != null) {
            giveaway.description = discordGiveawayPartial.description
        }
        if (discordGiveawayPartial.openAfter != null) {
            giveaway.openAfter = discordGiveawayPartial.openAfter
        }
        if (discordGiveawayPartial.openUntil != null) {
            giveaway.openUntil = discordGiveawayPartial.openUntil
        }
        if (discordGiveawayPartial.archived != null) {
            giveaway.archived = discordGiveawayPartial.archived
        }
        if (discordGiveawayPartial.requiredRoles != null) {
            giveaway.requiredRoles = discordGiveawayPartial.requiredRoles
        }
        discordGiveawayRepository.save(giveaway)
        return giveaway
    }

    fun deleteGiveaway(guildId: Long, giveawayId: Int) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val giveaway = getGiveaway(discordServer, giveawayId)
        discordGiveawayRepository.delete(giveaway)
    }

    fun getGiveaway(guildId: Long, giveawayId: Int): DiscordGiveaway {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return getGiveaway(discordServer, giveawayId)
    }

    private fun getGiveaway(discordServer: DiscordServer, giveawayId: Int): DiscordGiveaway {
        val giveaway = discordGiveawayRepository.findByDiscordServerId(discordServer.id!!).find { giveawayId == it.id }
        if (giveaway != null) {
            return giveaway
        }
        throw NoSuchElementException("No giveaway with ID $giveawayId found on Discord server with guild ID ${discordServer.guildId}")
    }


}