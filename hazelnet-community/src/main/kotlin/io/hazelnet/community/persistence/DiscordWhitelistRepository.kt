package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.whitelists.Whitelist
import io.hazelnet.community.data.discord.whitelists.WhitelistAwardedRoleProjection
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface DiscordWhitelistRepository: CrudRepository<Whitelist, Long> {
    fun findBySharedWithServer(sharedWithServer: Int): List<Whitelist>

    @Query("SELECT w FROM Whitelist w JOIN w.signups s WHERE s.externalAccountId=:externalAccountId")
    fun findBySignupsOfExternalAccount(@Param("externalAccountId") externalAccountId: Long): List<Whitelist>

    @Query("SELECT e.referenceId as externalReferenceId, w.awardedRole as awardedRole FROM Whitelist w JOIN w.signups s JOIN ExternalAccount e ON e.id=s.externalAccountId WHERE w.awardedRole IS NOT NULL AND w.discordServerId=:discordServerId")
    fun findAwardedRoleAssignments(@Param("discordServerId") discordServerId: Int): List<WhitelistAwardedRoleProjection>

    @Query("SELECT e.referenceId as externalReferenceId, w.awardedRole as awardedRole FROM Whitelist w JOIN w.signups s JOIN ExternalAccount e ON e.id=s.externalAccountId WHERE w.awardedRole IS NOT NULL AND w.discordServerId=:discordServerId AND e.id=:externalAccountId")
    fun findAwardedRoleAssignmentsForExternalAccount(@Param("discordServerId") discordServerId: Int, @Param("externalAccountId") externalAccountId: Long): List<WhitelistAwardedRoleProjection>
}