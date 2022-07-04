package io.hazelnet.community.data.claim

import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.*
import javax.validation.Valid
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "claim_lists")
class ClaimList (
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "claim_list_id")
    var id: Int?,

    @Column(name = "claim_list_name")
    @field:NonNull
    @field:Size(min = 1, max = 30)
    @field:Pattern(regexp = "^[A-Za-z][-A-Za-z0-9]{0,29}$")
    var name: String,

    @Column(name = "claim_list_displayname")
    @field:NonNull
    @field:Size(min = 1, max = 256)
    var displayName: String,

    @Column(name = "claim_list_description")
    @field:Size(min = 1, max = 2000)
    var description: String?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "claim_list_creation", updatable = false)
    var createTime: Date?,

    @Column(name = "claim_list_url")
    var claimUrl: String?,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "claim_lists_snapshot_cardano", joinColumns = [JoinColumn(name = "claim_list_id")])
    @field:Valid
    var claims: MutableSet<ClaimListSnapshotEntry> = mutableSetOf(),
) {
    /**
     * Copy-constructor to use with a specific set of stake addresses
     */
    constructor(original: ClaimList, validStakeAddresses: List<String>) : this(
        original.id,
        original.name,
        original.displayName,
        original.description,
        original.createTime,
        original.claimUrl,
        original.claims.filter { validStakeAddresses.contains(it.stakeAddress) }.toMutableSet(),
    )

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as ClaimList

        if (id != other.id) return false
        if (name != other.name) return false
        if (displayName != other.displayName) return false
        if (description != other.description) return false
        if (createTime != other.createTime) return false
        if (claimUrl != other.claimUrl) return false
        if (claims != other.claims) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + name.hashCode()
        result = 31 * result + displayName.hashCode()
        result = 31 * result + (description?.hashCode() ?: 0)
        result = 31 * result + (createTime?.hashCode() ?: 0)
        result = 31 * result + (claimUrl?.hashCode() ?: 0)
        result = 31 * result + claims.hashCode()
        return result
    }

    override fun toString(): String {
        return "ClaimList(id=$id, name='$name', displayName='$displayName', description=$description, createTime=$createTime, claimUrl=$claimUrl, claims=$claims)"
    }

}