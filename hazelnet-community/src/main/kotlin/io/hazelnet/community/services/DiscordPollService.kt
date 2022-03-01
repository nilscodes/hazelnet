package io.hazelnet.community.services

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.polls.DiscordPoll
import io.hazelnet.community.persistence.DiscordPollRepository
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*

@Service
class DiscordPollService(
    private val discordPollRepository: DiscordPollRepository,
    private val discordServerService: DiscordServerService,
    private val externalAccountService: ExternalAccountService
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

    fun setVote(guildId: Long, pollId: Int, externalAccountId: Long, options: List<Long>): Set<Long> {
        val discordServer = discordServerService.getDiscordServer(guildId)
        val voter = externalAccountService.getExternalAccount(externalAccountId)
        val poll = getPoll(discordServer, pollId)
        if (poll != null) {
            val optionsToVoteFor = options.toSet()
            // SNAPSHOT data to retrieve if applicable
            // Calculate total weight
            // Validate options exist
            // Validate multi-options is enabled if multiple are submitted
            // Remove existing votes for external account
            // set total available weight equally between votes if weighted vote
            // Add votes for external account to all options
            //poll.
            return optionsToVoteFor
        }
        throw NoSuchElementException("No poll with ID $pollId found on Discord server with guild ID $guildId")
    }

    private fun getPoll(discordServer: DiscordServer, pollId: Int) = discordPollRepository.findByDiscordServerId(discordServer.id!!).find { pollId == it.id }
}