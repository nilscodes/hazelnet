package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.DiscordReminder
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordReminderRepository : CrudRepository<DiscordReminder, Int> {
    fun findByDiscordServerId(discordServerId: Int): List<DiscordReminder>

    fun findAllByLastEpochSentIsNullOrLastEpochSentIsNot(lastEpochSent: Int): List<DiscordReminder>
}