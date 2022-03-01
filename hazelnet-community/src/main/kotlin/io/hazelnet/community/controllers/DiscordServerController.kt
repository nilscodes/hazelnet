package io.hazelnet.community.controllers

import io.hazelnet.community.data.discord.DiscordServerSetting
import io.hazelnet.community.data.cardano.Stakepool
import io.hazelnet.community.data.cardano.TokenPolicy
import io.hazelnet.community.data.claim.PhysicalOrder
import io.hazelnet.community.data.discord.*
import io.hazelnet.community.services.DiscordServerService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping(("/discord/servers"))
class DiscordServerController(
        private val discordServerService: DiscordServerService
) {
    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun addDiscordServer(@RequestBody @Valid discordServer: DiscordServer): ResponseEntity<DiscordServer> {
        val newDiscordServer = discordServerService.addDiscordServer(discordServer)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{guildId}")
                        .buildAndExpand(newDiscordServer.guildId)
                        .toUri())
                .body(newDiscordServer)
    }

    @GetMapping("")
    @ResponseStatus(HttpStatus.OK)
    fun listDiscordServers() = discordServerService.getDiscordServers()

    @GetMapping("/{guildId}")
    @ResponseStatus(HttpStatus.OK)
    fun getDiscordServer(@PathVariable guildId: Long) = discordServerService.getDiscordServer(guildId)

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

    @DeleteMapping("/{guildId}/tokenroles/{tokenRoleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteTokenOwnershipRole(@PathVariable guildId: Long, @PathVariable tokenRoleId: Long) = discordServerService.deleteTokenOwnershipRole(guildId, tokenRoleId)

    @PostMapping("/{guildId}/whitelists")
    @ResponseStatus(HttpStatus.CREATED)
    fun addWhitelist(@PathVariable guildId: Long, @RequestBody @Valid whitelist: Whitelist): ResponseEntity<Whitelist> {
        val newWhitelist = discordServerService.addWhitelist(guildId, whitelist)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{whitelistId}")
                        .buildAndExpand(newWhitelist.id)
                        .toUri())
                .body(newWhitelist)
    }

    @DeleteMapping("/{guildId}/whitelists/{whitelistId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteWhitelist(@PathVariable guildId: Long, @PathVariable whitelistId: Long) = discordServerService.deleteWhitelist(guildId, whitelistId)

    @GetMapping("/{guildId}/whitelists/{whitelistIdOrName}/signups")
    @ResponseStatus(HttpStatus.OK)
    fun getWhitelistSignups(@PathVariable guildId: Long, @PathVariable whitelistIdOrName: String) = discordServerService.getWhitelistSignups(guildId, whitelistIdOrName)

    @PostMapping("/{guildId}/whitelists/{whitelistId}/signups")
    @ResponseStatus(HttpStatus.CREATED)
    fun addWhitelistSignup(@PathVariable guildId: Long, @PathVariable whitelistId: Long, @RequestBody @Valid whitelistSignup: WhitelistSignup): ResponseEntity<WhitelistSignup> {
        val newWhitelistSignup = discordServerService.addWhitelistSignup(guildId, whitelistId, whitelistSignup)
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{externalAccountId}")
                        .buildAndExpand(newWhitelistSignup.externalAccountId)
                        .toUri())
                .body(newWhitelistSignup)
    }

    @GetMapping("/{guildId}/whitelists/{whitelistId}/signups/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun getWhitelistSignup(@PathVariable guildId: Long, @PathVariable whitelistId: Long, @PathVariable externalAccountId: Long) = discordServerService.getWhitelistSignup(guildId, whitelistId, externalAccountId)

    @DeleteMapping("/{guildId}/whitelists/{whitelistId}/signups/{externalAccountId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteWhitelistSignup(@PathVariable guildId: Long, @PathVariable whitelistId: Long, @PathVariable externalAccountId: Long) = discordServerService.deleteWhitelistSignup(guildId, whitelistId, externalAccountId)

    @PostMapping("/{guildId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    fun connectExternalAccount(@PathVariable guildId: Long, @RequestBody @Valid discordMember: DiscordMember) = discordServerService.addMember(guildId, discordMember)

    @DeleteMapping("/{guildId}/members/{externalAccountId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun disconnectExternalAccount(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.removeMember(guildId, externalAccountId)

    @GetMapping("/{guildId}/members/{externalAccountId}/claimlists")
    @ResponseStatus(HttpStatus.OK)
    fun getEligibleClaimListsOfUser(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.getEligibleClaimListsOfUser(guildId, externalAccountId)

    @GetMapping("/{guildId}/members/{externalAccountId}/claimlists/{claimListId}/orders")
    @ResponseStatus(HttpStatus.OK)
    fun getOrderOfUserForClaimList(@PathVariable guildId: Long, @PathVariable externalAccountId: Long, @PathVariable claimListId: Int) = discordServerService.getOrderOfUserForClaimList(guildId, externalAccountId, claimListId)

    @PostMapping("/{guildId}/members/{externalAccountId}/claimlists/{claimListId}/orders")
    @ResponseStatus(HttpStatus.OK)
    fun setOrderOfUserForClaimList(@PathVariable guildId: Long, @PathVariable externalAccountId: Long, @PathVariable claimListId: Int, @RequestBody @Valid physicalOrder: PhysicalOrder) = discordServerService.setOrderOfUserForClaimList(guildId, externalAccountId, claimListId, physicalOrder)

    @GetMapping("/{guildId}/claimlists/{claimListIdOrName}/orders")
    @ResponseStatus(HttpStatus.OK)
    fun getAllOrdersForClaimList(@PathVariable guildId: Long, @PathVariable claimListIdOrName: String) = discordServerService.getAllOrdersForClaimList(guildId, claimListIdOrName)

    @GetMapping("/{guildId}/claimlists/{claimListIdOrName}/products")
    @ResponseStatus(HttpStatus.OK)
    fun getAllProductsForClaimList(@PathVariable guildId: Long, @PathVariable claimListIdOrName: String) = discordServerService.getAllProductsForClaimList(guildId, claimListIdOrName)

    @PutMapping("/{guildId}/settings/{settingName}")
    @ResponseStatus(HttpStatus.OK)
    fun updateSetting(@PathVariable guildId: Long, @PathVariable settingName: String, @RequestBody @Valid discordServerSetting: DiscordServerSetting): DiscordServerSetting {
        if (discordServerSetting.name != settingName) {
            throw IllegalArgumentException("Discord server setting name in path $settingName did not match setting in request body ${discordServerSetting.name}.")
        }
        return discordServerService.updateSettings(guildId, discordServerSetting)
    }

    @DeleteMapping("/{guildId}/settings/{settingName}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteSetting(@PathVariable guildId: Long, @PathVariable settingName: String) = discordServerService.deleteSettings(guildId, settingName)

    @GetMapping("/{guildId}/members")
    @ResponseStatus(HttpStatus.OK)
    fun getExternalAccounts(@PathVariable guildId: Long) = discordServerService.getMembers(guildId)

    @GetMapping("/{guildId}/roleassignments/delegatorroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentDelegatorRoleAssignments(@PathVariable guildId: Long) = discordServerService.getCurrentDelegatorRoleAssignments(guildId)

    @GetMapping("/{guildId}/roleassignments/tokenroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentTokenRoleAssignments(@PathVariable guildId: Long) = discordServerService.getCurrentTokenRolesAssignments(guildId)

    @PostMapping("/{guildId}/accesstoken")
    @ResponseStatus(HttpStatus.OK)
    fun regenerateAccessToken(@PathVariable guildId: Long) = discordServerService.regenerateAccessToken(guildId)

    @DeleteMapping("/{guildId}/accesstoken")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteAccessToken(@PathVariable guildId: Long) = discordServerService.deleteAccessToken(guildId)

    @GetMapping("/{guildId}/botfunding")
    @ResponseStatus(HttpStatus.OK)
    fun getBotFunding(@PathVariable guildId: Long) = discordServerService.getBotFunding(guildId)
}