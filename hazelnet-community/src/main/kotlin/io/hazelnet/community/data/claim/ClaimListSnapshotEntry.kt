package io.hazelnet.community.data.claim

import com.fasterxml.jackson.annotation.JsonCreator
import org.springframework.lang.NonNull
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.Min
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Embeddable
class ClaimListSnapshotEntry @JsonCreator constructor(
    @Column(name = "stake_address")
    @field:Size(min = 10, max = 60)
    @field:Pattern(regexp = "[a-zA-Z0-9]+")
    var stakeAddress: String,

    @Column(name = "claimable_product_id")
    @field:NonNull
    @field:Min(1)
    var claimableProduct: Int,

    @Column(name = "claimable_product_count")
    @field:NonNull
    @field:Min(1)
    var claimableCount: Int,

    @Column(name = "claimed_in_order")
    var orderId: Int?,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as ClaimListSnapshotEntry

        if (stakeAddress != other.stakeAddress) return false
        if (claimableProduct != other.claimableProduct) return false
        if (claimableCount != other.claimableCount) return false

        return true
    }

    override fun hashCode(): Int {
        var result = stakeAddress.hashCode()
        result = 31 * result + claimableProduct
        result = 31 * result + claimableCount
        return result
    }

    override fun toString(): String {
        return "ClaimListSnapshotEntry(stakeAddress='$stakeAddress', claimableProduct=$claimableProduct, claimableCount=$claimableCount)"
    }
}