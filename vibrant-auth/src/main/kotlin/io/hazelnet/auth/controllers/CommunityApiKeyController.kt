package io.hazelnet.auth.controllers

import io.hazelnet.auth.services.CommunityApiKeyService
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
class CommunityApiKeyController(
    private val communityApiKeyService: CommunityApiKeyService,
) {
    @PostMapping("/{guildId}/accesstoken")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAuthority('SCOPE_api') and clientHasAnyRole('vibrant-internal')")
    fun regenerateAccessToken(@PathVariable guildId: Long) = communityApiKeyService.regenerateAccessToken(guildId)

    @DeleteMapping("/{guildId}/accesstoken")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('SCOPE_api') and clientHasAnyRole('vibrant-internal')")
    fun deleteAccessToken(@PathVariable guildId: Long) = communityApiKeyService.deleteAccessToken(guildId)
}