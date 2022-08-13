package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.marketplace.DiscordMarketplaceChannel
import io.hazelnet.community.persistence.DiscordMarketplaceChannelRepository
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*

@Service
class DiscordMarketplaceService(
    private val discordMarketplaceChannelRepository: DiscordMarketplaceChannelRepository,
    private val discordServerService: DiscordServerService,
    private val rabbitTemplate: RabbitTemplate,
) {
    fun listMarketplaceChannels(guildId: Long): List<DiscordMarketplaceChannel> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return discordMarketplaceChannelRepository.findByDiscordServerId(discordServer.id!!)
    }

    fun addMarketplaceChannel(guildId: Long, discordMarketplaceChannel: DiscordMarketplaceChannel): DiscordMarketplaceChannel {
        val discordServer = discordServerService.getDiscordServer(guildId)
        discordMarketplaceChannel.discordServerId = discordServer.id
        discordMarketplaceChannel.createTime = Date.from(ZonedDateTime.now().toInstant())
        return discordMarketplaceChannelRepository.save(discordMarketplaceChannel)
    }

    fun getMarketplaceChannel(guildId: Long, marketplaceChannelId: Int): Any {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return getMarketplaceChannel(discordServer, marketplaceChannelId)
    }

    fun deleteMarketplaceChannel(guildId: Long, marketplaceChannelId: Int) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val marketplaceChannel = getMarketplaceChannel(discordServer, marketplaceChannelId)
        discordMarketplaceChannelRepository.delete(marketplaceChannel)
    }

    private fun getMarketplaceChannel(discordServer: DiscordServer, marketplaceChannelId: Int): DiscordMarketplaceChannel {
        val marketplaceChannel = discordMarketplaceChannelRepository.findByDiscordServerId(discordServer.id!!).find { marketplaceChannelId == it.id }
        if (marketplaceChannel != null) {
            return marketplaceChannel
        }
        throw NoSuchElementException("No marketplace channel with ID $marketplaceChannelId found on Discord server with guild ID ${discordServer.guildId}")
    }

    @Scheduled(fixedDelay = 60000)
    fun publishPoliciesForSalesAggregation() {
        val allMarketplaceChannels = discordMarketplaceChannelRepository.findAllSalesChannelsForActivePremium(Date())
        allMarketplaceChannels
            .map { it.policyId }
            .toSet()
            .forEach { rabbitTemplate.convertAndSend("policies", it) }
    }

    @Cacheable(cacheNames = ["salesmarketplacechannels"])
    fun listAllMarketplaceChannels(policyId: String): List<DiscordMarketplaceChannel> =
        discordMarketplaceChannelRepository.findAllSalesChannelsForActivePremium(Date())
            .filter { it.policyId == policyId }

    @Cacheable(cacheNames = ["mintmarketplacechannels"])
    fun listAllMintMarketplaceChannels(): List<DiscordMarketplaceChannel> =
        discordMarketplaceChannelRepository.findAllMintChannelsForActivePremium(Date())


    @Scheduled(fixedRate = 60000)
    @CacheEvict(allEntries = true, cacheNames = ["salesmarketplacechannels", "mintmarketplacechannels"], )
    fun clearMarketplaceChannelCache() {
        // Annotation-based cache clearing of marketplace channel data every minute
    }

}