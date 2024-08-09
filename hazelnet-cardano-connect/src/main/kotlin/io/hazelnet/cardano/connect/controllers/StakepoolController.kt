package io.hazelnet.cardano.connect.controllers

import io.hazelnet.cardano.connect.services.StakepoolService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/stakepools")
class StakepoolController(
        private val stakepoolService: StakepoolService
) {
    @GetMapping("")
    @ResponseStatus(HttpStatus.OK)
    fun listStakepools(@RequestParam(required = false) poolView: String?, @RequestParam(required = false) poolHash: String?) = stakepoolService.listStakepools(poolView, poolHash)

    @GetMapping("/{poolHash}/delegation")
    @ResponseStatus(HttpStatus.OK)
    fun getActiveDelegation(
        @PathVariable poolHash: String,
        @RequestParam(required = false, defaultValue = "false") withoutAmount: Boolean,
    ) = stakepoolService.getActiveDelegation(poolHash, withoutAmount)

    @GetMapping("/{poolHash}/delegation/{epochNo}")
    @ResponseStatus(HttpStatus.OK)
    fun getDelegationInEpoch(@PathVariable poolHash: String, @PathVariable epochNo: Int) = stakepoolService.getDelegationInEpoch(poolHash, epochNo)
}