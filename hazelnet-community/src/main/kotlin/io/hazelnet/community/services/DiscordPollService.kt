package io.hazelnet.community.services

import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.polls.*
import io.hazelnet.community.data.external.voteaire.BallotTypePolicyId
import io.hazelnet.community.persistence.DiscordPollRepository
import io.hazelnet.community.services.external.VoteaireService
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
    private val voteaireService: VoteaireService,
) {
    fun listPolls(guildId: Long): List<DiscordPoll> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return discordPollRepository.findByDiscordServerId(discordServer.id!!)
    }

    fun addPoll(guildId: Long, discordPoll: DiscordPoll): DiscordPoll {
        val discordServer = discordServerService.getDiscordServer(guildId)
        discordPoll.discordServer = discordServer
        discordPoll.createTime = Date.from(ZonedDateTime.now().toInstant())
        if (discordPoll.voteaireUUID != null) {
            augmentWithVoteaireData(discordPoll)
        }
        return discordPollRepository.save(discordPoll)
    }

    fun updatePoll(guildId: Long, pollId: Int, discordPollPartial: DiscordPollPartial): DiscordPoll {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val poll = getPoll(discordServer, pollId)
        if (discordPollPartial.channelId != null) {
            poll.channelId = discordPollPartial.channelId
        }
        if (discordPollPartial.messageId != null) {
            poll.messageId = discordPollPartial.messageId
        }
        if (discordPollPartial.displayName != null) {
            poll.displayName = discordPollPartial.displayName
        }
        if (discordPollPartial.description != null) {
            poll.description = discordPollPartial.description
        }
        if (discordPollPartial.openAfter != null) {
            poll.openAfter = discordPollPartial.openAfter
        }
        if (discordPollPartial.openUntil != null) {
            poll.openUntil = discordPollPartial.openUntil
        }
        if (discordPollPartial.resultsVisible != null) {
            poll.resultsVisible = discordPollPartial.resultsVisible
        }
        if (discordPollPartial.archived != null) {
            poll.archived = discordPollPartial.archived
        }
        if (discordPollPartial.requiredRoles != null) {
            poll.requiredRoles = discordPollPartial.requiredRoles
        }
        discordPollRepository.save(poll)
        return poll
    }

    fun deletePoll(guildId: Long, pollId: Int) {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val poll = getPoll(discordServer, pollId)
        discordPollRepository.delete(poll)
    }

    fun getVotesInPoll(guildId: Long, pollId: Int): VoteData {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val poll = getPoll(discordServer, pollId)
        return getExistingVotesFromPoll(poll)
    }

    private fun getExistingVotesFromPoll(poll: DiscordPoll): VoteData {
        val existingVotes = if (poll.voteaireUUID != null) {
            getExistingVotesFromVoteaireBallot(poll)
        } else {
            getExistingVotesFromDiscordPoll(poll)
        }
        return VoteData(existingVotes)
    }

    private fun getExistingVotesFromDiscordPoll(poll: DiscordPoll) = poll.options
        .associate { option ->
            Pair(
                option.id!!,
                option.votes.sumOf { it.weight }
            )
        }

    private fun getExistingVotesFromVoteaireBallot(poll: DiscordPoll) =
        voteaireService.getProposalResults(poll.voteaireUUID!!)
            .questions[0].responses.associate { choice ->
            Pair(
                poll.options.find { it.text == choice.choice }?.id ?: 0,
                choice.choiceWeight!!
            )
        }

    fun getVoteOfUser(guildId: Long, pollId: Int, externalAccountId: Long): VoteData {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val voter = externalAccountService.getExternalAccount(externalAccountId)
        val poll = getPoll(discordServer, pollId)
        val totalVotingPower = this.getVotingPower(poll, externalAccountId)
        return getExistingVoteOfUserFromPoll(poll, voter, totalVotingPower)
    }

    private fun getExistingVoteOfUserFromPoll(
        poll: DiscordPoll,
        voter: ExternalAccount,
        totalVotingPower: Long
    ): VoteData {
        val existingVotes = poll.options
            .associate { option ->
                Pair(
                    option.id!!,
                    option.votes.find { it.externalAccountId == voter.id }?.weight ?: 0
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
    fun setVoteForUser(guildId: Long, pollId: Int, externalAccountId: Long, options: List<Long>): Map<String, VoteData> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val voter = externalAccountService.getExternalAccount(externalAccountId) // Verify the voter exists - throws if not
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
                        val restVoteWeight = floor(totalVotingPower.toDouble() / optionsToVoteFor.size).toLong()
                        val firstVoteWeight = totalVotingPower - (restVoteWeight * (optionsToVoteFor.size - 1))
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
                return mapOf(
                    Pair("user", getExistingVoteOfUserFromPoll(poll, voter, totalVotingPower)),
                    Pair("poll", getExistingVotesFromPoll(poll))
                )
            }
            throw NoSuchElementException("User $externalAccountId has no voting power in poll $pollId on Discord server with guild ID $guildId")
        }
        throw PollNotOpenException("Poll $pollId on Discord server with guild ID $guildId is not open for votes by $externalAccountId")
    }

    private fun votingIsPossible(poll: DiscordPoll): Boolean {
        return !poll.archived && Date().after(poll.openAfter) && Date().before(poll.openUntil)
    }

    fun getPoll(guildId: Long, pollId: Int): DiscordPoll {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return getPoll(discordServer, pollId)
    }

    private fun getPoll(discordServer: DiscordServer, pollId: Int): DiscordPoll {
        val poll = discordPollRepository.findByDiscordServerId(discordServer.id!!).find { pollId == it.id }
        if (poll != null) {
            return poll
        }
        throw NoSuchElementException("No poll with ID $pollId found on Discord server with guild ID ${discordServer.guildId}")
    }

    fun listPollsToBeAnnounced(): List<DiscordPollUpdate> {
        return discordPollRepository.findPollsToBeAnnounced(Date()).map {
            DiscordPollUpdate(
                guildId = it.getGuildId(),
                pollId = it.getPollId(),
                channelId = it.getChannelId(),
                messageId = it.getMessageId(),
            )
        }
    }

    fun listPollResultUpdates(): List<DiscordPollUpdate> {
        return discordPollRepository.listPollResultUpdates(Date()).map {
            DiscordPollUpdate(
                guildId = it.getGuildId(),
                pollId = it.getPollId(),
                channelId = it.getChannelId(),
                messageId = it.getMessageId(),
            )
        }
    }

    fun augmentWithVoteaireData(discordPoll: DiscordPoll) {
        val proposalInfo = voteaireService.getProposalInfo(discordPoll.voteaireUUID!!)
        discordPoll.openAfter = proposalInfo.startDate
        discordPoll.openUntil = proposalInfo.endDate
        discordPoll.displayName = proposalInfo.title
        discordPoll.weighted = proposalInfo.ballotType is BallotTypePolicyId
        discordPoll.resultsVisible = true
        if (proposalInfo.questions.isNotEmpty()) {
            discordPoll.description = proposalInfo.questions[0].description + " "
            discordPoll.options = proposalInfo.questions[0].choices.map { DiscordPollOption(text = it.choice) }.toMutableSet()
            discordPoll.multipleVotes = proposalInfo.questions[0].choiceLimit > 1
        }
    }
}