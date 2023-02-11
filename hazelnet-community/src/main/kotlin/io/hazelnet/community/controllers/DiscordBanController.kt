package io.hazelnet.community.controllers

import io.hazelnet.community.data.discord.DiscordBan
import io.hazelnet.community.services.DiscordBanService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/discord/servers")
class DiscordBanController(
    private val discordBanService: DiscordBanService,
) {
    @GetMapping("/{guildId}/bans")
    @ResponseStatus(HttpStatus.OK)
    fun listBans(@PathVariable guildId: Long) = discordBanService.listBans(guildId)

    @PostMapping("/{guildId}/bans")
    @ResponseStatus(HttpStatus.CREATED)
    fun addBan(@PathVariable guildId: Long, @RequestBody @Valid discordBan: DiscordBan): ResponseEntity<DiscordBan> {
        val newBan = discordBanService.addBan(guildId, discordBan)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{banId}")
                    .buildAndExpand(newBan.id)
                    .toUri()
            )
            .body(newBan)
    }

    @GetMapping("/{guildId}/bans/{banId}")
    @ResponseStatus(HttpStatus.OK)
    fun getBan(@PathVariable guildId: Long, @PathVariable banId: Int) = discordBanService.getBan(guildId, banId)

    @DeleteMapping("/{guildId}/bans/{banId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteBan(@PathVariable guildId: Long, @PathVariable banId: Int) = discordBanService.deleteBan(guildId, banId)

}