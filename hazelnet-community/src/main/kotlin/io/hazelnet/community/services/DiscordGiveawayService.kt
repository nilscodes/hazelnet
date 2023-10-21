package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.giveaways.*
import io.hazelnet.community.data.external.tokenregistry.TokenMetadata
import io.hazelnet.community.persistence.DiscordGiveawayRepository
import io.hazelnet.community.services.external.CardanoTokenRegistryService
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*
import kotlin.random.Random

@Service
class DiscordGiveawayService(
    private val discordGiveawayRepository: DiscordGiveawayRepository,
    private val discordServerService: DiscordServerService,
    private val externalAccountService: ExternalAccountService,
    private val snapshotService: MultiAssetSnapshotService,
    private val cardanoTokenRegistryService: CardanoTokenRegistryService,
) {
    fun listGiveaways(guildId: Long): List<DiscordGiveaway> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return discordGiveawayRepository.findByDiscordServerId(discordServer.id!!)
    }

    fun addGiveaway(guildId: Long, discordGiveaway: DiscordGiveaway): DiscordGiveaway {
        val discordServer = discordServerService.getDiscordServer(guildId)
        discordGiveaway.discordServer = discordServer
        discordGiveaway.createTime = Date.from(ZonedDateTime.now().toInstant())
        return discordGiveawayRepository.save(discordGiveaway)
    }

    fun updateGiveaway(guildId: Long, giveawayId: Int, discordGiveawayPartial: DiscordGiveawayPartial): DiscordGiveaway {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val giveaway = getGiveaway(discordServer, giveawayId)
        if (discordGiveawayPartial.channelId != null) {
            giveaway.channelId = discordGiveawayPartial.channelId
        }
        if (discordGiveawayPartial.messageId != null) {
            giveaway.messageId = discordGiveawayPartial.messageId
        }
        if (discordGiveawayPartial.displayName != null) {
            giveaway.displayName = discordGiveawayPartial.displayName
        }
        if (discordGiveawayPartial.description != null) {
            giveaway.description = discordGiveawayPartial.description
        }
        if (discordGiveawayPartial.openAfter != null) {
            giveaway.openAfter = discordGiveawayPartial.openAfter
        }
        if (discordGiveawayPartial.openUntil != null) {
            giveaway.openUntil = discordGiveawayPartial.openUntil
        }
        if (discordGiveawayPartial.archived != null) {
            giveaway.archived = discordGiveawayPartial.archived
        }
        if (discordGiveawayPartial.requiredRoles != null) {
            giveaway.requiredRoles = discordGiveawayPartial.requiredRoles
        }
        if (discordGiveawayPartial.winnerCount != null) {
            giveaway.winnerCount = discordGiveawayPartial.winnerCount
        }
        if (discordGiveawayPartial.uniqueWinners != null) {
            giveaway.uniqueWinners = discordGiveawayPartial.uniqueWinners
        }
        discordGiveawayRepository.save(giveaway)
        return giveaway
    }

    fun deleteGiveaway(guildId: Long, giveawayId: Int) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val giveaway = getGiveaway(discordServer, giveawayId)
        discordGiveawayRepository.delete(giveaway)
    }

    fun getGiveaway(guildId: Long, giveawayId: Int): DiscordGiveaway {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return getGiveaway(discordServer, giveawayId)
    }

    private fun getGiveaway(discordServer: DiscordServer, giveawayId: Int): DiscordGiveaway {
        val giveaway = discordGiveawayRepository.findByDiscordServerId(discordServer.id!!).find { giveawayId == it.id }
        if (giveaway != null) {
            return giveaway
        }
        throw NoSuchElementException("No giveaway with ID $giveawayId found on Discord server with guild ID ${discordServer.guildId}")
    }

    fun getParticipationOfUser(guildId: Long, giveawayId: Int, externalAccountId: Long): ParticipationData {
        val giveaway = getGiveaway(guildId, giveawayId)
        val entryForUser = giveaway.entries.find { it.externalAccountId == externalAccountId }
        return if (entryForUser != null) {
            ParticipationData(1, entryForUser.weight)
        } else {
            ParticipationData(0, getGiveawayEntryWeight(giveaway, externalAccountId))
        }
    }

    fun participateAsUser(guildId: Long, giveawayId: Int, externalAccountId: Long): ParticipationData {
        val giveaway = getGiveaway(guildId, giveawayId)
        if (enteringIsPossible(giveaway)) {
            val entryWeight = getGiveawayEntryWeight(giveaway, externalAccountId)
            if (entryWeight > 0) {
                giveaway.entries.removeIf { it.externalAccountId == externalAccountId }
                giveaway.entries.add(DiscordGiveawayEntry(externalAccountId, Date(), entryWeight))
                discordGiveawayRepository.save(giveaway)
                return ParticipationData(1, entryWeight)
            }
            throw NoSuchElementException("User $externalAccountId has no entries to participate in giveaway $giveawayId on Discord server with guild ID $guildId")
        }
        throw GiveawayNotOpenException("Giveaway $giveawayId on Discord server with guild ID $guildId is not open for entries by $externalAccountId")
    }

    fun removeParticipationAsUser(guildId: Long, giveawayId: Int, externalAccountId: Long) {
        val giveaway = getGiveaway(guildId, giveawayId)
        if (enteringIsPossible(giveaway)) {
            if (giveaway.entries.removeIf { it.externalAccountId == externalAccountId }) {
                discordGiveawayRepository.save(giveaway)
            }
        } else {
            throw GiveawayNotOpenException("Giveaway $giveawayId on Discord server with guild ID $guildId is not open for removal of entry by $externalAccountId")
        }
    }

    private fun enteringIsPossible(giveaway: DiscordGiveaway): Boolean {
        return !giveaway.archived
                && (giveaway.openAfter == null || Date().after(giveaway.openAfter))
                && (giveaway.openUntil == null || Date().before(giveaway.openUntil))
    }
    fun getGiveawayEntryWeight(giveaway: DiscordGiveaway, externalAccountId: Long): Long {
        if (giveaway.snapshotIds.isEmpty()) {
            return 1
        }
        return snapshotService.getTokenWeightOfExternalAccount(giveaway.snapshotIds, externalAccountId, giveaway.weighted)
    }

    fun getParticipationForGiveaway(guildId: Long, giveawayId: Int): ParticipationData {
        val giveaway = getGiveaway(guildId, giveawayId)
        val entries = giveaway.entries
        return ParticipationData(entries.size, entries.sumOf { it.weight })
    }

    fun drawWinners(guildId: Long, giveawayId: Int): WinnerList {
        val giveaway = getGiveaway(guildId, giveawayId)

        val sameGroupWinners = if (giveaway.group != null) {
            discordGiveawayRepository.findWinnersOfGroupExcept(giveaway.id!!, giveaway.discordServer?.id!!, giveaway.group!!).toSet()
        } else {
            emptySet()
        }

        drawWinnersWithRandom(giveaway, guildId, sameGroupWinners, Random.Default)

        giveaway.archived = true
        discordGiveawayRepository.save(giveaway)

        // Get winner reveal data
        return getWinnerList(guildId, giveaway)
    }

    fun getWinnerList(guildId: Long, giveawayId: Int) = getWinnerList(guildId, getGiveaway(guildId, giveawayId))

    fun getWinnerList(guildId: Long, giveaway: DiscordGiveaway): WinnerList {
        val winners = giveaway.entries.filter { it.winningCount > 0 }
        if (winners.isNotEmpty()) {
            val winnerList = mutableListOf<String>()
            when (giveaway.drawType) {
                GiveawayDrawType.DISCORD_ID -> {
                    winners.forEach {
                        val externalAccount = externalAccountService.getExternalAccount(it.externalAccountId)
                        winnerList.addAll(List(it.winningCount) { externalAccount.referenceId })
                    }
                }
                GiveawayDrawType.WALLET_ADDRESS -> {
                    winners.forEach {
                        val verificationList =
                            externalAccountService.getConfirmedExternalAccountVerifications(it.externalAccountId)
                        val address = if (verificationList.isEmpty()) "NO_ADDRESS_PROVIDED" else verificationList.first().address
                        winnerList.addAll(List(it.winningCount) { address })
                    }
                }
            }
            return WinnerList(winnerList, giveaway.winnerCount, giveaway.drawType)
        }
        throw GiveawayWinnersNotDrawnException("No winners have been drawn for giveaway with ID ${giveaway.id} on Discord server with guild ID ${guildId}")
    }

    fun listGiveawaysToBeAnnounced(): List<DiscordGiveawayUpdate> {
        return discordGiveawayRepository.findGiveawaysToBeAnnounced(Date()).map {
            DiscordGiveawayUpdate(
                guildId = it.getGuildId(),
                giveawayId = it.getGiveawayId(),
                channelId = it.getChannelId(),
                messageId = it.getMessageId(),
            )
        }
    }

    fun listGiveawayResultUpdates(): List<DiscordGiveawayUpdate> {
        return discordGiveawayRepository.listGiveawayResultUpdates(Date()).map {
            DiscordGiveawayUpdate(
                guildId = it.getGuildId(),
                giveawayId = it.getGiveawayId(),
                channelId = it.getChannelId(),
                messageId = it.getMessageId(),
            )
        }
    }

    fun getTokenRegistryMetadataForGiveaway(guildId: Long, giveawayId: Int): TokenMetadata? {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val giveaway = getGiveaway(discordServer, giveawayId)
        if (giveaway.snapshotIds.size == 1) {
            val assetFingerprint = snapshotService.getAssetFingerprintForSnapshot(giveaway.snapshotIds.first())
            if (assetFingerprint != null) {
                return cardanoTokenRegistryService.getTokenMetadata(assetFingerprint)
            }
        }
        return null
    }

    companion object {
        @JvmStatic
        fun drawWinnersWithRandom(
            giveaway: DiscordGiveaway,
            guildId: Long,
            excludedWinners: Set<Long>,
            drawingRandom: Random,
        ) {
            // Reset current winners
            giveaway.entries.forEach { it.winningCount = 0 }

            fun getCandidates(): Collection<DiscordGiveawayEntry> {
                val candidates = if (giveaway.uniqueWinners) {
                    giveaway.entries.filter { it.winningCount == 0 }
                } else {
                    giveaway.entries
                }
                return if (excludedWinners.isNotEmpty()) {
                    candidates.filter { !excludedWinners.contains(it.externalAccountId) }
                } else {
                    candidates
                }
            }

            // Draw actual winners
            var winnersToDraw = giveaway.winnerCount
            if (giveaway.weighted) {
                while (winnersToDraw > 0) {
                    val candidates = getCandidates().sortedBy { it.weight }
                    val maxValue = candidates.sumOf { it.weight }
                    if (maxValue > 0) {
                        val winningNumber = (0L until maxValue).random(drawingRandom)
                        var currentBase = 0L
                        val winner = candidates.find {
                            if (winningNumber >= currentBase && winningNumber < currentBase + it.weight) {
                                true
                            } else {
                                currentBase += it.weight
                                false
                            }
                        }
                        if (winner != null) {
                            winner.winningCount += 1
                            winnersToDraw -= 1
                        } else {
                            throw GiveawayWinnersCannotBeDrawnException("Stopped attempting to draw weighted winners for giveaway ${giveaway.id} on Discord server $guildId. Please resolve the conflict with an admin.")
                        }
                    } else {
                        throw GiveawayWinnersCannotBeDrawnException("Stopped attempting to draw weighted winners for giveaway ${giveaway.id} on Discord server $guildId. Please resolve the conflict with an admin.")
                    }
                }
            } else {
                while (winnersToDraw > 0) {
                    val candidates = getCandidates()
                    val winner = candidates.randomOrNull(drawingRandom)
                    if (winner != null) {
                        winner.winningCount += 1
                        winnersToDraw -= 1
                    } else {
                        throw GiveawayWinnersCannotBeDrawnException("Stopped attempting to draw non-weighted winners for giveaway ${giveaway.id} on Discord server $guildId. Please resolve the conflict with an admin.")
                    }
                }
            }
        }
    }

}