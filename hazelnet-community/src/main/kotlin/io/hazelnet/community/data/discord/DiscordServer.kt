package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.*
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.community.data.Account
import io.hazelnet.community.data.cardano.Stakepool
import io.hazelnet.community.data.cardano.TokenPolicy
import java.util.*
import javax.persistence.*
import javax.validation.Valid
import javax.validation.constraints.Min
import javax.validation.constraints.NotNull
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_servers")
class DiscordServer @JsonCreator constructor(
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "discord_server_id")
        var id: Int?,

        @Column(name = "guild_id")
        @field:Min(1)
        @field:JsonSerialize(using = ToStringSerializer::class)
        var guildId: Long,

        @Column(name = "guild_name")
        @field:NotNull
        @field:Size(min = 1, max = 100)
        var guildName: String,

        @Column(name = "guild_owner")
        @field:Min(1)
        @field:JsonSerialize(using = ToStringSerializer::class)
        var guildOwner: Long,

        @Column(name = "join_time", updatable = false)
        var joinTime: Date?,

        @Column(name = "guild_member_count")
        @field:Min(1)
        var guildMemberCount: Int,

        @ManyToOne(fetch = FetchType.EAGER)
        @JoinColumn(name = "owner_account_id")
        @JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator::class, property = "id")
        @JsonIdentityReference(alwaysAsId = true)
        var ownerAccount: Account?,

        @ElementCollection(fetch = FetchType.EAGER)
        @CollectionTable(name = "discord_policy_ids", joinColumns = [JoinColumn(name = "discord_server_id")])
        @field:Valid
        var tokenPolicies: MutableSet<TokenPolicy> = mutableSetOf(),

        @ElementCollection(fetch = FetchType.EAGER)
        @CollectionTable(name = "discord_spo", joinColumns = [JoinColumn(name = "discord_server_id")])
        @field:Valid
        var stakepools: MutableSet<Stakepool> = mutableSetOf(),

        @OneToMany(fetch = FetchType.EAGER)
        @JoinColumn(name = "discord_server_id")
        @field:Valid
        var delegatorRoles: MutableSet<DelegatorRole> = mutableSetOf(),

        @OneToMany(fetch = FetchType.EAGER)
        @JoinColumn(name = "discord_server_id")
        @field:Valid
        var tokenRoles: MutableSet<TokenOwnershipRole> = mutableSetOf(),

        @OneToMany(fetch = FetchType.EAGER)
        @JoinColumn(name = "discord_server_id")
        @field:Valid
        var whitelists: MutableSet<Whitelist> = mutableSetOf(),

        @ElementCollection(fetch = FetchType.EAGER)
        @CollectionTable(name = "discord_settings", joinColumns = [JoinColumn(name = "discord_server_id")])
        @field:Valid
        @field:JsonSerialize(using = DiscordServerSettingSerializer::class)
        var settings: MutableSet<DiscordServerSetting> = mutableSetOf(),

        @ElementCollection(fetch = FetchType.LAZY)
        @CollectionTable(name = "discord_server_members", joinColumns = [JoinColumn(name = "discord_server_id")])
        @field:Valid
        @field:JsonIgnore
        var members: MutableSet<DiscordMember> = mutableSetOf()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordServer

        if (id != other.id) return false
        if (guildId != other.guildId) return false
        if (guildName != other.guildName) return false
        if (guildOwner != other.guildOwner) return false
        if (joinTime != other.joinTime) return false
        if (guildMemberCount != other.guildMemberCount) return false
        if (ownerAccount != other.ownerAccount) return false
        if (tokenPolicies != other.tokenPolicies) return false
        if (stakepools != other.stakepools) return false
        if (delegatorRoles != other.delegatorRoles) return false
        if (tokenRoles != other.tokenRoles) return false
        if (settings != other.settings) return false
        if (members != other.members) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + guildId.hashCode()
        result = 31 * result + guildName.hashCode()
        result = 31 * result + guildOwner.hashCode()
        result = 31 * result + joinTime.hashCode()
        result = 31 * result + guildMemberCount
        result = 31 * result + (ownerAccount?.hashCode() ?: 0)
        result = 31 * result + tokenPolicies.hashCode()
        result = 31 * result + stakepools.hashCode()
        result = 31 * result + delegatorRoles.hashCode()
        result = 31 * result + tokenRoles.hashCode()
        result = 31 * result + settings.hashCode()
        result = 31 * result + members.hashCode()
        return result
    }

    override fun toString(): String {
        return "DiscordServer(id=$id, guildId=$guildId, guildName='$guildName', guildOwner=$guildOwner, joinTime=$joinTime, guildMemberCount=$guildMemberCount, ownerAccount=$ownerAccount, tokenPolicies=$tokenPolicies, stakepools=$stakepools, delegatorRoles=$delegatorRoles, tokenRoles=$tokenRoles, settings=$settings, members=$members)"
    }
}