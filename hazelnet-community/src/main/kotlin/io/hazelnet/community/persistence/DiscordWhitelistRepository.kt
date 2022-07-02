package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.Whitelist
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface DiscordWhitelistRepository: CrudRepository<Whitelist, Long> {
    fun findBySharedWithServer(sharedWithServer: Int): List<Whitelist>

    @Query("SELECT w FROM Whitelist w JOIN w.signups s WHERE s.externalAccountId=:externalAccountId")
    fun findBySignupsOfExternalAccount(@Param("externalAccountId") externalAccountId: Long): List<Whitelist>
}