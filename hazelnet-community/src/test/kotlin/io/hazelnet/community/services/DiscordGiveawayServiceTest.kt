package io.hazelnet.community.services

import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.giveaways.DiscordGiveaway
import io.hazelnet.community.data.discord.giveaways.DiscordGiveawayEntry
import io.hazelnet.community.data.discord.giveaways.GiveawayWinnersCannotBeDrawnException
import io.hazelnet.community.persistence.DiscordGiveawayRepository
import io.hazelnet.community.persistence.ExternalAccountRepository
import io.hazelnet.shared.data.ExternalAccountType
import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.util.*
import kotlin.random.Random

internal class DiscordGiveawayServiceTest {

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

    private fun makeGiveaway(
        entries: Set<DiscordGiveawayEntry>,
        uniqueWinners: Boolean,
        winnerCount: Int,
        weighted: Boolean,
    )  = DiscordGiveaway(
        id = 2,
        discordServer = testServer,
        creator = 1L,
        channelId = null,
        messageId = null,
        name = "G",
        displayName = "Giveaway",
        description = "Winning",
        createTime = Date(),
        openAfter = null,
        openUntil = null,
        weighted,
        uniqueWinners,
        archived = false,
        winnerCount,
        entries = entries.toMutableSet(),
        )

    @Test
    fun drawWinnersWithRandomUniqueTooManyWinnersNotWeighted() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1),
            DiscordGiveawayEntry(2, Date(), 1),
            DiscordGiveawayEntry(3, Date(), 1),
        ), true, 4, false)
        assertThrows(GiveawayWinnersCannotBeDrawnException::class.java) {
            DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, emptySet(), Random.Default)
        }
    }

    @Test
    fun drawWinnersWithRandomUniqueTooManyWinnersWeighted() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1),
            DiscordGiveawayEntry(2, Date(), 1),
            DiscordGiveawayEntry(3, Date(), 1),
        ), true, 4, true)
        assertThrows(GiveawayWinnersCannotBeDrawnException::class.java) {
            DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, emptySet(), Random.Default)
        }
    }

    @Test
    fun drawWinnersResetsBefore() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1, 1),
            DiscordGiveawayEntry(2, Date(), 1, 1),
            DiscordGiveawayEntry(3, Date(), 1, 1),
        ), true, 1, false)

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, emptySet(), Random(51209L))
        assertEquals(1, giveaway.entries.sumOf { it.winningCount }, "One winner and all others reset")
    }

    @Test
    fun `draw winners fails if only one entry exists and it is excluded`() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1, 0),
        ), true, 1, false)
        assertThrows(GiveawayWinnersCannotBeDrawnException::class.java) {
            DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, setOf(1), Random.Default)
        }
    }

    @Test
    fun `draw winners with a random that would draw an excluded winner reverts to alternative winner with unique winners on`() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1, 0),
            DiscordGiveawayEntry(2, Date(), 1, 0),
        ), true, 1, false)
        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, setOf(1), Random(51209L))
        assertEquals(1, giveaway.entries.find { it.externalAccountId == 2L }?.winningCount ?: 0, "External account 2 is the winner despite the Random picking external account 1 first")
    }

    @Test
    fun `draw winners with a random that would draw an excluded winner reverts to alternative winner with unique winners off`() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1, 0),
            DiscordGiveawayEntry(2, Date(), 1, 0),
        ), false, 1, false)
        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, setOf(1), Random(51209L))
        assertEquals(1, giveaway.entries.find { it.externalAccountId == 2L }?.winningCount ?: 0, "External account 2 is the winner despite the Random picking external account 1 first")
    }

    @Test
    fun drawWinnersHighWeight() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1),
            DiscordGiveawayEntry(2, Date(), 1000),
            DiscordGiveawayEntry(3, Date(), 1),
        ), false, 10, true)

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, emptySet(), Random(51209L))
        assertEquals(10, giveaway.entries.find { it.externalAccountId == 2L }?.winningCount ?: 0, "One winner takes all with a 1000x weight")
    }

    @Test
    fun drawWinnersEqualHighWeight() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1000),
            DiscordGiveawayEntry(2, Date(), 1000),
            DiscordGiveawayEntry(3, Date(), 1000),
        ), false, 9, true)

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, emptySet(), Random(51209L))
        assertEquals(
            mapOf(Pair(1L, 3), Pair(2L, 3), Pair(3L, 3)),
            giveaway.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "Equal winnings with this random seed")
    }

    @Test
    fun drawWinnersEqualLowWeight() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1),
            DiscordGiveawayEntry(2, Date(), 1),
            DiscordGiveawayEntry(3, Date(), 1),
        ), false, 9, true)

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, emptySet(), Random(51210L))
        assertEquals(
            mapOf(Pair(1L, 3), Pair(2L, 3), Pair(3L, 3)),
            giveaway.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "Equal winnings with this random seed")
    }

    @Test
    fun drawWinnersEqualNoWeight() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1),
            DiscordGiveawayEntry(2, Date(), 1),
            DiscordGiveawayEntry(3, Date(), 1),
        ), false, 9, false)

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, emptySet(), Random(51215L))
        assertEquals(
            mapOf(Pair(1L, 3), Pair(2L, 3), Pair(3L, 3)),
            giveaway.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "Equal winnings with this random seed")
    }

    @Test
    fun drawWinnersOneNoWeightNoUniqueWinners() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1),
            DiscordGiveawayEntry(2, Date(), 1),
            DiscordGiveawayEntry(3, Date(), 1),
        ), false, 1, false)

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, emptySet(), Random(51215L))
        assertEquals(
            mapOf(Pair(1L, 1), Pair(2L, 0), Pair(3L, 0)),
            giveaway.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "Account 1 wins with this random seed, no one else does")
    }

    @Test
    fun drawWinnersOneNoWeightWithUniqueWinners() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1),
            DiscordGiveawayEntry(2, Date(), 1),
            DiscordGiveawayEntry(3, Date(), 1),
        ), false, 1, false)

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, emptySet(), Random(51215L))
        assertEquals(
            mapOf(Pair(1L, 1), Pair(2L, 0), Pair(3L, 0)),
            giveaway.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "Account 1 wins with this random seed, no one else does")
    }

    @Test
    fun drawWinnersNonWeightedThreeCompareSameSeedUniqueAndNot() {
        val giveawayNonUnique = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1),
            DiscordGiveawayEntry(2, Date(), 1),
            DiscordGiveawayEntry(3, Date(), 1),
        ), false, 3, false)

        DiscordGiveawayService.drawWinnersWithRandom(giveawayNonUnique, testServer.guildId, emptySet(), Random(51213L))
        assertEquals(
            mapOf(Pair(1L, 3), Pair(2L, 0), Pair(3L, 0)),
            giveawayNonUnique.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "Account 1 wins all three with this random seed if unique winners are off and weighted is off")

        val giveawayUnique = makeGiveaway(giveawayNonUnique.entries, true, 3, false)

        DiscordGiveawayService.drawWinnersWithRandom(giveawayUnique, testServer.guildId, emptySet(), Random(51213L))
        assertEquals(
            mapOf(Pair(1L, 1), Pair(2L, 1), Pair(3L, 1)),
            giveawayUnique.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "All accounts wins one three with same random seed if unique winners are on and weighted is off")
    }

    @Test
    fun drawWinnersWeightedThreeCompareSameSeedUniqueAndNot() {
        val giveawayNonUnique = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1000),
            DiscordGiveawayEntry(2, Date(), 1),
            DiscordGiveawayEntry(3, Date(), 1),
        ), false, 3, true)

        DiscordGiveawayService.drawWinnersWithRandom(giveawayNonUnique, testServer.guildId, emptySet(), Random(51213L))
        assertEquals(
            mapOf(Pair(1L, 3), Pair(2L, 0), Pair(3L, 0)),
            giveawayNonUnique.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "Account 1 wins all three with this random seed if unique winners are off and weighted is on")

        val giveawayUnique = makeGiveaway(giveawayNonUnique.entries, true, 3, true)

        DiscordGiveawayService.drawWinnersWithRandom(giveawayUnique, testServer.guildId, emptySet(), Random(51213L))
        assertEquals(
            mapOf(Pair(1L, 1), Pair(2L, 1), Pair(3L, 1)),
            giveawayUnique.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "All accounts wins one three with same random seed if unique winners are on and weighted is on")
    }

    @Test
    fun `draw winners queries by group for excluded users when group name is set`() {
        val basicGiveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1),
            DiscordGiveawayEntry(2, Date(), 1),
        ), false, 1, false)
        basicGiveaway.group = "potatoes"

        val discordServerRetriever = mockk<DiscordServerRetriever>()
        every { discordServerRetriever.getDiscordServer(testServer.guildId) } returns testServer

        val externalAccountRepository = mockk<ExternalAccountRepository>()
        every { externalAccountRepository.findById(any()) } returns Optional.of(ExternalAccount(1, "12", "shared", Date(), ExternalAccountType.DISCORD, null, false, mutableSetOf()))
        val externalAccountService = ExternalAccountService(externalAccountRepository, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), SimpleMeterRegistry())

        val giveawayRepository = mockk<DiscordGiveawayRepository>()
        every { giveawayRepository.findByDiscordServerId(12) } returns listOf(basicGiveaway)
        every { giveawayRepository.findWinnersOfGroupExcept(2, 12, "potatoes") } returns listOf(1, 3)
        every { giveawayRepository.save(any()) } returnsArgument 0

        val giveawayService = DiscordGiveawayService(giveawayRepository, discordServerRetriever, externalAccountService, mockk(), mockk())

        for (i in 1..100) {
            giveawayService.drawWinners(testServer.guildId, basicGiveaway.id!!)
            assertEquals(
                mapOf(Pair(1L, 0), Pair(2L, 1)),
                basicGiveaway.entries.associate { Pair(it.externalAccountId, it.winningCount) },
                "Account 2 wins always because account 1 is excluded from winning another giveaway in the group"
            )
        }
        verify { giveawayRepository.findWinnersOfGroupExcept(2, 12, "potatoes") }
    }
}