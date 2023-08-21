package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.DiscordServerMemberPledge
import io.hazelnet.community.data.discord.DiscordServerMemberStake
import io.hazelnet.community.data.discord.widgets.DiscordMintCounterUpdateProjection
import io.hazelnet.community.data.discord.widgets.DiscordRoleCounterUpdateProjection
import io.hazelnet.community.data.discord.widgets.DiscordWidgetUpdateProjection
import org.springframework.data.jpa.repository.Modifying
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
    fun findByReferralAndReferralPaidOut(referral: String, referralPaidOut: Boolean): List<DiscordServer>

    @Query(value = "SELECT SUM(guildMemberCount) FROM DiscordServer WHERE active=true")
    fun sumGuildMemberCountForActiveServers(): Long

    @Query(value = "SELECT DISTINCT discord_server_id AS discordServerId, m.external_account_id AS externalAccountId, cardano_stake_address as cardanoStakeAddress, premium_weight as stakePercentage FROM external_accounts ea JOIN discord_server_members m ON ea.external_account_id = m.external_account_id JOIN verifications v on ea.external_account_id = v.external_account_id WHERE m.external_account_id IN (SELECT external_account_id FROM discord_server_members WHERE discord_server_id=:discordServerId AND premium_support=true) AND m.premium_support=true AND v.confirmed", nativeQuery = true)
    fun getDiscordMembersWithStakeAndPremiumPledge(@Param("discordServerId") discordServerId: Int): List<DiscordServerMemberStake>

    @Query(value = "SELECT DISTINCT guild_name as guildName, premium_weight as premiumWeight FROM discord_servers ds JOIN discord_server_members dsm on ds.discord_server_id = dsm.discord_server_id WHERE external_account_id=:externalAccountId AND premium_support=true", nativeQuery = true)
    fun getDiscordServersForPremiumMember(@Param("externalAccountId") externalAccountId: Long): List<DiscordServerMemberPledge>

    @Query(value = "SELECT DISTINCT ds.* FROM discord_servers ds JOIN discord_server_members dsm on ds.discord_server_id = dsm.discord_server_id WHERE external_account_id=:externalAccountId", nativeQuery = true)
    fun getDiscordServersForMember(@Param("externalAccountId") externalAccountId: Long): List<DiscordServer>

    @Query(value = "SELECT ds FROM DiscordServer ds WHERE ds.active=true AND ds.premiumUntil>:now AND (ds.premiumReminder<:now OR ds.premiumReminder IS NULL)")
    fun getDiscordServersThatNeedPremiumReminder(@Param("now") now: Date): List<DiscordServer>

    @Query(value = "SELECT ds.* FROM discord_servers ds JOIN discord_settings dss on ds.discord_server_id = dss.discord_server_id WHERE ds.active=true AND dss.setting_name='ACTIVITY_REMINDER' AND dss.setting_value<>''", nativeQuery = true)
    fun findDiscordServersForActivityReminders(): List<DiscordServer>

    @Query(value = "SELECT ds.guild_id AS guildId, dss.setting_value as channelId FROM discord_servers ds JOIN discord_settings dss on ds.discord_server_id = dss.discord_server_id WHERE ds.active=true AND dss.setting_name='WIDGET_EPOCHCLOCK' AND dss.setting_value<>''", nativeQuery = true)
    fun findChannelsForEpochClockUpdate(): List<DiscordWidgetUpdateProjection>

    @Query(value = "SELECT ds.guild_id AS guildId, dss.setting_name as widgetName, dss.setting_value as channelId FROM discord_servers ds JOIN discord_settings dss ON ds.discord_server_id = dss.discord_server_id WHERE ds.active=true AND position('WIDGET_ROLE_COUNTER_' in dss.setting_name)=1 AND dss.setting_value<>''", nativeQuery = true)
    fun findChannelsForRoleCounterUpdate(): List<DiscordRoleCounterUpdateProjection>

    @Query(value = "SELECT ds.guild_id AS guildId, dss.setting_value as updateInfo FROM discord_servers ds JOIN discord_settings dss on ds.discord_server_id = dss.discord_server_id WHERE dss.setting_name='WIDGET_MINTCOUNTER' AND dss.setting_value<>''", nativeQuery = true)
    fun findChannelsForMintCounterUpdate(): List<DiscordMintCounterUpdateProjection>

    @Query(value = "UPDATE discord_server_members SET premium_weight=-1 WHERE external_account_id=:externalAccountId", nativeQuery = true)
    @Modifying
    fun resetPremiumWeightForExternalAccount(@Param("externalAccountId") externalAccountId: Long)
}