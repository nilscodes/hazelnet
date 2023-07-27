package io.hazelnet.community.data.discord.giveaways

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
class DiscordGiveawayEntry @JsonCreator constructor(
    @Column(name = "external_account_id")
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var externalAccountId: Long,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "entry_time", updatable = false)
    var time: Date?,

    @Column(name = "entry_weight")
    @field:NonNull
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var weight: Long,

    @Column(name = "winning_count")
    @field:NonNull
    @field:Min(0)
    var winningCount: Int = 0,
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordGiveawayEntry

        if (externalAccountId != other.externalAccountId) return false

        return true
    }

    override fun hashCode(): Int {
        return externalAccountId.hashCode()
    }

    override fun toString(): String {
        return "DiscordGiveawayEntry(externalAccountId=$externalAccountId, time=$time, weight=$weight, winningCount=$winningCount)"
    }


}
