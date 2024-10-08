package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordRequiredRole
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.whitelists.Whitelist
import io.hazelnet.community.data.discord.whitelists.WhitelistPartial
import io.hazelnet.community.persistence.DiscordWhitelistRepository
import io.hazelnet.shared.data.SharedWhitelist
import io.hazelnet.shared.data.WhitelistType
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
        premiumReminder = null,
        tokenPolicies = mutableSetOf(),
        stakepools = mutableSetOf(),
        delegatorRoles = mutableSetOf(),
        tokenRoles = mutableSetOf(),
        whitelists = mutableSetOf(
            Whitelist(
            id = 1L,
            discordServerId = 12,
            creator = 515L,
            createTime = Date(),
            name = "wl",
            displayName = "Whitelist With Name",
            signupAfter = null,
            signupUntil = null,
            launchDate = null,
            requiredRoles = mutableSetOf(DiscordRequiredRole(81294L)),
            awardedRole = null,
            maxUsers = null,
            closed = false,
            signups = mutableSetOf(),
            sharedWithServer = null,
            logoUrl = null,
        )
        ),
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
            awardedRole = null,
            requiredRoles = null,
        )
        )
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
            awardedRole = null,
            requiredRoles = null,
        )
        )
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
            awardedRole = null,
            requiredRoles = null,
        )
        )
        assertEquals(now, whitelistSaveSlot.captured.signupUntil)
    }

    @Test
    fun getSharedWhitelists() {
        val sharedServer = DiscordServer(
            id = 66,
            guildId = 717264144759390238,
            guildName = "My shared",
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
        val mockWhitelistRepository = mockk<DiscordWhitelistRepository>()
        every {
            mockWhitelistRepository.findBySharedWithServer(testServer.id!!)
        } returns listOf(
            Whitelist(
            id = 15,
            name = "white",
            displayName = "Black",
            discordServerId = 66,
            creator = 15L,
            createTime = Date(),
            requiredRoles = mutableSetOf(DiscordRequiredRole(4141L)),
            awardedRole = null,
            sharedWithServer = testServer.id,
        )
        )

        val mockDiscordServerService = getMockDiscordServerRetriever()
        every {
            mockDiscordServerService.getDiscordServerByInternalId(sharedServer.id!!)
        } returns sharedServer
        val whitelistService = WhitelistService(
            mockDiscordServerService,
            mockk(),
            mockk(),
            mockWhitelistRepository,
            mockk(),
        )
        assertEquals(listOf(SharedWhitelist(
            guildId = sharedServer.guildId,
            guildName = sharedServer.guildName,
            whitelistName = "white",
            whitelistDisplayName = "Black",
            signups = emptySet(),
            type = WhitelistType.WALLET_ADDRESS
        )), whitelistService.getSharedWhitelists(testServer.guildId, false))
    }

    private fun prepareWhitelistTest(): Pair<CapturingSlot<Whitelist>, WhitelistService> {
        val mockWhitelistRepository = mockk<DiscordWhitelistRepository>()
        val whitelistSaveSlot = slot<Whitelist>()
        every {
            mockWhitelistRepository.save(capture(whitelistSaveSlot))
        }.answers { whitelistSaveSlot.captured }
        val whitelistService = WhitelistService(
            getMockDiscordServerRetriever(),
            mockk(),
            mockk(),
            mockWhitelistRepository,
            mockk(),
        )
        return Pair(whitelistSaveSlot, whitelistService)
    }

    private fun getMockDiscordServerRetriever(): DiscordServerRetriever {
        val discordServerRetriever = mockk<DiscordServerRetriever>()
        every { discordServerRetriever.getDiscordServer(testServer.guildId) } returns testServer
        return discordServerRetriever
    }
}