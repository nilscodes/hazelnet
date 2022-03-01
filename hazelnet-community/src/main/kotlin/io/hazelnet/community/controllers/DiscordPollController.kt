package io.hazelnet.community.controllers

import io.hazelnet.community.data.discord.polls.DiscordPoll
import io.hazelnet.community.services.DiscordPollService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

@RestController
@RequestMapping(("/discord/servers"))
class DiscordPollController(
    private val discordPollService: DiscordPollService
) {

    @GetMapping("/{guildId}/polls")
    @ResponseStatus(HttpStatus.OK)
    fun listPolls(@PathVariable guildId: Long) = discordPollService.listPolls(guildId)

    @PostMapping("/{guildId}/polls")
    @ResponseStatus(HttpStatus.CREATED)
    fun addPoll(@PathVariable guildId: Long, @RequestBody @Valid discordPoll: DiscordPoll) = discordPollService.addPoll(guildId, discordPoll)



    @PutMapping("/{guildId}/polls/{pollId}/votes/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun setVote(@PathVariable guildId: Long, @PathVariable pollId: Int, @PathVariable externalAccountId: Long, @RequestBody options: List<Long>) = discordPollService.setVote(guildId, pollId, externalAccountId, options)
}