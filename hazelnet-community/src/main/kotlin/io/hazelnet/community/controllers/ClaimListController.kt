package io.hazelnet.community.controllers

import io.hazelnet.community.data.claim.ClaimList
import io.hazelnet.community.data.claim.PhysicalOrder
import io.hazelnet.community.services.ClaimListService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/claimlists")
class ClaimListController(
    private val claimListService: ClaimListService
) {
    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun addClaimList(@RequestBody @Valid claimList: ClaimList): ResponseEntity<ClaimList> {
        val newClaimList = claimListService.addClaimList(claimList)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{claimListId}")
                    .buildAndExpand(newClaimList.id)
                    .toUri())
            .body(newClaimList)
    }

    @GetMapping("/{claimListId}")
    @ResponseStatus(HttpStatus.OK)
    fun getClaimList(@PathVariable claimListId: Int) = claimListService.getClaimList(claimListId)

    @PostMapping("/{claimListId}/orders/physical")
    @ResponseStatus(HttpStatus.CREATED)
    fun addPhysicalOrder(@PathVariable claimListId: Int, @RequestBody @Valid physicalOrder: PhysicalOrder): ResponseEntity<PhysicalOrder> {
        val newOrder = claimListService.addAndVerifyPhysicalOrder(claimListId, physicalOrder)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{claimListId}/orders/physical/{orderId}")
                    .buildAndExpand(claimListId, newOrder.id)
                    .toUri())
            .body(newOrder)
    }

    @GetMapping("/{claimListId}/orders/physical")
    @ResponseStatus(HttpStatus.OK)
    fun getPhysicalOrder(@PathVariable claimListId: Int) = claimListService.getPhysicalOrders(claimListId)

    @GetMapping("/{claimListId}/orders/physical/{orderId}")
    @ResponseStatus(HttpStatus.OK)
    fun getPhysicalOrder(@PathVariable claimListId: Int, @PathVariable orderId: Int) = claimListService.getPhysicalOrder(claimListId, orderId)


}