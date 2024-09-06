package io.hazelnet.cardano.connect.controllers

import io.hazelnet.cardano.connect.services.DRepService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/dreps")
class DRepsController(
        private val dRepService: DRepService,
) {
    @GetMapping("")
    @ResponseStatus(HttpStatus.OK)
    fun listDReps(@RequestParam(required = false) dRepView: String?, @RequestParam(required = false) dRepHash: String?) = dRepService.listDReps(dRepView, dRepHash)

    @GetMapping("/{dRepHash}/delegation")
    @ResponseStatus(HttpStatus.OK)
    fun getActiveDRepDelegation(
        @PathVariable dRepHash: String,
        @RequestParam(required = false, defaultValue = "false") withoutAmount: Boolean,
    ) = dRepService.getActiveDRepDelegation(dRepHash, withoutAmount)
}