package io.hazelnet.community.data.cardano

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import io.hazelnet.cardano.connect.data.drep.DRepInfo
import org.springframework.lang.NonNull
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.Size

@Embeddable
class DRep @JsonCreator constructor(
    @Column(name = "drep_hash")
    @field:NonNull
    @field:Size(min = 56, max = 56)
    @get:JsonProperty("dRepHash")
    var dRepHash: String,

    @Transient
    var info: DRepInfo?
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DRep

        return dRepHash == other.dRepHash
    }

    override fun hashCode(): Int {
        return dRepHash.hashCode()
    }

    override fun toString(): String {
        return "DRep(dRepHash='$dRepHash')"
    }
}