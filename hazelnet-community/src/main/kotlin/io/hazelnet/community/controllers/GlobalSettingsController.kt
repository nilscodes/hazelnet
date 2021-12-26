package io.hazelnet.community.controllers

import io.hazelnet.community.data.GlobalSetting
import io.hazelnet.community.data.discord.DiscordServerSetting
import io.hazelnet.community.services.GlobalCommunityService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

@RestController
@RequestMapping("/settings")
class GlobalSettingsController(
        private val globalCommunityService: GlobalCommunityService
) {
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getSettings() = globalCommunityService.getSettings()

    @PutMapping("/{settingName}")
    @ResponseStatus(HttpStatus.OK)
    fun updateSetting(@PathVariable settingName: String, @RequestBody @Valid globalSetting: GlobalSetting): GlobalSetting {
        if (globalSetting.name != settingName) {
            throw IllegalArgumentException("Global setting name in path $settingName did not match setting in request body ${globalSetting.name}.")
        }
        return globalCommunityService.updateSetting(globalSetting)
    }
}