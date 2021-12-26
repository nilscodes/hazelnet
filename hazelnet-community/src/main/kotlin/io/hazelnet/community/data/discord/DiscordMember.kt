package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import java.util.*
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.Min

@Embeddable
class DiscordMember @JsonCreator constructor(
        @Column(name = "external_account_id")
        @field:Min(1)
        var externalAccountId: Long,

        @Column(name = "join_time", updatable = false)
        var joinTime: Date?
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordMember

        if (externalAccountId != other.externalAccountId) return false

        return true
    }

    override fun hashCode(): Int {
        return externalAccountId.hashCode()
    }

    override fun toString(): String {
        return "DiscordMember(externalAccountId=$externalAccountId, joinTime=$joinTime)"
    }


}