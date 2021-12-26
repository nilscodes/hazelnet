package io.hazelnet.community.data.cardano

import com.fasterxml.jackson.annotation.JsonCreator
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import org.springframework.lang.NonNull
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.Size

@Embeddable
class Stakepool @JsonCreator constructor(
        @Column(name = "stakepool_hash")
        @field:NonNull
        @field:Size(min = 56, max = 56)
        var poolHash: String,

        @Transient
        var info: StakepoolInfo?
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Stakepool

        if (poolHash != other.poolHash) return false

        return true
    }

    override fun hashCode(): Int {
        return poolHash.hashCode()
    }

    override fun toString(): String {
        return "Stakepool(poolHash='$poolHash')"
    }
}