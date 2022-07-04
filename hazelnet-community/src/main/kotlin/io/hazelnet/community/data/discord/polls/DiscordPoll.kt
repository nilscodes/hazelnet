package io.hazelnet.community.data.discord.polls

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.community.data.discord.DiscordServer
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.*
import javax.validation.Valid
import javax.validation.constraints.Min
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_polls")
class DiscordPoll @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "discord_poll_id")
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

    @Column(name = "poll_name")
    @field:NonNull
    @field:Size(min = 1, max = 30)
    @field:Pattern(regexp = "^[A-Za-z][-A-Za-z0-9]{0,29}$")
    var name: String,

    @Column(name = "poll_displayname")
    @field:NonNull
    @field:Size(min = 1, max = 256)
    var displayName: String,

    @Column(name = "poll_description")
    @field:NonNull
    @field:Size(min = 1, max = 4096)
    var description: String,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "poll_creation", updatable = false)
    var createTime: Date?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "poll_open_after")
    @field:NonNull
    var openAfter: Date,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "poll_open_until")
    @field:NonNull
    var openUntil: Date,

    @Column(name = "poll_results_visible")
    var resultsVisible: Boolean = true,

    @Column(name = "poll_weighted")
    var weighted: Boolean = false,

    @Column(name = "poll_multiple_votes")
    var multipleVotes: Boolean = false,

    @Column(name = "poll_archived")
    var archived: Boolean = false,

    @Column(name = "poll_snapshot_id")
    var snapshotId: Int?,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "discord_poll_required_roles", joinColumns = [JoinColumn(name = "discord_poll_id")])
    @field:Valid
    var requiredRoles: MutableSet<DiscordPollRequiredRole> = mutableSetOf(),

    @OneToMany(fetch = FetchType.EAGER, cascade = [CascadeType.ALL])
    @JoinColumn(name = "discord_poll_id")
    @field:Valid
    var options: MutableSet<DiscordPollOption> = mutableSetOf(),

    @Column(name = "poll_voteaire_id")
    var voteaireUUID: UUID?,

    ) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordPoll

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
        if (resultsVisible != other.resultsVisible) return false
        if (weighted != other.weighted) return false
        if (multipleVotes != other.multipleVotes) return false
        if (archived != other.archived) return false
        if (snapshotId != other.snapshotId) return false
        if (requiredRoles != other.requiredRoles) return false
        if (options != other.options) return false
        if (voteaireUUID != other.voteaireUUID) return false

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
        result = 31 * result + openAfter.hashCode()
        result = 31 * result + openUntil.hashCode()
        result = 31 * result + resultsVisible.hashCode()
        result = 31 * result + weighted.hashCode()
        result = 31 * result + multipleVotes.hashCode()
        result = 31 * result + archived.hashCode()
        result = 31 * result + (snapshotId ?: 0)
        result = 31 * result + requiredRoles.hashCode()
        result = 31 * result + options.hashCode()
        result = 31 * result + voteaireUUID.hashCode()
        return result
    }

    override fun toString(): String {
        return "DiscordPoll(id=$id, discordServer=$discordServer, creator=$creator, channelId=$channelId, messageId=$messageId, name='$name', displayName='$displayName', description='$description', createTime=$createTime, openAfter=$openAfter, openUntil=$openUntil, resultsVisible=$resultsVisible, weighted=$weighted, multipleVotes=$multipleVotes, archived=$archived, snapshotId=$snapshotId, requiredRoles=$requiredRoles, options=$options, voteaireUUID=$voteaireUUID)"
    }
}