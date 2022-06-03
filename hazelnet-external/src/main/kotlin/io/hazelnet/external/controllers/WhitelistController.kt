package io.hazelnet.external.controllers

import io.hazelnet.shared.data.SharedWhitelist
import io.hazelnet.shared.data.WhitelistSignup
import io.hazelnet.external.services.WhitelistService
import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/community/whitelists")
class WhitelistController(
        private val whitelistService: WhitelistService
) {
    @GetMapping("/{whitelistName}/signups")
    @ResponseStatus(HttpStatus.OK)
    fun getWhitelistSignups(@PathVariable whitelistName: String, authentication: BearerTokenAuthentication): List<WhitelistSignup> {
        val guildId = getGuildIdFromToken(authentication)
        return whitelistService.getWhitelistSignups(guildId, whitelistName)
    }

    @GetMapping("/shared")
    @ResponseStatus(HttpStatus.OK)
    fun getSharedWhitelistSignups(authentication: BearerTokenAuthentication): List<SharedWhitelist> {
        val guildId = getGuildIdFromToken(authentication)
        return whitelistService.getSharedWhitelists(guildId)
    }

    private fun getGuildIdFromToken(authentication: BearerTokenAuthentication): Long {
        return authentication.token.tokenValue.substringAfter(".").toLong()
    }
}