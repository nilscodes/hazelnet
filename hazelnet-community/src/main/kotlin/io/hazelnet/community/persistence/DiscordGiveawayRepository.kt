package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.giveaways.DiscordGiveaway
import io.hazelnet.community.data.discord.giveaways.DiscordGiveawayUpdateProjection
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DiscordGiveawayRepository : CrudRepository<DiscordGiveaway, Int> {
    fun findByDiscordServerId(discordServerId: Int): List<DiscordGiveaway>

    @Query(value = "SELECT d.guildId AS guildId, g.id AS giveawayId, g.channelId AS channelId, g.messageId AS messageId FROM DiscordGiveaway g JOIN DiscordServer d ON g.discordServer=d WHERE g.openAfter<=:now AND (g.openUntil>:now OR g.openUntil IS NULL) AND g.channelId IS NOT NULL AND g.messageId IS NULL AND g.archived=false AND d.active=true")
    fun findGiveawaysToBeAnnounced(@Param("now") now: Date): List<DiscordGiveawayUpdateProjection>

    @Query(value = "SELECT d.guildId AS guildId, g.id AS giveawayId, g.channelId AS channelId, g.messageId AS messageId FROM DiscordGiveaway g JOIN DiscordServer d ON g.discordServer=d WHERE (g.openAfter<=:now OR g.openAfter IS NULL) AND (g.openUntil>:now OR g.openUntil IS NULL) AND g.channelId IS NOT NULL AND g.messageId IS NOT NULL AND g.archived=false AND d.active=true")
    fun listGiveawayResultUpdates(@Param("now") now: Date): List<DiscordGiveawayUpdateProjection>

    @Query(value = "SELECT ge.external_account_id FROM discord_giveaway_entries ge JOIN discord_giveaways g ON ge.discord_giveaway_id=g.discord_giveaway_id WHERE g.discord_giveaway_id<>:excludeGiveaway AND g.discord_server_id=:discordServerId AND g.giveaway_group=:groupName AND ge.winning_count>0", nativeQuery = true)
    fun findWinnersOfGroupExcept(@Param("excludeGiveaway") excludeGiveaway: Int, @Param("discordServerId") discordServerId: Int, @Param("groupName") group: String): List<Long>
}