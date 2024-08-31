package io.hazelnet.community.data.discord.whitelists

import ValidBlockchainAddress
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.shared.data.BlockchainType
import io.hazelnet.shared.data.WhitelistAutojoinDto
import org.hibernate.annotations.Type
import java.util.*
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.persistence.EnumType
import javax.persistence.Enumerated
import javax.validation.constraints.Min

@Embeddable
class WhitelistAutojoin @JsonCreator constructor(
        @Column(name = "address")
        @ValidBlockchainAddress
        var address: String,

        @Column(name = "blockchain")
        @Enumerated(EnumType.STRING)
        @Type(type = "io.hazelnet.community.persistence.data.BlockchainTypePostgreSql")
        var blockchain: BlockchainType,

        @Column(name = "autojoin_creation", updatable = false)
        var autojoinCreation: Date?
) {
    fun toDto() = WhitelistAutojoinDto(
            address = address,
            blockchain = blockchain,
            autojoinCreation = autojoinCreation!!
    )

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is WhitelistAutojoin) return false

        if (address != other.address) return false
        if (blockchain != other.blockchain) return false
        if (autojoinCreation != other.autojoinCreation) return false

        return true
    }

    override fun hashCode(): Int {
        var result = address.hashCode()
        result = 31 * result + blockchain.hashCode()
        result = 31 * result + (autojoinCreation?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "WhitelistAutojoin(address='$address', blockchain=$blockchain, autojoinCreation=$autojoinCreation)"
    }

}