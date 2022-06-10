package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.polls.DiscordPoll
import io.hazelnet.community.data.discord.polls.DiscordPollUpdateProjection
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DiscordPollRepository : CrudRepository<DiscordPoll, Int> {
    fun findByDiscordServerId(discordServerId: Int): List<DiscordPoll>

    @Query(value = "SELECT d.guildId AS guildId, p.id AS pollId, p.channelId AS channelId, p.messageId AS messageId FROM DiscordPoll p JOIN DiscordServer d ON p.discordServer=d WHERE p.openAfter<=:now AND p.openUntil>:now AND p.channelId IS NOT NULL AND p.messageId IS NULL AND p.archived=false AND d.active=true")
    fun findPollsToBeAnnounced(@Param("now") now: Date): List<DiscordPollUpdateProjection>

    @Query(value = "SELECT d.guildId AS guildId, p.id AS pollId, p.channelId AS channelId, p.messageId AS messageId FROM DiscordPoll p JOIN DiscordServer d ON p.discordServer=d WHERE p.openAfter<=:now AND p.openUntil>:now AND p.channelId IS NOT NULL AND p.messageId IS NOT NULL AND p.resultsVisible=true AND p.archived=false AND d.active=true")
    fun listPollResultUpdates(@Param("now") now: Date): List<DiscordPollUpdateProjection>
}