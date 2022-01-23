package io.hazelnet.cardano.connect.controllers

import io.hazelnet.cardano.connect.data.address.Handle
import io.hazelnet.cardano.connect.services.HandleService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping(("/handles"))
class HandleController(
        private val handleService: HandleService
) {
    @GetMapping("/{handleName}")
    @ResponseStatus(HttpStatus.OK)
    fun resolveHandle(@PathVariable handleName: String): Handle = handleService.resolveHandle(handleName)
}