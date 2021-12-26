package io.hazelnet.community.services

import io.hazelnet.community.data.Account
import io.hazelnet.community.persistence.AccountRepository
import org.springframework.stereotype.Service

@Service
class AccountService(
        private val accountRepository: AccountRepository
) {
    fun createAccount(account: Account): Account = accountRepository.save(account)
}