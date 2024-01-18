package io.hazelnet.community.data.discord.giveaways

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.community.data.discord.DiscordRequiredRole
import io.hazelnet.community.data.discord.DiscordServer
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.*
import javax.validation.Valid
import javax.validation.constraints.Min
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_giveaways")
class DiscordGiveaway @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "discord_giveaway_id")
    var id: Int?,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discord_server_id")
    @JsonIgnore
    var discordServer: DiscordServer?,

    @Column(name = "external_account_id")
    @field:NonNull
    @field:Min(1)
    var creator: Long,

    @Column(name = "discord_channel_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var channelId: Long?,

    @Column(name = "discord_message_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var messageId: Long?,

    @Column(name = "giveaway_name")
    @field:NonNull
    @field:Size(min = 1, max = 30)
    @field:Pattern(regexp = "^[A-Za-z][-A-Za-z0-9]{0,29}$")
    var name: String,

    @Column(name = "giveaway_displayname")
    @field:NonNull
    @field:Size(min = 1, max = 256)
    var displayName: String,

    @Column(name = "giveaway_description")
    @field:NonNull
    @field:Size(min = 1, max = 4096)
    var description: String,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "giveaway_creation", updatable = false)
    var createTime: Date?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "giveaway_open_after")
    var openAfter: Date?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "giveaway_open_until")
    var openUntil: Date?,

    @Column(name = "giveaway_weighted")
    var weighted: Boolean = false,

    @Column(name = "giveaway_unique_winners")
    var uniqueWinners: Boolean = true,

    @Column(name = "giveaway_archived")
    var archived: Boolean = false,

    @Column(name = "giveaway_winner_count")
    @field:Min(1)
    var winnerCount: Int = 1,

    @Column(name = "giveaway_draw_type")
    @Enumerated(EnumType.ORDINAL)
    var drawType: GiveawayDrawType = GiveawayDrawType.DISCORD_ID,

    @Column(name = "giveaway_snapshot_id")
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "discord_giveaway_snapshots", joinColumns = [JoinColumn(name = "discord_giveaway_id")])
    var snapshotIds: Set<Int> = mutableSetOf(),

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "discord_giveaway_required_roles", joinColumns = [JoinColumn(name = "discord_giveaway_id")])
    @field:Valid
    var requiredRoles: MutableSet<DiscordRequiredRole> = mutableSetOf(),

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "discord_giveaway_entries", joinColumns = [JoinColumn(name = "discord_giveaway_id")])
    @field:JsonIgnore
    var entries: MutableSet<DiscordGiveawayEntry> = mutableSetOf(),

    @Column(name = "giveaway_logo_url")
    @field:Size(min = 1, max = 1000)
    var logoUrl: String? = null,

    @Column(name = "giveaway_group")
    @field:Size(min = 1, max = 30)
    var group: String? = null,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "recalculation_requested")
    var recalculationRequested: Date? = null,
    ) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordGiveaway

        if (id != other.id) return false
        if (discordServer != other.discordServer) return false
        if (creator != other.creator) return false
        if (channelId != other.channelId) return false
        if (messageId != other.messageId) return false
        if (name != other.name) return false
        if (displayName != other.displayName) return false
        if (description != other.description) return false
        if (createTime != other.createTime) return false
        if (openAfter != other.openAfter) return false
        if (openUntil != other.openUntil) return false
        if (weighted != other.weighted) return false
        if (uniqueWinners != other.uniqueWinners) return false
        if (archived != other.archived) return false
        if (winnerCount != other.winnerCount) return false
        if (drawType != other.drawType) return false
        if (snapshotIds != other.snapshotIds) return false
        if (requiredRoles != other.requiredRoles) return false
        if (entries != other.entries) return false
        if (logoUrl != other.logoUrl) return false
        if (group != other.group) return false
        if (recalculationRequested != other.recalculationRequested) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + (discordServer?.hashCode() ?: 0)
        result = 31 * result + creator.hashCode()
        result = 31 * result + (channelId?.hashCode() ?: 0)
        result = 31 * result + (messageId?.hashCode() ?: 0)
        result = 31 * result + name.hashCode()
        result = 31 * result + displayName.hashCode()
        result = 31 * result + description.hashCode()
        result = 31 * result + (createTime?.hashCode() ?: 0)
        result = 31 * result + (openAfter?.hashCode() ?: 0)
        result = 31 * result + (openUntil?.hashCode() ?: 0)
        result = 31 * result + weighted.hashCode()
        result = 31 * result + uniqueWinners.hashCode()
        result = 31 * result + archived.hashCode()
        result = 31 * result + winnerCount
        result = 31 * result + drawType.hashCode()
        result = 31 * result + snapshotIds.hashCode()
        result = 31 * result + requiredRoles.hashCode()
        result = 31 * result + entries.hashCode()
        result = 31 * result + (logoUrl?.hashCode() ?: 0)
        result = 31 * result + (group?.hashCode() ?: 0)
        result = 31 * result + (recalculationRequested?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordGiveaway(id=$id, discordServer=$discordServer, creator=$creator, channelId=$channelId, messageId=$messageId, name='$name', displayName='$displayName', description='$description', createTime=$createTime, openAfter=$openAfter, openUntil=$openUntil, weighted=$weighted, uniqueWinners=$uniqueWinners, archived=$archived, winnerCount=$winnerCount, drawType=$drawType, snapshotIds=$snapshotIds, requiredRoles=$requiredRoles, entries=$entries, logoUrl=$logoUrl, group=$group, recalculationRequested=$recalculationRequested)"
    }

}