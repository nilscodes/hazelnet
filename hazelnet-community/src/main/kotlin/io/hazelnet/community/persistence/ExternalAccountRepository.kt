package io.hazelnet.community.persistence

import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.Verification
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface ExternalAccountRepository : CrudRepository<ExternalAccount, Long> {
    fun findByReferenceId(referenceId: String): Optional<ExternalAccount>

    @Query(value = "SELECT v.* FROM discord_server_members d JOIN verifications v on d.external_account_id = v.external_account_id WHERE d.discord_server_id=:discordServerId AND confirmed=true", nativeQuery = true)
    fun getAllCompletedVerificationsForDiscordServer(@Param("discordServerId") discordServerId: Int): List<Verification>
}