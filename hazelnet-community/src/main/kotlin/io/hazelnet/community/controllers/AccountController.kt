package io.hazelnet.community.controllers

import io.hazelnet.community.data.Account
import io.hazelnet.community.data.EmbeddableSetting
import io.hazelnet.community.services.AccountService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping(("/accounts"))
class AccountController(
        private val accountService: AccountService
) {
    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun createUser(@RequestBody @Valid account: Account): ResponseEntity<Account> {
        val newAccount = accountService.createAccount(account)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{accountId}")
                .buildAndExpand(newAccount.id)
                .toUri())
            .body(newAccount)
    }

    @GetMapping("/{accountId}")
    @ResponseStatus(HttpStatus.OK)
    fun getAccount(@PathVariable accountId: Long) = accountService.getAccount(accountId)

    @PutMapping("/{accountId}/settings/{settingName}")
    @ResponseStatus(HttpStatus.OK)
    fun updateSetting(@PathVariable accountId: Long, @PathVariable settingName: String, @RequestBody @Valid embeddableSetting: EmbeddableSetting): EmbeddableSetting {
        if (embeddableSetting.name != settingName) {
            throw IllegalArgumentException("Account server setting name in path $settingName did not match setting in request body ${embeddableSetting.name}.")
        }
        return accountService.updateSettings(accountId, embeddableSetting)
    }

    @DeleteMapping("/{accountId}/settings/{settingName}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteSetting(@PathVariable accountId: Long, @PathVariable settingName: String) = accountService.deleteSettings(accountId, settingName)
}