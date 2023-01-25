package io.hazelnet.community.persistence;


import io.hazelnet.community.data.discord.DiscordMemberActivity
import io.hazelnet.community.data.discord.DiscordServer
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository;
import java.util.Date
import javax.transaction.Transactional

@Repository
interface DiscordMemberActivityRepository: CrudRepository<DiscordMemberActivity, Int> {

    @Transactional
    @Modifying
    @Query(value = "UPDATE discord_activity SET last_reminder_time=:reminderTime WHERE discord_server_id=:discordServerId AND discord_user_id=:discordUserId", nativeQuery = true)
    fun updateLastReminderTime(@Param("discordServerId") discordServerId: Int, @Param("discordUserId") discordUserId: Long, @Param("reminderTime") reminderTime: Date)

    @Query(value = "SELECT dma FROM DiscordMemberActivity dma WHERE dma.discordServerId=:discordServerId AND dma.lastActivityTime<:activityThreshold AND dma.lastReminderTime IS NULL")
    fun findUsersThatNeedActivityReminder(@Param("discordServerId") discordServerId: Int, @Param("activityThreshold") activityThreshold: Date): List<DiscordMemberActivity>
}
