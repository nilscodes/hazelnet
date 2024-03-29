package io.hazelnet.external.controllers

import io.hazelnet.external.data.claim.AnonymousPhysicalOrder
import io.hazelnet.external.data.claim.PhysicalProduct
import io.hazelnet.external.security.getGuildId
import io.hazelnet.external.services.ClaimListService
import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/community/claimlists")
class ClaimListController(
        private val claimListService: ClaimListService
) {
    @GetMapping("/{claimListName}/orders")
    @ResponseStatus(HttpStatus.OK)
    fun getClaimListOrders(@PathVariable claimListName: String, authentication: BearerTokenAuthentication): List<AnonymousPhysicalOrder> {
        val guildId = authentication.getGuildId()
        return claimListService.getClaimListOrders(guildId, claimListName)
    }

    @GetMapping("/{claimListName}/products")
    @ResponseStatus(HttpStatus.OK)
    fun getClaimListProducts(@PathVariable claimListName: String, authentication: BearerTokenAuthentication): List<PhysicalProduct> {
        val guildId = authentication.getGuildId()
        return claimListService.getClaimListProducts(guildId, claimListName)
    }

}