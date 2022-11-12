package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.giveaways.DiscordGiveaway
import io.hazelnet.community.data.discord.giveaways.DiscordGiveawayEntry
import io.hazelnet.community.data.discord.giveaways.GiveawayWinnersCannotBeDrawnException
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
            DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, Random.Default)
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
            DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, Random.Default)
        }
    }

    @Test
    fun drawWinnersResetsBefore() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1, 1),
            DiscordGiveawayEntry(2, Date(), 1, 1),
            DiscordGiveawayEntry(3, Date(), 1, 1),
        ), true, 1, false)

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, Random(51209L))
        assertEquals(1, giveaway.entries.sumOf { it.winningCount }, "One winner and all others reset")
    }

    @Test
    fun drawWinnersHighWeight() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1),
            DiscordGiveawayEntry(2, Date(), 1000),
            DiscordGiveawayEntry(3, Date(), 1),
        ), false, 10, true)

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, Random(51209L))
        assertEquals(10, giveaway.entries.find { it.externalAccountId == 2L }?.winningCount ?: 0, "One winner takes all with a 1000x weight")
    }

    @Test
    fun drawWinnersEqualHighWeight() {
        val giveaway = makeGiveaway(setOf(
            DiscordGiveawayEntry(1, Date(), 1000),
            DiscordGiveawayEntry(2, Date(), 1000),
            DiscordGiveawayEntry(3, Date(), 1000),
        ), false, 9, true)

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, Random(51209L))
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

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, Random(51210L))
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

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, Random(51215L))
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

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, Random(51215L))
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

        DiscordGiveawayService.drawWinnersWithRandom(giveaway, testServer.guildId, Random(51215L))
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

        DiscordGiveawayService.drawWinnersWithRandom(giveawayNonUnique, testServer.guildId, Random(51213L))
        assertEquals(
            mapOf(Pair(1L, 3), Pair(2L, 0), Pair(3L, 0)),
            giveawayNonUnique.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "Account 1 wins all three with this random seed if unique winners are off and weighted is off")

        val giveawayUnique = makeGiveaway(giveawayNonUnique.entries, true, 3, false)

        DiscordGiveawayService.drawWinnersWithRandom(giveawayUnique, testServer.guildId, Random(51213L))
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

        DiscordGiveawayService.drawWinnersWithRandom(giveawayNonUnique, testServer.guildId, Random(51213L))
        assertEquals(
            mapOf(Pair(1L, 3), Pair(2L, 0), Pair(3L, 0)),
            giveawayNonUnique.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "Account 1 wins all three with this random seed if unique winners are off and weighted is on")

        val giveawayUnique = makeGiveaway(giveawayNonUnique.entries, true, 3, true)

        DiscordGiveawayService.drawWinnersWithRandom(giveawayUnique, testServer.guildId, Random(51213L))
        assertEquals(
            mapOf(Pair(1L, 1), Pair(2L, 1), Pair(3L, 1)),
            giveawayUnique.entries.associate { Pair(it.externalAccountId, it.winningCount) },
            "All accounts wins one three with same random seed if unique winners are on and weighted is on")
    }
}