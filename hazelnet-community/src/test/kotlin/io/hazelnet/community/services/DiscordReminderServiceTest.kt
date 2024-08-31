package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.other.EpochDetails
import io.hazelnet.community.data.discord.DiscordReminder
import io.hazelnet.community.data.discord.DiscordReminderType
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.persistence.DiscordReminderRepository
import io.hazelnet.marketplace.data.ReminderInfo
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.amqp.rabbit.core.RabbitTemplate
import java.util.*

class DiscordReminderServiceTest {

    private val testServer = DiscordServer(
        id = 12,
        guildId = 717264144759390200,
        guildName = "My guild",
        guildOwner = 69693469034096,
        joinTime = Date(),
        guildMemberCount = 420,
        guildMemberUpdateTime = null,
        ownerAccount = null,
        premiumUntil = null,
        premiumReminder = null,
        tokenPolicies = mutableSetOf(),
        stakepools = mutableSetOf(),
        delegatorRoles = mutableSetOf(),
        tokenRoles = mutableSetOf(),
        whitelists = mutableSetOf(),
        settings = mutableSetOf()
    )

    private val testReminders = mapOf(
        Pair(1, DiscordReminder(
            id = 1,
            discordServerId = testServer.id!!,
            creator = 1,
            createTime = Date(1690540253000),
            type = DiscordReminderType.BEFORE_EPOCH_BOUNDARY,
            secondsOffset = 345600,
            reminderChannel = 2,
            title = "Reminder 1",
            reminderText = "Reminder 1 Text",
            lastEpochSent = 332,
            lastTimeSent = Date(1690740253000)
        )),
        Pair(2, DiscordReminder(
            id = 2,
            discordServerId = testServer.id!!,
            creator = 1,
            createTime = Date(1690540253000),
            type = DiscordReminderType.AFTER_EPOCH_BOUNDARY,
            secondsOffset = 36000,
            reminderChannel = 2,
            title = "Reminder 2",
            reminderText = "Reminder 2 Text",
            lastEpochSent = 332,
            lastTimeSent = Date(1690740253000)
        )),
        Pair(3, DiscordReminder(
            id = 3,
            discordServerId = testServer.id!!,
            creator = 1,
            createTime = Date(1690540253000),
            type = DiscordReminderType.BEFORE_EPOCH_BOUNDARY,
            secondsOffset = 100,
            reminderChannel = 2,
            title = "Reminder 3",
            reminderText = "Reminder 3 Text",
            lastEpochSent = 332,
            lastTimeSent = Date(1690740253000)
        )),
        Pair(4, DiscordReminder(
            id = 4,
            discordServerId = testServer.id!!,
            creator = 1,
            createTime = Date(1690540253000),
            type = DiscordReminderType.AFTER_EPOCH_BOUNDARY,
            secondsOffset = 166400,
            reminderChannel = 2,
            title = "Reminder 4",
            reminderText = "Reminder 4 Text",
            lastEpochSent = 332,
            lastTimeSent = Date(1690740253000)
        )),
    )

    @Test
    fun checkReminders() {
        val discordServerRetriever = mockk<DiscordServerRetriever>()
        val discordReminderRepository = mockk<DiscordReminderRepository>()
        val connectService = mockk<ConnectService>()
        val rabbitTemplate = mockk<RabbitTemplate>(relaxUnitFun = true)
        val discordReminderService = DiscordReminderService(discordServerRetriever, discordReminderRepository, connectService, rabbitTemplate)

        every { discordServerRetriever.getDiscordServerByInternalId(testServer.id!!) } returns testServer
        every { connectService.getEpochDetails() } returns EpochDetails(333, 0, 0, 0, 0, Date(System.currentTimeMillis() - 86400000))
        every { discordReminderRepository.save(any()) } returnsArgument 0
        every { discordReminderRepository.findAllByLastEpochSentIsNullOrLastEpochSentIsNot(333) } returns testReminders.values.toList()

        discordReminderService.checkReminders()

        verify { rabbitTemplate.convertAndSend("scheduledreminders", ReminderInfo(717264144759390200, 1)) }
        verify { rabbitTemplate.convertAndSend("scheduledreminders", ReminderInfo(717264144759390200, 2)) }
        verify(exactly = 2) { rabbitTemplate.convertAndSend("scheduledreminders", any<ReminderInfo>()) }

        verify { discordReminderRepository.save(testReminders[1]!!) }
        verify { discordReminderRepository.save(testReminders[2]!!) }
        verify(exactly = 2) { discordReminderRepository.save(any()) }
        assertEquals(333, testReminders[1]!!.lastEpochSent)
        assertEquals(333, testReminders[2]!!.lastEpochSent)
        assertNotNull(testReminders[1]!!.lastTimeSent)
        assertNotNull(testReminders[2]!!.lastTimeSent)
    }
}