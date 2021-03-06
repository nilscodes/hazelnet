package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.Whitelist
import io.hazelnet.community.data.discord.WhitelistPartial
import io.hazelnet.community.persistence.DiscordWhitelistRepository
import io.mockk.CapturingSlot
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.util.*

internal class WhitelistServiceTest {

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
        tokenPolicies = mutableSetOf(),
        stakepools = mutableSetOf(),
        delegatorRoles = mutableSetOf(),
        tokenRoles = mutableSetOf(),
        whitelists = mutableSetOf(Whitelist(
            id = 1L,
            discordServerId = 12,
            creator = 515L,
            createTime = Date(),
            name = "wl",
            displayName = "Whitelist With Name",
            signupAfter = null,
            signupUntil = null,
            launchDate = null,
            requiredRoleId = 81294L,
            maxUsers = null,
            closed = false,
            signups = mutableSetOf(),
            sharedWithServer = null,
            logoUrl = null,
        )),
        settings = mutableSetOf()
    )

    @Test
    fun updateWhitelistLaunchDate() {
        val (whitelistSaveSlot, whitelistService) = prepareWhitelistTest()
        val now = Date()
        whitelistService.updateWhitelist(717264144759390200L, 1, WhitelistPartial(
            displayName = null,
            signupAfter = null,
            signupUntil = null,
            launchDate = now,
            closed = null,
            logoUrl = null,
            sharedWithServer = null,
            maxUsers = null,
        ))
        assertEquals(now, whitelistSaveSlot.captured.launchDate)
    }

    @Test
    fun updateWhitelistSignupAfter() {
        val (whitelistSaveSlot, whitelistService) = prepareWhitelistTest()
        val now = Date()
        whitelistService.updateWhitelist(717264144759390200L, 1, WhitelistPartial(
            displayName = null,
            signupAfter = now,
            signupUntil = null,
            launchDate = null,
            closed = null,
            logoUrl = null,
            sharedWithServer = null,
            maxUsers = null,
        ))
        assertEquals(now, whitelistSaveSlot.captured.signupAfter)
    }

    @Test
    fun updateWhitelistSignupUntil() {
        val (whitelistSaveSlot, whitelistService) = prepareWhitelistTest()
        val now = Date()
        whitelistService.updateWhitelist(717264144759390200L, 1, WhitelistPartial(
            displayName = null,
            signupAfter = null,
            signupUntil = now,
            launchDate = null,
            closed = null,
            logoUrl = null,
            sharedWithServer = null,
            maxUsers = null,
        ))
        assertEquals(now, whitelistSaveSlot.captured.signupUntil)
    }

    private fun prepareWhitelistTest(): Pair<CapturingSlot<Whitelist>, WhitelistService> {
        val mockWhitelistRepository = mockk<DiscordWhitelistRepository>()
        val whitelistSaveSlot = slot<Whitelist>()
        every {
            mockWhitelistRepository.save(capture(whitelistSaveSlot))
        }.answers { whitelistSaveSlot.captured }
        val whitelistService = WhitelistService(
            getMockDiscordServerService(),
            mockk(),
            mockk(),
            mockWhitelistRepository,
        )
        return Pair(whitelistSaveSlot, whitelistService)
    }

    private fun getMockDiscordServerService(): DiscordServerService {
        val discordServerService = mockk<DiscordServerService>()
        every { discordServerService.getDiscordServer(testServer.guildId) } returns testServer
        return discordServerService
    }
}