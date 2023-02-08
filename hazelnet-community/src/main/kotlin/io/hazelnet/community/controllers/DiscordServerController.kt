package io.hazelnet.community.controllers

import io.hazelnet.community.data.EmbeddableSetting
import io.hazelnet.community.data.cardano.Stakepool
import io.hazelnet.community.data.cardano.TokenPolicy
import io.hazelnet.community.data.claim.PhysicalOrder
import io.hazelnet.community.data.discord.*
import io.hazelnet.community.data.discord.whitelists.Whitelist
import io.hazelnet.community.data.discord.whitelists.WhitelistPartial
import io.hazelnet.community.data.discord.whitelists.WhitelistSignup
import io.hazelnet.community.data.premium.IncomingDiscordPayment
import io.hazelnet.community.data.premium.IncomingDiscordPaymentRequest
import io.hazelnet.community.services.BillingService
import io.hazelnet.community.services.DiscordServerService
import io.hazelnet.community.services.IncomingPaymentService
import io.hazelnet.community.services.WhitelistService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/discord/servers")
class DiscordServerController(
        private val discordServerService: DiscordServerService,
        private val whitelistService: WhitelistService,
        private val billingService: BillingService,
        private val incomingPaymentService: IncomingPaymentService,
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

    @GetMapping(value = ["/{guildId}"], params = ["!byId"])
    @ResponseStatus(HttpStatus.OK)
    fun getDiscordServer(@PathVariable guildId: Long) = discordServerService.getDiscordServer(guildId)

    @GetMapping(value = ["/{serverId}"], params = ["byId"])
    @ResponseStatus(HttpStatus.OK)
    fun getDiscordServerByInternalId(@PathVariable serverId: Int) = discordServerService.getDiscordServerByInternalId(serverId)

    @PatchMapping("/{guildId}")
    @ResponseStatus(HttpStatus.OK)
    fun updateDiscordServer(@PathVariable guildId: Long, @RequestBody @Valid discordServerPartial: DiscordServerPartial) = discordServerService.updateDiscordServer(guildId, discordServerPartial)

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

    @GetMapping("/{guildId}/whitelists/{whitelistId}/signups/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun getWhitelistSignup(@PathVariable guildId: Long, @PathVariable whitelistId: Long, @PathVariable externalAccountId: Long) = whitelistService.getWhitelistSignup(guildId, whitelistId, externalAccountId)

    @DeleteMapping("/{guildId}/whitelists/{whitelistId}/signups/{externalAccountId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteWhitelistSignup(@PathVariable guildId: Long, @PathVariable whitelistId: Long, @PathVariable externalAccountId: Long) = whitelistService.deleteWhitelistSignup(guildId, whitelistId, externalAccountId)

    @PostMapping("/{guildId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    fun connectExternalAccount(@PathVariable guildId: Long, @RequestBody @Valid discordMember: DiscordMember) = discordServerService.addMember(guildId, discordMember)

    @GetMapping("/{guildId}/members/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun getExternalAccountOnDiscord(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.getMember(guildId, externalAccountId)

    @PatchMapping("/{guildId}/members/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun updateExternalAccountOnDiscord(@PathVariable guildId: Long, @PathVariable externalAccountId: Long, @RequestBody @Valid discordMemberPartial: DiscordMemberPartial) = discordServerService.updateMember(guildId, externalAccountId, discordMemberPartial)

    @DeleteMapping("/{guildId}/members/{externalAccountId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun disconnectExternalAccount(
        @PathVariable guildId: Long,
        @PathVariable externalAccountId: Long,
        @RequestParam(required = false, defaultValue = "false") skipRoleUpdates: Boolean,
    ) = discordServerService.removeMember(guildId, externalAccountId, skipRoleUpdates)

    @GetMapping("/{guildId}/members/{externalAccountId}/roleassignments/tokenroles")
    @ResponseStatus(HttpStatus.OK)
    fun getEligibleTokenRoles(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.getEligibleTokenRolesOfUser(guildId, externalAccountId)

    @GetMapping("/{guildId}/members/{externalAccountId}/roleassignments/delegatorroles")
    @ResponseStatus(HttpStatus.OK)
    fun getEligibleDelegatorRoles(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.getEligibleDelegatorRolesOfUser(guildId, externalAccountId)

    @PostMapping("/{guildId}/members/{externalAccountId}/roleassignments/tokenroles")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun queueTokenRoleAssignments(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.queueRoleAssignments(guildId, externalAccountId)

    @PostMapping("/{guildId}/members/{externalAccountId}/roleassignments/delegatorroles")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun queueDelegatorRoleAssignments(@PathVariable guildId: Long, @PathVariable externalAccountId: Long) = discordServerService.queueRoleAssignments(guildId, externalAccountId)

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
    fun updateSetting(@PathVariable guildId: Long, @PathVariable settingName: String, @RequestBody @Valid embeddableSetting: EmbeddableSetting): EmbeddableSetting {
        if (embeddableSetting.name != settingName) {
            throw IllegalArgumentException("Discord server setting name in path $settingName did not match setting in request body ${embeddableSetting.name}.")
        }
        return discordServerService.updateSettings(guildId, embeddableSetting)
    }

    @DeleteMapping("/{guildId}/settings/{settingName}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteSetting(@PathVariable guildId: Long, @PathVariable settingName: String) = discordServerService.deleteSettings(guildId, settingName)

    @GetMapping("/{guildId}/members")
    @ResponseStatus(HttpStatus.OK)
    fun getExternalAccounts(@PathVariable guildId: Long) = discordServerService.getMembers(guildId)

    @GetMapping("/{guildId}/roleassignments/delegatorroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentDelegatorRoleAssignments(@PathVariable guildId: Long) = discordServerService.getAllCurrentDelegatorRoleAssignmentsForGuild(guildId)

    @GetMapping("/{guildId}/roleassignments/tokenroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentTokenRoleAssignments(@PathVariable guildId: Long) = discordServerService.getAllCurrentTokenRoleAssignmentsForGuild(guildId)

    @GetMapping("/{guildId}/roleassignments/whitelistroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentWhitelistRoleAssignments(@PathVariable guildId: Long) = discordServerService.getAllCurrentWhitelistRoleAssignmentsForGuild(guildId)

    @GetMapping("/{guildId}/roleassignments/quizroles")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentQuizRoleAssignments(@PathVariable guildId: Long) = discordServerService.getAllCurrentQuizRoleAssignmentsForGuild(guildId)

    @PostMapping("/{guildId}/accesstoken")
    @ResponseStatus(HttpStatus.OK)
    fun regenerateAccessToken(@PathVariable guildId: Long) = discordServerService.regenerateAccessToken(guildId)

    @DeleteMapping("/{guildId}/accesstoken")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteAccessToken(@PathVariable guildId: Long) = discordServerService.deleteAccessToken(guildId)

    @GetMapping("/{guildId}/premium")
    @ResponseStatus(HttpStatus.OK)
    fun getPremiumInfo(@PathVariable guildId: Long) = billingService.getPremiumInfo(guildId)

    @GetMapping("/{guildId}/payment")
    @ResponseStatus(HttpStatus.OK)
    fun getCurrentPayment(@PathVariable guildId: Long) = incomingPaymentService.getCurrentPayment(guildId)

    @PostMapping("/{guildId}/payment")
    @ResponseStatus(HttpStatus.CREATED)
    fun requestIncomingPayment(@PathVariable guildId: Long, @RequestBody @Valid incomingDiscordPaymentRequest: IncomingDiscordPaymentRequest): ResponseEntity<IncomingDiscordPayment> {
        val newIncomingDiscordPayment = incomingPaymentService.requestIncomingPayment(guildId, incomingDiscordPaymentRequest)
        return ResponseEntity
            .created(ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{incomingDiscordPaymentId}")
                .buildAndExpand(newIncomingDiscordPayment.id)
                .toUri())
            .body(newIncomingDiscordPayment)
    }

    @DeleteMapping("/{guildId}/payment")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun cancelIncomingPayment(@PathVariable guildId: Long) = incomingPaymentService.cancelIncomingPayment(guildId)
}