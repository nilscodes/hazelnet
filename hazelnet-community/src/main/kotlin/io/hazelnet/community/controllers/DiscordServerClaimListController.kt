package io.hazelnet.community.controllers

import io.hazelnet.community.data.claim.PhysicalOrder
import io.hazelnet.community.services.DiscordServerService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

@RestController
@RequestMapping("/discord/servers")
class DiscordServerClaimListController(
        private val discordServerService: DiscordServerService,
) {

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

}