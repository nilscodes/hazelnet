package io.hazelnet.community.controllers

import io.hazelnet.community.data.discord.whitelists.Whitelist
import io.hazelnet.community.data.discord.whitelists.WhitelistPartial
import io.hazelnet.community.data.discord.whitelists.WhitelistSignup
import io.hazelnet.community.services.DiscordServerService
import io.hazelnet.community.services.WhitelistService
import io.hazelnet.shared.data.NewWhitelistAutojoinDto
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/discord/servers")
class DiscordServerWhitelistController(
        private val discordServerService: DiscordServerService,
        private val whitelistService: WhitelistService,
) {

    @GetMapping("/{guildId}/whitelists")
    @ResponseStatus(HttpStatus.OK)
    fun listWhitelists(@PathVariable guildId: Long) = discordServerService.getWhitelists(guildId)

    @PostMapping("/{guildId}/whitelists")
    @ResponseStatus(HttpStatus.CREATED)
    fun addWhitelist(@PathVariable guildId: Long, @RequestBody @Valid whitelist: Whitelist): ResponseEntity<Whitelist> {
        val newWhitelist = whitelistService.addWhitelist(guildId, whitelist)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{whitelistId}")
                        .buildAndExpand(newWhitelist.id)
                        .toUri())
                .body(newWhitelist)
    }

    @PatchMapping("/{guildId}/whitelists/{whitelistId}")
    @ResponseStatus(HttpStatus.OK)
    fun updateWhitelist(@PathVariable guildId: Long, @PathVariable whitelistId: Long, @RequestBody @Valid whitelistPartial: WhitelistPartial) = whitelistService.updateWhitelist(guildId, whitelistId, whitelistPartial)

    @DeleteMapping("/{guildId}/whitelists/{whitelistId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteWhitelist(@PathVariable guildId: Long, @PathVariable whitelistId: Long) = whitelistService.deleteWhitelist(guildId, whitelistId)

    @GetMapping("/{guildId}/whitelists/shared")
    @ResponseStatus(HttpStatus.OK)
    fun getSharedWhitelists(@PathVariable guildId: Long, @RequestParam(required = false, defaultValue = "false") withSignups: Boolean) = whitelistService.getSharedWhitelists(guildId, withSignups)

    @GetMapping("/{guildId}/whitelists/{whitelistIdOrName}/signups")
    @ResponseStatus(HttpStatus.OK)
    fun getWhitelistSignups(@PathVariable guildId: Long, @PathVariable whitelistIdOrName: String) = whitelistService.getWhitelistSignups(guildId, whitelistIdOrName)

    @PostMapping("/{guildId}/whitelists/{whitelistId}/signups")
    @ResponseStatus(HttpStatus.CREATED)
    fun addWhitelistSignup(@PathVariable guildId: Long, @PathVariable whitelistId: Long, @RequestBody @Valid whitelistSignup: WhitelistSignup): ResponseEntity<WhitelistSignup> {
        val newWhitelistSignup = whitelistService.addWhitelistSignup(guildId, whitelistId, whitelistSignup)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{externalAccountId}")
                        .buildAndExpand(newWhitelistSignup.externalAccountId)
                        .toUri())
                .body(newWhitelistSignup)
    }

    @PostMapping("/{guildId}/whitelists/{whitelistIdOrName}/autojoin")
    @ResponseStatus(HttpStatus.OK)
    fun addWhitelistAutojoin(@PathVariable guildId: Long, @PathVariable whitelistIdOrName: String, @RequestBody @Valid autojoin: NewWhitelistAutojoinDto)
        = whitelistService.addWhitelistAutojoin(guildId, whitelistIdOrName, autojoin)

    @GetMapping("/{guildId}/whitelists/{whitelistId}/signups/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun getWhitelistSignup(@PathVariable guildId: Long, @PathVariable whitelistId: Long, @PathVariable externalAccountId: Long) = whitelistService.getWhitelistSignup(guildId, whitelistId, externalAccountId)

    @DeleteMapping("/{guildId}/whitelists/{whitelistId}/signups/{externalAccountId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteWhitelistSignup(@PathVariable guildId: Long, @PathVariable whitelistId: Long, @PathVariable externalAccountId: Long) = whitelistService.deleteWhitelistSignup(guildId, whitelistId, externalAccountId)

    @GetMapping("/{guildId}/roleassignments/whitelistroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentWhitelistRoleAssignments(@PathVariable guildId: Long) = discordServerService.getAllCurrentWhitelistRoleAssignmentsForGuild(guildId)
}