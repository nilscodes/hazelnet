package io.hazelnet.community.controllers

import io.hazelnet.community.data.cardano.Stakepool
import io.hazelnet.community.data.discord.DelegatorRole
import io.hazelnet.community.services.DiscordServerService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/discord/servers")
class DiscordServerStakepoolController(
        private val discordServerService: DiscordServerService,
) {

    @GetMapping("/{guildId}/stakepools")
    @ResponseStatus(HttpStatus.OK)
    fun listStakepools(@PathVariable guildId: Long) = discordServerService.getStakepools(guildId)

    @PostMapping("/{guildId}/stakepools")
    @ResponseStatus(HttpStatus.CREATED)
    fun addStakepool(@PathVariable guildId: Long, @RequestBody @Valid stakepool: Stakepool): ResponseEntity<Stakepool> {
        val newStakepool = discordServerService.addStakepool(guildId, stakepool)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{poolHash}")
                        .buildAndExpand(newStakepool.poolHash)
                        .toUri())
                .body(newStakepool)
    }

    @DeleteMapping("/{guildId}/stakepools/{poolHash}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteStakepool(@PathVariable guildId: Long, @PathVariable poolHash: String) = discordServerService.deleteStakepool(guildId, poolHash)

    @GetMapping("/{guildId}/delegatorroles")
    @ResponseStatus(HttpStatus.OK)
    fun listDelegatorRoles(@PathVariable guildId: Long) = discordServerService.getDelegatorRoles(guildId)

    @PostMapping("/{guildId}/delegatorroles")
    @ResponseStatus(HttpStatus.CREATED)
    fun addDelegatorRole(@PathVariable guildId: Long, @RequestBody @Valid delegatorRole: DelegatorRole): ResponseEntity<DelegatorRole> {
        val newDelegatorRole = discordServerService.addDelegatorRole(guildId, delegatorRole)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{delegatorRoleId}")
                        .buildAndExpand(newDelegatorRole.id)
                        .toUri())
                .body(newDelegatorRole)
    }

    @DeleteMapping("/{guildId}/delegatorroles/{delegatorRoleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteDelegatorRole(@PathVariable guildId: Long, @PathVariable delegatorRoleId: Long) = discordServerService.deleteDelegatorRole(guildId, delegatorRoleId)

    @GetMapping("/{guildId}/members/{externalAccountId}/roleassignments/delegatorroles")
    @ResponseStatus(HttpStatus.OK)
    fun getEligibleDelegatorRoles(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.getEligibleDelegatorRolesOfUser(guildId, externalAccountId)

    @PostMapping("/{guildId}/members/{externalAccountId}/roleassignments/delegatorroles")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun queueDelegatorRoleAssignments(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.queueRoleAssignments(guildId, externalAccountId)

    @GetMapping("/{guildId}/roleassignments/delegatorroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentDelegatorRoleAssignments(@PathVariable guildId: Long) = discordServerService.getAllCurrentDelegatorRoleAssignmentsForGuild(guildId)

}