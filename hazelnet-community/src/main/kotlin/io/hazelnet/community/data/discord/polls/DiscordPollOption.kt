package io.hazelnet.community.data.discord.polls

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import org.springframework.lang.NonNull
import javax.persistence.*
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_poll_options")
class DiscordPollOption @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "discord_poll_option_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var id: Long? = null,

    @Column(name = "option_reaction_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var reactionId: Long? = null,

    @Column(name = "option_reaction_name")
    @field:Size(min = 1, max = 256)
    var reactionName: String? = null,

    @Column(name = "option_text")
    @field:NonNull
    @field:Size(min = 1, max = 256)
    var text: String,

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "discord_poll_votes", joinColumns = [JoinColumn(name = "discord_poll_option_id")])
    @field:JsonIgnore
    var votes: MutableSet<DiscordPollVote> = mutableSetOf()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordPollOption

        if (id != other.id) return false
        if (reactionId != other.reactionId) return false
        if (reactionName != other.reactionName) return false
        if (text != other.text) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + (reactionId?.hashCode() ?: 0)
        result = 31 * result + (reactionName?.hashCode() ?: 0)
        result = 31 * result + text.hashCode()
        return result
    }
}