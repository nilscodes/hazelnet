package io.hazelnet.community.controllers

import io.hazelnet.community.data.Account
import io.hazelnet.community.services.AccountService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

@RestController
@RequestMapping(("/accounts"))
class AccountController(
        private val accountService: AccountService
) {
    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun createUser(@RequestBody @Valid account: Account) = accountService.createAccount(account)
}