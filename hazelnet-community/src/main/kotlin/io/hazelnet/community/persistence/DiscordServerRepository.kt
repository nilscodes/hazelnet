package io.hazelnet.community.persistence

import io.hazelnet.community.data.Verification
import io.hazelnet.community.data.discord.DiscordServer
import io.hazelnet.community.data.discord.DiscordServerMemberStake
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DiscordServerRepository: CrudRepository<DiscordServer, Int> {
    fun findByGuildId(guildId: Long): Optional<DiscordServer>

    @Query(value = "SELECT DISTINCT discord_server_id AS discordServerId, m.external_account_id AS externalAccountId, cardano_stake_address as cardanoStakeAddress FROM external_accounts ea JOIN discord_server_members m ON ea.external_account_id = m.external_account_id JOIN verifications v on ea.external_account_id = v.external_account_id WHERE m.external_account_id IN (SELECT external_account_id FROM discord_server_members WHERE discord_server_id=:discordServerId AND premium_support=true) AND v.confirmed", nativeQuery = true)
    fun getDiscordMembersWithStake(@Param("discordServerId") discordServerId: Int): List<DiscordServerMemberStake>
}