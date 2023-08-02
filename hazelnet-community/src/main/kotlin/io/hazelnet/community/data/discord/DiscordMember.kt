package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import java.util.*
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.persistence.Temporal
import javax.persistence.TemporalType
import javax.validation.constraints.Min

@Embeddable
class DiscordMember @JsonCreator constructor(
    @Column(name = "external_account_id")
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var externalAccountId: Long,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "join_time", updatable = false)
    var joinTime: Date?,

    @Column(name = "premium_support")
    var premiumSupport: Boolean = false,

    @Column(name = "premium_weight")
    var premiumWeight: Int = -1,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordMember

        if (externalAccountId != other.externalAccountId) return false
        if (joinTime != other.joinTime) return false
        if (premiumSupport != other.premiumSupport) return false
        if (premiumWeight != other.premiumWeight) return false

        return true
    }

    override fun hashCode(): Int {
        var result = externalAccountId.hashCode()
        result = 31 * result + (joinTime?.hashCode() ?: 0)
        result = 31 * result + premiumSupport.hashCode()
        result = 31 * result + premiumWeight
        return result
    }

    override fun toString(): String {
        return "DiscordMember(externalAccountId=$externalAccountId, joinTime=$joinTime, premiumSupport=$premiumSupport, premiumWeight=$premiumWeight)"
    }

}