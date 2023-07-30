package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.other.EpochDetails
import io.hazelnet.community.data.discord.DiscordReminder
import io.hazelnet.community.data.discord.DiscordReminderType
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.persistence.DiscordReminderRepository
import io.hazelnet.marketplace.data.ReminderInfo
import mu.KotlinLogging
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*

private val logger = KotlinLogging.logger {}

@Service
class DiscordReminderService(
    private val discordServerService: DiscordServerService,
    private val discordReminderRepository: DiscordReminderRepository,
    private val connectService: ConnectService,
    private val rabbitTemplate: RabbitTemplate,
) {
    fun listReminders(guildId: Long): List<DiscordReminder> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return discordReminderRepository.findByDiscordServerId(discordServer.id!!)
    }

    fun addReminder(guildId: Long, discordReminder: DiscordReminder): DiscordReminder {
        val discordServer = discordServerService.getDiscordServer(guildId)
        discordReminder.discordServerId = discordServer.id
        discordReminder.createTime = Date.from(ZonedDateTime.now().toInstant())
        return discordReminderRepository.save(discordReminder)
    }

    fun getReminder(guildId: Long, reminderId: Int): Any {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return getReminder(discordServer, reminderId)
    }

    fun deleteReminder(guildId: Long, reminderId: Int) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val reminder = getReminder(discordServer, reminderId)
        discordReminderRepository.delete(reminder)
    }

    private fun getReminder(discordServer: DiscordServer, reminderId: Int): DiscordReminder {
        val reminder = discordReminderRepository.findByDiscordServerId(discordServer.id!!).find { reminderId == it.id }
        if (reminder != null) {
            return reminder
        }
        throw NoSuchElementException("No reminder with ID $reminderId found on Discord server with guild ID ${discordServer.guildId}")
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 60000)
    fun checkReminders() {
        val epochDetails = connectService.getEpochDetails()
        val reminders = discordReminderRepository.findAllByLastEpochSentIsNullOrLastEpochSentIsNot(epochDetails.epochNo)
        reminders.forEach {
            if ((it.type == DiscordReminderType.AFTER_EPOCH_BOUNDARY && it.secondsOffset < epochDetails.getSecondsAchieved())
                || (it.type == DiscordReminderType.BEFORE_EPOCH_BOUNDARY && it.secondsOffset > epochDetails.getEstimatedSecondsLeft())) {
                sendReminder(it, epochDetails)
            }
        }
    }

    private fun sendReminder(reminder: DiscordReminder, epochDetails: EpochDetails) {
        try {
            val discordServer = discordServerService.getDiscordServerByInternalId(reminder.discordServerId!!)
            val reminderMessageRequest = ReminderInfo(discordServer.guildId, reminder.id!!)
            rabbitTemplate.convertAndSend("scheduledreminders", reminderMessageRequest)
            reminder.lastEpochSent = epochDetails.epochNo
            reminder.lastTimeSent = Date.from(ZonedDateTime.now().toInstant())
            discordReminderRepository.save(reminder)
        } catch (e: Exception) {
            logger.error(e) { "Error sending reminder ${reminder.id} to Discord server ${reminder.discordServerId}" }
        }
    }

}