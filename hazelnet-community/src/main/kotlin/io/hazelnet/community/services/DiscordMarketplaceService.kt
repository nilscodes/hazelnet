package io.hazelnet.community.services

import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.marketplace.DiscordMarketplaceChannel
import io.hazelnet.community.data.discord.marketplace.TrackerMetadataFilter
import io.hazelnet.community.persistence.DiscordMarketplaceChannelRepository
import io.hazelnet.community.persistence.DiscordTrackerMetadataFilterRepository
import mu.KotlinLogging
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*
import kotlin.math.absoluteValue

@Service
class DiscordMarketplaceService(
    private val discordMarketplaceChannelRepository: DiscordMarketplaceChannelRepository,
    private val discordMarketplaceChannelMetadataFilterRepository: DiscordTrackerMetadataFilterRepository,
    private val discordServerRetriever: DiscordServerRetriever,
    private val rabbitTemplate: RabbitTemplate,
    private val config: CommunityApplicationConfiguration
) {
    private val logger = KotlinLogging.logger {}

    fun listMarketplaceChannels(guildId: Long): List<DiscordMarketplaceChannel> {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        return discordMarketplaceChannelRepository.findByDiscordServerId(discordServer.id!!)
    }

    fun addMarketplaceChannel(guildId: Long, discordMarketplaceChannel: DiscordMarketplaceChannel): DiscordMarketplaceChannel {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        discordMarketplaceChannel.discordServerId = discordServer.id
        discordMarketplaceChannel.createTime = Date.from(ZonedDateTime.now().toInstant())
        return discordMarketplaceChannelRepository.save(discordMarketplaceChannel)
    }

    fun getMarketplaceChannel(guildId: Long, marketplaceChannelId: Int): Any {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        return getMarketplaceChannel(discordServer, marketplaceChannelId)
    }

    fun deleteMarketplaceChannel(guildId: Long, marketplaceChannelId: Int) {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        val marketplaceChannel = getMarketplaceChannel(discordServer, marketplaceChannelId)
        discordMarketplaceChannelRepository.delete(marketplaceChannel)
    }

    fun addMetadataFilter(guildId: Long, marketplaceChannelId: Int, trackerMetadataFilter: TrackerMetadataFilter): TrackerMetadataFilter {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        val marketplaceChannel = getMarketplaceChannel(discordServer, marketplaceChannelId)
        discordMarketplaceChannelMetadataFilterRepository.save(trackerMetadataFilter)
        marketplaceChannel.filters.add(trackerMetadataFilter)
        discordMarketplaceChannelRepository.save(marketplaceChannel)
        return trackerMetadataFilter
    }

    fun deleteMetadataFilter(guildId: Long, marketplaceChannelId: Int, filterId: Long) {
        val discordServer = discordServerRetriever.getDiscordServer(guildId)
        val marketplaceChannel = getMarketplaceChannel(discordServer, marketplaceChannelId)
        val metadataFilter = marketplaceChannel.filters
            .find { it.id == filterId } ?: throw NoSuchElementException("No filter with ID $filterId found on marketplace channel with ID $marketplaceChannelId on guild $guildId")
        discordMarketplaceChannelMetadataFilterRepository.delete(metadataFilter)
    }

    private fun getMarketplaceChannel(discordServer: DiscordServer, marketplaceChannelId: Int): DiscordMarketplaceChannel {
        val marketplaceChannel = discordMarketplaceChannelRepository.findByDiscordServerId(discordServer.id!!).find { marketplaceChannelId == it.id }
        if (marketplaceChannel != null) {
            return marketplaceChannel
        }
        throw NoSuchElementException("No marketplace channel with ID $marketplaceChannelId found on Discord server with guild ID ${discordServer.guildId}")
    }

    @Scheduled(fixedRate = 60000)
    fun publishPoliciesForSalesAggregation() {
        val currentTimeMillis = System.currentTimeMillis()
        val shard = (currentTimeMillis / 60000) % config.marketplace.aggregationFrequency
        logger.debug { "Publishing sales policies for shard $shard (aggregation frequency ${config.marketplace.aggregationFrequency})" }
        val allMarketplaceChannels = discordMarketplaceChannelRepository.findAllSalesChannelsForActivePremium(Date())
        allMarketplaceChannels
            .filter {
                val shardOfPolicy = (it.policyId.hashCode() % config.marketplace.aggregationFrequency).absoluteValue
                val match = shardOfPolicy == shard
                logger.debug { "Checking shard $shard for ${it.policyId} with hash ${it.policyId.hashCode()} and policy shard $shardOfPolicy for sales marketplace channel with ID ${it.id}: $match" }
                match
            }
            .map { it.policyId }
            .toSet()
            .forEach { rabbitTemplate.convertAndSend("salespolicies", it) }
    }

    @Scheduled(fixedRate = 60000)
    fun publishPoliciesForListingsAggregation() {
        val currentTimeMillis = System.currentTimeMillis()
        val shard = (currentTimeMillis / 60000) % config.marketplace.aggregationFrequency
        logger.debug { "Publishing listings policies for shard $shard (aggregation frequency ${config.marketplace.aggregationFrequency})" }
        val allMarketplaceChannels = discordMarketplaceChannelRepository.findAllListingChannelsForActivePremium(Date())
        allMarketplaceChannels
            .filter {
                val shardOfPolicy = (it.policyId.hashCode() % config.marketplace.aggregationFrequency).absoluteValue
                val match = shardOfPolicy == shard
                logger.debug { "Checking shard $shard for ${it.policyId} with hash ${it.policyId.hashCode()} and policy shard $shardOfPolicy for listings marketplace channel with ID ${it.id}: $match" }
                match
            }
            .map { it.policyId }
            .toSet()
            .forEach { rabbitTemplate.convertAndSend("listingspolicies", it) }
    }

    @Cacheable(cacheNames = ["salesmarketplacechannels"])
    fun listAllSalesMarketplaceChannels(policyId: String): List<DiscordMarketplaceChannel> =
        discordMarketplaceChannelRepository.findAllSalesChannelsForActivePremium(Date())
            .filter { it.policyId == policyId }

    @Cacheable(cacheNames = ["listingsmarketplacechannels"])
    fun listAllListingMarketplaceChannels(policyId: String): List<DiscordMarketplaceChannel> =
        discordMarketplaceChannelRepository.findAllListingChannelsForActivePremium(Date())
            .filter { it.policyId == policyId }

    @Cacheable(cacheNames = ["mintmarketplacechannels"])
    fun listAllMintMarketplaceChannels(): List<DiscordMarketplaceChannel> =
        discordMarketplaceChannelRepository.findAllMintChannelsForActivePremium(Date())


    @Scheduled(fixedRate = 60000)
    @CacheEvict(allEntries = true, cacheNames = [
        "salesmarketplacechannels",
        "mintmarketplacechannels",
        "listingsmarketplacechannels",
    ], )
    fun clearMarketplaceChannelCache() {
        // Annotation-based cache clearing of marketplace channel data every minute
    }

}