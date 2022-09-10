package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.address.Handle
import io.hazelnet.community.data.Account
import io.hazelnet.community.data.EmbeddableSetting
import io.hazelnet.community.persistence.AccountRepository
import org.springframework.stereotype.Service

@Service
class AccountService(
    private val accountRepository: AccountRepository,
    private val externalAccountService: ExternalAccountService,
    private val connectService: ConnectService,
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

    fun getAccount(accountId: Long): Account =
        accountRepository.findById(accountId)
            .orElseThrow { NoSuchElementException("No account with ID $accountId found") }


    fun setAccountForExternalAccount(externalAccountId: Long): Account {
        val externalAccount = externalAccountService.getExternalAccount(externalAccountId)
        if (externalAccount.account == null) {
            val newAccount = this.createAccount(Account(id = null))
            externalAccount.account = newAccount
            externalAccountService.updateExternalAccount(externalAccount)
            return newAccount
        }
        return externalAccount.account!!
    }

    fun getHandlesForAccount(accountId: Long): List<Handle> {
        val account = getAccount(accountId)
        val verifiedStakeAddresses = externalAccountService.getExternalAccountsForAccount(account)
            .map { externalAccountService.getVerifiedStakeAddressesForExternalAccount(it.id!!) }
            .flatten()
        return connectService.findHandlesForStakeAddress(verifiedStakeAddresses)
    }

}