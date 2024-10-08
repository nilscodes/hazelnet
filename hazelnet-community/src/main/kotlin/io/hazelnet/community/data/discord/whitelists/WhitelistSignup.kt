package io.hazelnet.community.data.discord.whitelists

import ValidBlockchainAddress
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.shared.data.BlockchainType
import org.hibernate.annotations.Type
import java.util.*
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.persistence.EnumType
import javax.persistence.Enumerated
import javax.validation.constraints.Min

@Embeddable
class WhitelistSignup @JsonCreator constructor(
        @Column(name = "external_account_id")
        @field:Min(1)
        @field:JsonSerialize(using = ToStringSerializer::class)
        var externalAccountId: Long,

        @Column(name = "address")
        @ValidBlockchainAddress
        var address: String?,

        @Column(name = "blockchain")
        @Enumerated(EnumType.STRING)
        @Type(type = "io.hazelnet.community.persistence.data.BlockchainTypePostgreSql")
        var blockchain: BlockchainType?,

        @Column(name = "signup_time", updatable = false)
        var signupTime: Date?
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is WhitelistSignup) return false

        if (externalAccountId != other.externalAccountId) return false
        if (address != other.address) return false
        if (blockchain != other.blockchain) return false
        if (signupTime != other.signupTime) return false

        return true
    }

    override fun hashCode(): Int {
        var result = externalAccountId.hashCode()
        result = 31 * result + (address?.hashCode() ?: 0)
        result = 31 * result + (blockchain?.hashCode() ?: 0)
        result = 31 * result + (signupTime?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "WhitelistSignup(externalAccountId=$externalAccountId, address='$address', blockchain=$blockchain, signupTime=$signupTime)"
    }
}