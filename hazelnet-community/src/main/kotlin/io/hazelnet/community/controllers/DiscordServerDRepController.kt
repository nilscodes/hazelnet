package io.hazelnet.community.controllers

import io.hazelnet.community.data.cardano.DRep
import io.hazelnet.community.data.discord.DRepDelegatorRole
import io.hazelnet.community.services.DiscordServerDRepService
import io.hazelnet.community.services.DiscordServerService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/discord/servers")
class DiscordServerDRepController(
    private val discordServerService: DiscordServerService,
    private val discordServerDRepService: DiscordServerDRepService,
) {

    @GetMapping("/{guildId}/dreps")
    @ResponseStatus(HttpStatus.OK)
    fun listDReps(@PathVariable guildId: Long) = discordServerDRepService.getDReps(guildId)

    @PostMapping("/{guildId}/dreps")
    @ResponseStatus(HttpStatus.CREATED)
    fun addDRep(@PathVariable guildId: Long, @RequestBody @Valid drep: DRep): ResponseEntity<DRep> {
        val newDRep = discordServerDRepService.addDRep(guildId, drep)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{dRepHash}")
                        .buildAndExpand(newDRep.dRepHash)
                        .toUri())
                .body(newDRep)
    }

    @DeleteMapping("/{guildId}/dreps/{dRepHash}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteDRep(@PathVariable guildId: Long, @PathVariable dRepHash: String) = discordServerDRepService.deleteDRep(guildId, dRepHash)

    @GetMapping("/{guildId}/drepdelegatorroles")
    @ResponseStatus(HttpStatus.OK)
    fun listDRepDelegatorRoles(@PathVariable guildId: Long) = discordServerDRepService.getDRepDelegatorRoles(guildId)

    @PostMapping("/{guildId}/drepdelegatorroles")
    @ResponseStatus(HttpStatus.CREATED)
    fun addDRepDelegatorRole(@PathVariable guildId: Long, @RequestBody @Valid dRepDelegatorRole: DRepDelegatorRole): ResponseEntity<DRepDelegatorRole> {
        val newDRepDelegatorRole = discordServerDRepService.addDRepDelegatorRole(guildId, dRepDelegatorRole)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{dRepDelegatorRoleId}")
                        .buildAndExpand(newDRepDelegatorRole.id)
                        .toUri())
                .body(newDRepDelegatorRole)
    }

    @DeleteMapping("/{guildId}/drepdelegatorroles/{dRepDelegatorRoleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteDRepDelegatorRole(@PathVariable guildId: Long, @PathVariable dRepDelegatorRoleId: Long) = discordServerDRepService.deleteDRepDelegatorRole(guildId, dRepDelegatorRoleId)

    @GetMapping("/{guildId}/members/{externalAccountId}/roleassignments/drepdelegatorroles")
    @ResponseStatus(HttpStatus.OK)
    fun getEligibleDRepDelegatorRoles(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerDRepService.getEligibleDRepDelegatorRolesOfUser(guildId, externalAccountId)

    @PostMapping("/{guildId}/members/{externalAccountId}/roleassignments/drepdelegatorroles")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun queueDRepDelegatorRoleAssignments(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.queueRoleAssignments(guildId, externalAccountId)

    @GetMapping("/{guildId}/roleassignments/drepdelegatorroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentDRepDelegatorRoleAssignments(@PathVariable guildId: Long) = discordServerDRepService.getAllCurrentDRepDelegatorRoleAssignmentsForGuild(guildId)

}