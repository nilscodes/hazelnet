package io.hazelnet.community.controllers

import io.hazelnet.community.data.cardano.TokenPolicy
import io.hazelnet.community.data.discord.TokenOwnershipRole
import io.hazelnet.community.data.discord.TokenOwnershipRolePartial
import io.hazelnet.community.data.discord.TokenRoleMetadataFilter
import io.hazelnet.community.services.DiscordServerService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/discord/servers")
class DiscordServerTokenController(
        private val discordServerService: DiscordServerService,
) {

    @GetMapping("/{guildId}/tokenpolicies")
    @ResponseStatus(HttpStatus.OK)
    fun listTokenPolicies(@PathVariable guildId: Long) = discordServerService.getTokenPolicies(guildId)

    @PostMapping("/{guildId}/tokenpolicies")
    @ResponseStatus(HttpStatus.CREATED)
    fun addTokenPolicy(@PathVariable guildId: Long, @RequestBody @Valid tokenPolicy: TokenPolicy): ResponseEntity<TokenPolicy> {
        val newTokenPolicy = discordServerService.addTokenPolicy(guildId, tokenPolicy)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{policyId}")
                        .buildAndExpand(newTokenPolicy.policyId)
                        .toUri())
                .body(newTokenPolicy)
    }

    @DeleteMapping("/{guildId}/tokenpolicies/{policyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteTokenPolicy(@PathVariable guildId: Long, @PathVariable policyId: String) = discordServerService.deleteTokenPolicy(guildId, policyId)

    @GetMapping("/{guildId}/tokenroles")
    @ResponseStatus(HttpStatus.OK)
    fun listTokenOwnershipRoles(@PathVariable guildId: Long) = discordServerService.getTokenRoles(guildId)

    @PostMapping("/{guildId}/tokenroles")
    @ResponseStatus(HttpStatus.CREATED)
    fun addTokenOwnershipRole(@PathVariable guildId: Long, @RequestBody @Valid tokenOwnershipRole: TokenOwnershipRole): ResponseEntity<TokenOwnershipRole> {
        val newTokenOwnershipRole = discordServerService.addTokenOwnershipRole(guildId, tokenOwnershipRole)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{tokenRoleId}")
                        .buildAndExpand(newTokenOwnershipRole.id)
                        .toUri())
                .body(newTokenOwnershipRole)
    }

    @PatchMapping("/{guildId}/tokenroles/{tokenRoleId}")
    @ResponseStatus(HttpStatus.OK)
    fun updateTokenOwnershipRole(@PathVariable guildId: Long, @PathVariable tokenRoleId: Long, @RequestBody @Valid tokenOwnershipRolePartial: TokenOwnershipRolePartial) = discordServerService.updateTokenOwnershipRole(guildId, tokenRoleId, tokenOwnershipRolePartial)

    @DeleteMapping("/{guildId}/tokenroles/{tokenRoleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteTokenOwnershipRole(@PathVariable guildId: Long, @PathVariable tokenRoleId: Long) = discordServerService.deleteTokenOwnershipRole(guildId, tokenRoleId)

    @PostMapping("/{guildId}/tokenroles/{tokenRoleId}/metadatafilters")
    @ResponseStatus(HttpStatus.CREATED)
    fun addMetadataFilterToTokenRole(@PathVariable guildId: Long, @PathVariable tokenRoleId: Long, @RequestBody @Valid tokenRoleMetadataFilter: TokenRoleMetadataFilter): ResponseEntity<TokenRoleMetadataFilter> {
        val newMetadataFilter = discordServerService.addMetadataFilterToTokenRole(guildId, tokenRoleId, tokenRoleMetadataFilter)
        return ResponseEntity
            .created(ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{filterId}")
                .buildAndExpand(newMetadataFilter.id)
                .toUri())
            .body(newMetadataFilter)
    }

    @DeleteMapping("/{guildId}/tokenroles/{tokenRoleId}/metadatafilters/{filterId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteMetadataFilterFromTokenRole(@PathVariable guildId: Long, @PathVariable tokenRoleId: Long, @PathVariable filterId: Long) = discordServerService.deleteMetadataFilterFromTokenRole(guildId, tokenRoleId, filterId)

    @GetMapping("/{guildId}/members/{externalAccountId}/roleassignments/tokenroles")
    @ResponseStatus(HttpStatus.OK)
    fun getEligibleTokenRoles(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.getEligibleTokenRolesOfUser(guildId, externalAccountId)

    @PostMapping("/{guildId}/members/{externalAccountId}/roleassignments/tokenroles")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun queueTokenRoleAssignments(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.queueRoleAssignments(guildId, externalAccountId)

    @GetMapping("/{guildId}/roleassignments/tokenroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentTokenRoleAssignments(@PathVariable guildId: Long) = discordServerService.getAllCurrentTokenRoleAssignmentsForGuild(guildId)


}