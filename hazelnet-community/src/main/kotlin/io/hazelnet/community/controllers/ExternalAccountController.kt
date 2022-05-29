package io.hazelnet.community.controllers

import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.services.ExternalAccountService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

@RestController
@RequestMapping("/externalaccounts")
class ExternalAccountController(
        private val externalAccountService: ExternalAccountService
) {
    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun createExternalAccount(@RequestBody @Valid externalAccount: ExternalAccount) = externalAccountService.createExternalAccount(externalAccount)

    @GetMapping("/{externalAccountId}")
    @ResponseStatus(HttpStatus.OK)
    fun getExternalAccount(@PathVariable externalAccountId: Long) = externalAccountService.getExternalAccount(externalAccountId)

    @PutMapping("/discord/{discordUserId}")
    @ResponseStatus(HttpStatus.OK)
    fun setExternalAccountForDiscordUser(@RequestBody @Valid externalAccount: ExternalAccount, @PathVariable discordUserId: Long) = externalAccountService.setExternalAccountForDiscordUser(externalAccount, discordUserId)

    @GetMapping("/discord/{discordUserId}")
    @ResponseStatus(HttpStatus.OK)
    fun getExternalAccountForDiscordUser(@PathVariable discordUserId: Long) = externalAccountService.getExternalAccountForDiscordUser(discordUserId)

    @GetMapping("/{externalAccountId}/verifications")
    fun getExternalAccountVerifications(@PathVariable externalAccountId: Long) = externalAccountService.getExternalAccountVerifications(externalAccountId)

    @GetMapping("/{externalAccountId}/premium")
    fun getPremiumInfo(@PathVariable externalAccountId: Long) = externalAccountService.getPremiumInfo(externalAccountId)

    @PostMapping("/{externalAccountId}/import")
    fun importExternalVerifications(@PathVariable externalAccountId: Long) = externalAccountService.importExternalVerifications(externalAccountId)
}