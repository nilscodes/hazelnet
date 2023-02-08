package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.AwardedRoleProjection
import io.hazelnet.community.data.discord.quizzes.DiscordQuiz
import io.hazelnet.community.data.discord.quizzes.DiscordQuizUpdateProjection
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DiscordQuizRepository : CrudRepository<DiscordQuiz, Int> {
    fun findByDiscordServerId(discordServerId: Int): List<DiscordQuiz>

    @Query(value = "SELECT d.guildId AS guildId, q.id AS quizId, q.channelId AS channelId, q.messageId AS messageId FROM DiscordQuiz q JOIN DiscordServer d ON q.discordServer=d WHERE q.openAfter<=:now AND (q.openUntil>:now OR q.openUntil IS NULL) AND q.channelId IS NOT NULL AND q.messageId IS NULL AND q.archived=false AND d.active=true")
    fun findQuizzesToBeAnnounced(@Param("now") now: Date): List<DiscordQuizUpdateProjection>

    @Query("SELECT e.referenceId as externalReferenceId, q.awardedRole as awardedRole FROM DiscordQuiz q JOIN q.completions co JOIN ExternalAccount e ON e.id=co.externalAccountId WHERE q.awardedRole IS NOT NULL AND q.discordServer.id=:discordServerId AND co.qualifies=true")
    fun findAwardedRoleAssignments(@Param("discordServerId") discordServerId: Int): List<AwardedRoleProjection>

    @Query("SELECT e.referenceId as externalReferenceId, q.awardedRole as awardedRole FROM DiscordQuiz q JOIN q.completions co JOIN ExternalAccount e ON e.id=co.externalAccountId WHERE q.awardedRole IS NOT NULL AND q.discordServer.id=:discordServerId AND co.qualifies=true AND e.id=:externalAccountId")
    fun findAwardedRoleAssignmentsForExternalAccount(@Param("discordServerId") discordServerId: Int, @Param("externalAccountId") externalAccountId: Long): List<AwardedRoleProjection>
}