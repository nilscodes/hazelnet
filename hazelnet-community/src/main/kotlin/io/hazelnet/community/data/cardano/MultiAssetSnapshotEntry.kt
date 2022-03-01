package io.hazelnet.community.data.cardano

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Embeddable
class MultiAssetSnapshotEntry @JsonCreator constructor(
    @Column(name = "stake_address")
    @field:Size(min = 10, max = 60)
    @field:Pattern(regexp = "[a-zA-Z0-9]+")
    var stakeAddress: String,

    @Column(name = "token_quantity")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var tokenQuantity: Long,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as MultiAssetSnapshotEntry

        if (stakeAddress != other.stakeAddress) return false

        return true
    }

    override fun hashCode(): Int {
        return stakeAddress.hashCode()
    }

    override fun toString(): String {
        return "MultiAssetSnapshotEntry(stakeAddress='$stakeAddress', tokenQuantity=$tokenQuantity)"
    }

}