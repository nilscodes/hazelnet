package io.hazelnet.cardano.connect.controllers

import io.hazelnet.cardano.connect.data.other.SyncInfo
import io.hazelnet.cardano.connect.services.InfoService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.support.ServletUriComponentsBuilder

@RestController
@RequestMapping(("/health"))
class HealthController(
    @Value("\${io.hazelnet.connect.cardano.dbsync.outagethreshold}")
    private val dbSyncOutageThreshold: Int,
    private val infoService: InfoService
) {
    @GetMapping("")
    fun healthCheck(): ResponseEntity<SyncInfo> {
        val syncStatus = infoService.getSynchronizationStatus()
        val httpStatus = if (syncStatus.getSecondsSinceLastSync() > dbSyncOutageThreshold) HttpStatus.SERVICE_UNAVAILABLE else HttpStatus.OK
        return ResponseEntity
            .status(httpStatus)
            .body(syncStatus)
    }
}