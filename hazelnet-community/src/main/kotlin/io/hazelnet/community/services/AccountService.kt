package io.hazelnet.community.services

import io.hazelnet.community.data.Account
import io.hazelnet.community.data.EmbeddableSetting
import io.hazelnet.community.persistence.AccountRepository
import org.springframework.stereotype.Service

@Service
class AccountService(
    private val accountRepository: AccountRepository
) {
    fun createAccount(account: Account): Account = accountRepository.save(account)

    fun updateSettings(accountId: Long, embeddableSetting: EmbeddableSetting): EmbeddableSetting {
        val account = getAccount(accountId)
        account.settings.removeIf { it.name == embeddableSetting.name }
        account.settings.add(embeddableSetting)
        accountRepository.save(account)
        return embeddableSetting
    }

    fun deleteSettings(accountId: Long, settingName: String) {
        val account = getAccount(accountId)
        account.settings.removeIf { it.name == settingName }
        accountRepository.save(account)
    }

    fun getAccount(accountId: Long) =
        accountRepository.findById(accountId)
            .orElseThrow { NoSuchElementException("No account with ID $accountId found") }
}