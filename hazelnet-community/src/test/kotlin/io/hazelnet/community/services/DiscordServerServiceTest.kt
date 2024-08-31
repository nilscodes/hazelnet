package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordMember
import io.hazelnet.community.data.discord.DiscordMemberPartial
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.persistence.DiscordServerRepository
import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test

import java.util.*

class DiscordServerServiceTest {

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
        settings = mutableSetOf(),
        members = mutableSetOf(
            DiscordMember(5652, Date(), false, -1)
        )
    )

    @Test
    fun `updating a member in any way resets their premium pledge weights`() {
        val discordServerRepository = mockk<DiscordServerRepository>()
        every { discordServerRepository.save(any()) } returnsArgument 0
        every { discordServerRepository.resetPremiumWeightForExternalAccount(5652) } returns Unit
        val discordServerRetriever = mockk<DiscordServerRetriever>()
        every { discordServerRetriever.getDiscordServer(testServer.guildId) } returns testServer

        val discordServerService = DiscordServerService(mockk(), mockk(), mockk(), discordServerRepository, discordServerRetriever, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), SimpleMeterRegistry(), mockk())
        discordServerService.updateMember(testServer.guildId, 5652, DiscordMemberPartial(true))
        verify { discordServerRepository.resetPremiumWeightForExternalAccount(5652) }
    }
}