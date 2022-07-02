package io.hazelnet.community.controllers

import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.ping.ExternalAccountPingPartial
import io.hazelnet.community.services.ExternalAccountService
import io.hazelnet.community.services.PingService
import io.hazelnet.community.services.WhitelistService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/externalaccounts")
class ExternalAccountController(
        private val externalAccountService: ExternalAccountService,
        private val pingService: PingService,
        private val whitelistService: WhitelistService,
) {
    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun createExternalAccount(@RequestBody @Valid externalAccount: ExternalAccount): ResponseEntity<ExternalAccount> {
        val newExternalAccount = externalAccountService.createExternalAccount(externalAccount)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{externalAccountId}")
                .buildAndExpand(newExternalAccount.id)
                .toUri())
            .body(newExternalAccount)
    }

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

    @GetMapping("/{externalAccountId}/pings")
    fun getExternalAccountPings(@PathVariable externalAccountId: Long) = pingService.getExternalAccountPings(externalAccountId)

    @PatchMapping("/{externalAccountId}/pings/{pingId}")
    fun updateExternalAccountPing(@PathVariable externalAccountId: Long, @PathVariable pingId: Long, @RequestBody externalAccountPingPartial: ExternalAccountPingPartial) = pingService.updateExternalAccountPing(externalAccountId, pingId, externalAccountPingPartial)

    @GetMapping("/{externalAccountId}/whitelists")
    fun getExternalAccountWhitelists(@PathVariable externalAccountId: Long) = whitelistService.getExternalAccountWhitelists(externalAccountId)

    @GetMapping("/{externalAccountId}/premium")
    fun getPremiumInfo(@PathVariable externalAccountId: Long) = externalAccountService.getPremiumInfo(externalAccountId)

    @PostMapping("/{externalAccountId}/import")
    fun importExternalVerifications(@PathVariable externalAccountId: Long) = externalAccountService.importExternalVerifications(externalAccountId)

    @PutMapping("/{externalAccountId}/account")
    fun setAccountForExternalAccount(@PathVariable externalAccountId: Long) = externalAccountService.setAccountForExternalAccount(externalAccountId)


}