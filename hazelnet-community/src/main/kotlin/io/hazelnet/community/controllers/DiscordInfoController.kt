package io.hazelnet.community.controllers

import io.hazelnet.community.services.DiscordInfoService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/discord")
class DiscordInfoController(
    private val discordInfoService: DiscordInfoService
) {
    @GetMapping("/widgets/epochclock")
    @ResponseStatus(HttpStatus.OK)
    fun listChannelsForEpochClockUpdate() = discordInfoService.listChannelsForEpochClockUpdate()

    @GetMapping("/widgets/rolecounter")
    @ResponseStatus(HttpStatus.OK)
    fun listChannelsForRoleCounterUpdate() = discordInfoService.listChannelsForRoleCounterUpdate()

    @GetMapping("/widgets/mintcounter")
    @ResponseStatus(HttpStatus.OK)
    fun listChannelsForMintCounterUpdate() = discordInfoService.listChannelsForMintCounterUpdate()

}