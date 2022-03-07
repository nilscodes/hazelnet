package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.polls.DiscordPoll
import io.hazelnet.community.data.discord.polls.DiscordPollVote
import io.hazelnet.community.data.discord.polls.PollNotOpenException
import io.hazelnet.community.data.discord.polls.VoteData
import io.hazelnet.community.persistence.DiscordPollRepository
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*
import javax.transaction.Transactional
import kotlin.NoSuchElementException
import kotlin.math.floor

@Service
class DiscordPollService(
    private val discordPollRepository: DiscordPollRepository,
    private val discordServerService: DiscordServerService,
    private val externalAccountService: ExternalAccountService,
    private val snapshotService: MultiAssetSnapshotService,
) {
    fun listPolls(guildId: Long): List<DiscordPoll> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return discordPollRepository.findByDiscordServerId(discordServer.id!!)
    }

    fun addPoll(guildId: Long, discordPoll: DiscordPoll): DiscordPoll {
        val discordServer = discordServerService.getDiscordServer(guildId)
        discordPoll.discordServer = discordServer
        discordPoll.createTime = Date.from(ZonedDateTime.now().toInstant())
        return discordPollRepository.save(discordPoll)
    }

    fun deletePoll(guildId: Long, pollId: Int) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val poll = getPoll(discordServer, pollId)
        discordPollRepository.delete(poll)
    }

    fun getVotesInPoll(guildId: Long, pollId: Int): VoteData {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val poll = getPoll(discordServer, pollId)
        val existingVotes = poll.options
            .associate { option ->
               Pair(
                   option.id!!,
                   option.votes.sumOf { it.weight }
               )
            }
        return VoteData(existingVotes)
    }

    fun getVoteOfUser(guildId: Long, pollId: Int, externalAccountId: Long): VoteData {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val voter = externalAccountService.getExternalAccount(externalAccountId)
        val poll = getPoll(discordServer, pollId)
        val totalVotingPower = this.getVotingPower(poll, externalAccountId)
        val existingVotes = poll.options
            .associate { option ->
                Pair(
                    option.id!!,
                    option.votes.find { it.externalAccountId == voter   .id }?.weight ?: 0
                )
            }
            .filter { it.value > 0 }
            .toMutableMap()
        existingVotes[0] = totalVotingPower
        return VoteData(existingVotes)
    }

    fun getVotingPower(poll: DiscordPoll, externalAccountId: Long): Long {
        if (poll.snapshotId == null || !poll.weighted) {
            return 1
        }
        val snapshot = snapshotService.getSnapshot(poll.snapshotId!!)
        val verifiedStakeAddresses = externalAccountService.getVerifiedStakeAddressesForExternalAccount(externalAccountId)
        return snapshot.data
            .filter { verifiedStakeAddresses.contains(it.stakeAddress) }
            .sumOf { it.tokenQuantity }
    }

    @Transactional
    fun setVote(guildId: Long, pollId: Int, externalAccountId: Long, options: List<Long>): Set<Long> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val voter = externalAccountService.getExternalAccount(externalAccountId)
        val poll = getPoll(discordServer, pollId)
        if (votingIsPossible(poll)) {
            val totalVotingPower = this.getVotingPower(poll, externalAccountId)
            if (totalVotingPower > 0) {
                val optionsToVoteFor = options.toMutableSet()
                poll.options.forEach { option -> option.votes.removeIf { it.externalAccountId == externalAccountId } }
                // Empty option list means vote is removed, so only do anything else if votes were cast
                if (options.isNotEmpty()) {
                    // Remove all invalid options
                    optionsToVoteFor.removeIf { vote -> !poll.options.any { it.id == vote } }
                    if (optionsToVoteFor.size > 1 && !poll.multipleVotes) {
                        throw IllegalArgumentException("Cannot vote for more than one option in poll $pollId on Discord server with guild ID $guildId for votes cast by user $externalAccountId")
                    }

                    val now = Date.from(ZonedDateTime.now().toInstant())
                    if (poll.weighted) {
                        val restVoteWeight = floor(totalVotingPower.toDouble() / options.size).toLong()
                        val firstVoteWeight = totalVotingPower - restVoteWeight * options.size
                        for ((voteCount, optionToVoteFor) in optionsToVoteFor.withIndex()) {
                            val weight = if (voteCount == 0) firstVoteWeight else restVoteWeight
                            poll.options.find { option -> option.id == optionToVoteFor }?.votes?.add(DiscordPollVote(externalAccountId, now, weight))
                        }
                    } else {
                        optionsToVoteFor.forEach { vote ->
                            poll.options.find { option -> option.id == vote }?.votes?.add(DiscordPollVote(externalAccountId, now, 1))
                        }
                    }
                }
                discordPollRepository.save(poll);
                return optionsToVoteFor
            }
            throw NoSuchElementException("User $externalAccountId has no voting power in poll $pollId on Discord server with guild ID $guildId")
        }
        throw PollNotOpenException("Poll $pollId on Discord server with guild ID $guildId is not open for votes by $externalAccountId")
    }

    private fun votingIsPossible(poll: DiscordPoll): Boolean {
        return !poll.archived && Date().after(poll.openAfter) && Date().before(poll.openUntil)
    }

    private fun getPoll(discordServer: DiscordServer, pollId: Int): DiscordPoll {
        val poll = discordPollRepository.findByDiscordServerId(discordServer.id!!).find { pollId == it.id }
        if (poll != null) {
            return poll
        }
        throw NoSuchElementException("No poll with ID $pollId found on Discord server with guild ID ${discordServer.guildId}")
    }
}