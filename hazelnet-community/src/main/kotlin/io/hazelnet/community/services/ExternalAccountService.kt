package io.hazelnet.community.services

import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.ExternalAccountType
import io.hazelnet.community.data.Verification
import io.hazelnet.community.persistence.ExternalAccountRepository
import io.hazelnet.community.persistence.VerificationRepository
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*
import kotlin.NoSuchElementException

@Service
class ExternalAccountService(
        private val externalAccountRepository: ExternalAccountRepository,
        private val verificationRepository: VerificationRepository
) {
    fun createExternalAccount(externalAccount: ExternalAccount): ExternalAccount {
        externalAccount.registrationTime = Date.from(ZonedDateTime.now().toInstant())
        return externalAccountRepository.save(externalAccount)
    }

    fun getExternalAccount(externalAccountId: Long): ExternalAccount = externalAccountRepository.findById(externalAccountId).orElseThrow()
    fun setExternalAccountForDiscordUser(externalAccount: ExternalAccount, discordUserId: Long): ExternalAccount {
        val existingExternalAccount = externalAccountRepository.findByReferenceId(discordUserId.toString())
        if(existingExternalAccount.isEmpty || existingExternalAccount.get().type != ExternalAccountType.DISCORD)
        {
            externalAccount.referenceId = discordUserId.toString()
            externalAccount.type = ExternalAccountType.DISCORD
            return createExternalAccount(externalAccount)
        }
        return existingExternalAccount.get()
    }

    fun getExternalAccountVerifications(externalAccountId: Long): List<Verification> {
        val externalAccount = getExternalAccount(externalAccountId) // Ensure account exists
        return verificationRepository.findAllByExternalAccount(externalAccount)
    }

    fun getExternalAccountForDiscordUser(discordUserId: Long): ExternalAccount {
        val existingExternalAccount = externalAccountRepository.findByReferenceId(discordUserId.toString())
        if(existingExternalAccount.isEmpty || existingExternalAccount.get().type != ExternalAccountType.DISCORD)
        {
            throw NoSuchElementException("No external account found for Discord user id $discordUserId")
        }
        return existingExternalAccount.get()
    }
}