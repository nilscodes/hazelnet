package io.hazelnet.community.data.cardano

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnore
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.*
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "stake_snapshot_cardano")
class MultiAssetSnapshot @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "snapshot_id")
    var id: Int?,

    @Column(name = "snapshot_created", updatable = false)
    var createTime: Date?,

    @Column(name = "snapshot_time")
    @field:NonNull
    var snapshotTime: Date,

    @Column(name = "snapshot_policy_id")
    @field:NonNull
    @field:Size(min = 56, max = 56)
    var policyId: String,

    @Column(name = "snapshot_asset_fingerprint")
    @field:Size(min = 44, max = 44)
    @field:Pattern(regexp = "^asset1[a-zA-Z0-9]{38}$")
    var assetFingerprint: String?,

    @Column(name = "snapshot_taken")
    var taken: Boolean = false,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "stake_snapshot_data_cardano", joinColumns = [JoinColumn(name = "snapshot_id")])
    @field:JsonIgnore
    var data: MutableSet<MultiAssetSnapshotEntry> = mutableSetOf()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as MultiAssetSnapshot

        if (id != other.id) return false
        if (createTime != other.createTime) return false
        if (snapshotTime != other.snapshotTime) return false
        if (policyId != other.policyId) return false
        if (assetFingerprint != other.assetFingerprint) return false
        if (taken != other.taken) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + (createTime?.hashCode() ?: 0)
        result = 31 * result + snapshotTime.hashCode()
        result = 31 * result + policyId.hashCode()
        result = 31 * result + (assetFingerprint?.hashCode() ?: 0)
        result = 31 * result + taken.hashCode()
        return result
    }

    override fun toString(): String {
        return "MultiAssetSnapshot(id=$id, createTime=$createTime, snapshotTime=$snapshotTime, policyId='$policyId', assetFingerprint=$assetFingerprint, taken=$taken)"
    }


}