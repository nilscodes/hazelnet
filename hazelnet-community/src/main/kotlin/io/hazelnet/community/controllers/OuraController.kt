package io.hazelnet.community.controllers

import io.hazelnet.community.services.OuraEventService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/oura")
class OuraController(
    private val ouraEventService: OuraEventService,
) {
    @PostMapping("")
    @ResponseStatus(HttpStatus.OK)
    fun receiveEvent(@RequestBody ouraEvent: Map<String, Any>) = ouraEventService.receiveEvent(ouraEvent)
}