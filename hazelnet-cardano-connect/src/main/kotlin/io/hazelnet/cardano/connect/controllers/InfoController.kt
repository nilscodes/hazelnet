package io.hazelnet.cardano.connect.controllers

import io.hazelnet.cardano.connect.data.other.SyncInfo
import io.hazelnet.cardano.connect.services.InfoService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(("/info"))
class InfoController(
        private val infoService: InfoService
) {
    @GetMapping("/syncstatus")
    @ResponseStatus(HttpStatus.OK)
    fun syncStatus() = infoService.getSynchronizationStatus()

    @GetMapping("/epochdetails")
    @ResponseStatus(HttpStatus.OK)
    fun epochDetails() = infoService.getEpochDetails()
}