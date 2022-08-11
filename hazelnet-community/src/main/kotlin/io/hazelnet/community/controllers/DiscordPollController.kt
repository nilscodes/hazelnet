package io.hazelnet.community.controllers

import io.hazelnet.community.data.discord.polls.DiscordPoll
import io.hazelnet.community.data.discord.polls.DiscordPollPartial
import io.hazelnet.community.services.DiscordPollService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping(("/discord"))
class DiscordPollController(
    private val discordPollService: DiscordPollService
) {

    @GetMapping("/servers/{guildId}/polls")
    @ResponseStatus(HttpStatus.OK)
    fun listPolls(@PathVariable guildId: Long) = discordPollService.listPolls(guildId)

    @PostMapping("/servers/{guildId}/polls")
    @ResponseStatus(HttpStatus.CREATED)
    fun addPoll(@PathVariable guildId: Long, @RequestBody @Valid discordPoll: DiscordPoll): ResponseEntity<DiscordPoll> {
        val newPoll = discordPollService.addPoll(guildId, discordPoll)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{pollId}")
                .buildAndExpand(newPoll.id)
                .toUri())
            .body(newPoll)
    }

    @GetMapping("/servers/{guildId}/polls/{pollId}")
    @ResponseStatus(HttpStatus.OK)
    fun getPoll(@PathVariable guildId: Long, @PathVariable pollId: Int) = discordPollService.getPoll(guildId, pollId)

    @PatchMapping("/servers/{guildId}/polls/{pollId}")
    @ResponseStatus(HttpStatus.OK)
    fun updatePoll(@PathVariable guildId: Long, @PathVariable pollId: Int, @RequestBody @Valid discordPollPartial: DiscordPollPartial) = discordPollService.updatePoll(guildId, pollId, discordPollPartial)

    @DeleteMapping("/servers/{guildId}/polls/{pollId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deletePoll(@PathVariable guildId: Long, @PathVariable pollId: Int) = discordPollService.deletePoll(guildId, pollId)

    @GetMapping("/servers/{guildId}/polls/{pollId}/votes")
    @ResponseStatus(HttpStatus.OK)
    fun getVotesInPoll(@PathVariable guildId: Long, @PathVariable pollId: Int) = discordPollService.getVotesInPoll(guildId, pollId)

    @GetMapping("/servers/{guildId}/polls/{pollId}/votes/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun getVoteOfUser(@PathVariable guildId: Long, @PathVariable pollId: Int, @PathVariable externalAccountId: Long) = discordPollService.getVoteOfUser(guildId, pollId, externalAccountId)

    @PostMapping("/servers/{guildId}/polls/{pollId}/votes/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun setVoteForUser(@PathVariable guildId: Long, @PathVariable pollId: Int, @PathVariable externalAccountId: Long, @RequestBody options: List<Long>) = discordPollService.setVoteForUser(guildId, pollId, externalAccountId, options)

    @GetMapping("/polls/announcements")
    @ResponseStatus(HttpStatus.OK)
    fun listPollsToBeAnnounced() = discordPollService.listPollsToBeAnnounced()

    @GetMapping("/polls/resultupdates")
    @ResponseStatus(HttpStatus.OK)
    fun listPollResultUpdates() = discordPollService.listPollResultUpdates()
}