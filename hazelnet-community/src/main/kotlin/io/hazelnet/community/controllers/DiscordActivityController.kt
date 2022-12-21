package io.hazelnet.community.controllers

import io.hazelnet.community.services.DiscordServerService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping(("/discord"))
class DiscordActivityController(
    private val discordServerService: DiscordServerService
) {

    @PostMapping("/activity")
    @ResponseStatus(HttpStatus.OK)
    fun updateMemberActivity(@RequestBody activityMap: Map<String, Long>) = discordServerService.updateMemberActivity(activityMap)

}