package io.hazelnet.community.controllers

import io.hazelnet.community.data.discord.giveaways.DiscordGiveaway
import io.hazelnet.community.data.discord.giveaways.DiscordGiveawayPartial
import io.hazelnet.community.services.DiscordGiveawayService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping(("/discord"))
class DiscordGiveawayController(
    private val discordGiveawayService: DiscordGiveawayService
) {

    @GetMapping("/servers/{guildId}/giveaways")
    @ResponseStatus(HttpStatus.OK)
    fun listGiveaways(@PathVariable guildId: Long) = discordGiveawayService.listGiveaways(guildId)

    @PostMapping("/servers/{guildId}/giveaways")
    @ResponseStatus(HttpStatus.CREATED)
    fun addGiveaway(@PathVariable guildId: Long, @RequestBody @Valid discordGiveaway: DiscordGiveaway): ResponseEntity<DiscordGiveaway> {
        val newGiveaway = discordGiveawayService.addGiveaway(guildId, discordGiveaway)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{giveawayId}")
                .buildAndExpand(newGiveaway.id)
                .toUri())
            .body(newGiveaway)
    }

    @GetMapping("/servers/{guildId}/giveaways/{giveawayId}")
    @ResponseStatus(HttpStatus.OK)
    fun getGiveaway(@PathVariable guildId: Long, @PathVariable giveawayId: Int) = discordGiveawayService.getGiveaway(guildId, giveawayId)

    @PatchMapping("/servers/{guildId}/giveaways/{giveawayId}")
    @ResponseStatus(HttpStatus.OK)
    fun updateGiveaway(@PathVariable guildId: Long, @PathVariable giveawayId: Int, @RequestBody @Valid discordGiveawayPartial: DiscordGiveawayPartial) = discordGiveawayService.updateGiveaway(guildId, giveawayId, discordGiveawayPartial)

    @DeleteMapping("/servers/{guildId}/giveaways/{giveawayId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteGiveaway(@PathVariable guildId: Long, @PathVariable giveawayId: Int) = discordGiveawayService.deleteGiveaway(guildId, giveawayId)


}