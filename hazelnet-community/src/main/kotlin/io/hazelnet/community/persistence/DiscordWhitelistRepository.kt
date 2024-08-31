package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.whitelists.Whitelist
import io.hazelnet.community.data.discord.AwardedRoleProjection
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
    fun findAwardedRoleAssignments(@Param("discordServerId") discordServerId: Int): List<AwardedRoleProjection>

    @Query("SELECT e.referenceId as externalReferenceId, w.awardedRole as awardedRole FROM Whitelist w JOIN w.signups s JOIN ExternalAccount e ON e.id=s.externalAccountId WHERE w.awardedRole IS NOT NULL AND w.discordServerId=:discordServerId AND e.id=:externalAccountId")
    fun findAwardedRoleAssignmentsForExternalAccount(
        @Param("discordServerId") discordServerId: Int,
        @Param("externalAccountId") externalAccountId: Long
    ): List<AwardedRoleProjection>

    @Query(
        """
SELECT w.discord_server_id as discordServerId, a.discord_whitelist_id as discordWhitelistId, a.address as address, a.blockchain as blockchain, v.external_account_id as externalAccountId
FROM discord_whitelists_autojoin a
         LEFT OUTER JOIN discord_whitelists_signup s
                         ON a.discord_whitelist_id = s.discord_whitelist_id AND a.address = s.address AND
                            a.blockchain = s.blockchain
JOIN verifications v ON v.address=a.address AND v.blockchain=a.blockchain
JOIN discord_whitelists w ON w.discord_whitelist_id=a.discord_whitelist_id
JOIN discord_server_members m ON m.external_account_id=v.external_account_id AND w.discord_server_id=m.discord_server_id
WHERE a.blockchain!='CARDANO' AND s.discord_whitelist_id IS NULL
    """, nativeQuery = true
    )
    fun findOpenNonCardanoAutojoins(): List<AutojoinProjection>

    @Query(
        """
SELECT w.discord_server_id as discordServerId, a.discord_whitelist_id as discordWhitelistId, a.address as address, a.blockchain as blockchain, v.external_account_id as externalAccountId
FROM discord_whitelists_autojoin a
         LEFT OUTER JOIN discord_whitelists_signup s
                         ON a.discord_whitelist_id = s.discord_whitelist_id AND a.address = s.address AND
                            a.blockchain = s.blockchain
JOIN verifications v ON v.address=a.address AND v.blockchain=a.blockchain
JOIN discord_whitelists w ON w.discord_whitelist_id=a.discord_whitelist_id
JOIN discord_server_members m ON m.external_account_id=v.external_account_id AND w.discord_server_id=m.discord_server_id
WHERE m.external_account_id=:externalAccountId AND a.blockchain!='CARDANO' AND s.discord_whitelist_id IS NULL
    """, nativeQuery = true
    )
    fun findOpenNonCardanoAutojoinsForExternalAccount(externalAccountId: Long): List<AutojoinProjection>


}