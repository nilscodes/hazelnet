package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.DiscordServerMemberStake
import io.hazelnet.community.data.discord.polls.DiscordPollUpdateProjection
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DiscordServerRepository: CrudRepository<DiscordServer, Int> {
    fun findByGuildId(guildId: Long): Optional<DiscordServer>

    fun countByActive(active: Boolean): Long
    fun countByPremiumUntilAfter(current: Date): Long

    @Query(value = "SELECT SUM(guildMemberCount) FROM DiscordServer WHERE active=true")
    fun sumGuildMemberCountForActiveServers(): Long

    @Query(value = "SELECT DISTINCT discord_server_id AS discordServerId, m.external_account_id AS externalAccountId, cardano_stake_address as cardanoStakeAddress FROM external_accounts ea JOIN discord_server_members m ON ea.external_account_id = m.external_account_id JOIN verifications v on ea.external_account_id = v.external_account_id WHERE m.external_account_id IN (SELECT external_account_id FROM discord_server_members WHERE discord_server_id=:discordServerId AND premium_support=true) AND m.premium_support=true AND v.confirmed", nativeQuery = true)
    fun getDiscordMembersWithStakeAndPremiumPledge(@Param("discordServerId") discordServerId: Int): List<DiscordServerMemberStake>

    @Query(value = "SELECT DISTINCT guild_name FROM discord_servers ds JOIN discord_server_members dsm on ds.discord_server_id = dsm.discord_server_id WHERE external_account_id=:externalAccountId AND premium_support=true", nativeQuery = true)
    fun getDiscordServersForPremiumMember(@Param("externalAccountId") externalAccountId: Long): List<String>

    @Query(value = "SELECT DISTINCT ds.* FROM discord_servers ds JOIN discord_server_members dsm on ds.discord_server_id = dsm.discord_server_id WHERE external_account_id=:externalAccountId", nativeQuery = true)
    fun getDiscordServersForMember(@Param("externalAccountId") externalAccountId: Long): List<DiscordServer>

    @Query(value = "SELECT ds FROM DiscordServer ds WHERE ds.active=true AND ds.premiumUntil>:now AND (ds.premiumReminder<:now OR ds.premiumReminder IS NULL)")
    fun getDiscordServersThatNeedReminder(@Param("now") now: Date): List<DiscordServer>
}