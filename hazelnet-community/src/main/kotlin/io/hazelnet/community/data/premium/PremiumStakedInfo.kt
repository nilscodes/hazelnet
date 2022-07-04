package io.hazelnet.community.data.premium

import java.util.*
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.persistence.Temporal
import javax.persistence.TemporalType

@Embeddable
class PremiumStakedInfo(
    @Column(name="epoch")
    var epoch: Int,

    @Column(name="active_stake")
    var activeStake: Long,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "snapshot_time", updatable = false)
    var snapshotTime: Date,

    @Column(name="paid_out")
    var paidOut: Boolean = false,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as PremiumStakedInfo

        if (epoch != other.epoch) return false
        if (activeStake != other.activeStake) return false
        if (snapshotTime != other.snapshotTime) return false
        if (paidOut != other.paidOut) return false

        return true
    }

    override fun hashCode(): Int {
        var result = epoch
        result = 31 * result + activeStake.hashCode()
        result = 31 * result + snapshotTime.hashCode()
        result = 31 * result + paidOut.hashCode()
        return result
    }

    override fun toString(): String {
        return "PremiumStakedInfo(epoch=$epoch, activeStake=$activeStake, snapshotTime=$snapshotTime, paidOut=$paidOut)"
    }

}