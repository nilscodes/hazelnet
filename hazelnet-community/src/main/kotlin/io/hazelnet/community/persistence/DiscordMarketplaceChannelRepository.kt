package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.marketplace.DiscordMarketplaceChannel
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DiscordMarketplaceChannelRepository : CrudRepository<DiscordMarketplaceChannel, Int> {
    fun findByDiscordServerId(discordServerId: Int): List<DiscordMarketplaceChannel>

    @Query(value = "SELECT m FROM DiscordMarketplaceChannel m JOIN DiscordServer d ON m.discordServerId=d.id WHERE m.type=0 AND d.premiumUntil>:now AND d.active=true")
    fun findAllSalesChannelsForActivePremium(@Param("now") now: Date): List<DiscordMarketplaceChannel>

    @Query(value = "SELECT m FROM DiscordMarketplaceChannel m JOIN DiscordServer d ON m.discordServerId=d.id WHERE m.type=1 AND d.premiumUntil>:now AND d.active=true")
    fun findAllMintChannelsForActivePremium(@Param("now") now: Date): List<DiscordMarketplaceChannel>
}