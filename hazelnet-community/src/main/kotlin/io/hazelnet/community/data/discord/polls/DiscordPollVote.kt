package io.hazelnet.community.data.discord.polls

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.persistence.Temporal
import javax.persistence.TemporalType
import javax.validation.constraints.Min

@Embeddable
class DiscordPollVote @JsonCreator constructor(
    @Column(name = "external_account_id")
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var externalAccountId: Long,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "vote_time", updatable = false)
    var time: Date?,

    @Column(name = "vote_weight")
    @field:NonNull
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var weight: Long,
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordPollVote

        if (externalAccountId != other.externalAccountId) return false

        return true
    }

    override fun hashCode(): Int {
        return externalAccountId.hashCode()
    }
}