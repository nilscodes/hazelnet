package io.hazelnet.community.controllers

import io.hazelnet.community.data.ping.ExternalAccountPingDto
import io.hazelnet.community.services.PingService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/pings")
class PingController(
    private val pingService: PingService,
) {

    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun addPing(@RequestBody @Valid externalAccountPing: ExternalAccountPingDto): ResponseEntity<ExternalAccountPingDto> {
        val newPing = pingService.addPing(externalAccountPing)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{pingId}")
                    .buildAndExpand(newPing.id)
                    .toUri())
            .body(newPing)
    }
}