package io.hazelnet.external.controllers

import io.hazelnet.external.security.getGuildId
import io.hazelnet.external.services.AssetService
import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/community/assets")
class AssetsController(
    private val assetService: AssetService,
) {
    @GetMapping("/{discordUserId}/{policyId}")
    @ResponseStatus(HttpStatus.OK)
    fun getAssetsOfPolicyForDiscordUser(@PathVariable discordUserId: Long, @PathVariable policyId: String, authentication: BearerTokenAuthentication): List<String> {
        val guildId = authentication.getGuildId()
        return assetService.getAssetsOfPolicyForDiscordUser(guildId, policyId, discordUserId)
    }
}