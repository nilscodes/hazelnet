package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import org.springframework.lang.NonNull
import javax.persistence.*
import javax.validation.Valid
import javax.validation.constraints.Min
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_token_roles")
class TokenOwnershipRole @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="discord_token_role_id")
    var id: Long?,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "discord_token_role_policies", joinColumns = [JoinColumn(name = "discord_token_role_id")])
    @field:Valid
    @field:Size(min = 1, max = 50)
    var acceptedAssets: MutableSet<TokenRoleAssetInfo> = mutableSetOf(),

    @Column(name = "minimum_token_quantity")
    @field:NonNull
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var minimumTokenQuantity: Long,

    @Column(name = "maximum_token_quantity")
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var maximumTokenQuantity: Long?,

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "discord_token_role_id")
    @field:Valid
    var filters: MutableSet<TokenRoleMetadataFilter> = mutableSetOf(),

    @Column(name = "discord_role_id")
    @field:NonNull
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var roleId: Long,

    @Column(name = "aggregation_type")
    @Enumerated(EnumType.ORDINAL)
    var aggregationType: TokenOwnershipAggregationType = TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND,
) {

    fun meetsFilterCriteria(metadata: String): Boolean {
        return when (aggregationType) {
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND -> filters.all { it.apply(metadata) }
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH -> filters.any { it.apply(metadata) }
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR -> filters.isEmpty() || filters.any { it.apply(metadata) }
            TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR -> filters.isEmpty() || filters.any { it.apply(metadata) }
        }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as TokenOwnershipRole

        if (id != other.id) return false
        if (acceptedAssets != other.acceptedAssets) return false
        if (minimumTokenQuantity != other.minimumTokenQuantity) return false
        if (maximumTokenQuantity != other.maximumTokenQuantity) return false
        if (filters != other.filters) return false
        if (roleId != other.roleId) return false
        if (aggregationType != other.aggregationType) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + acceptedAssets.hashCode()
        result = 31 * result + minimumTokenQuantity.hashCode()
        result = 31 * result + (maximumTokenQuantity?.hashCode() ?: 0)
        result = 31 * result + filters.hashCode()
        result = 31 * result + roleId.hashCode()
        result = 31 * result + aggregationType.hashCode()
        return result
    }

    override fun toString(): String {
        return "TokenOwnershipRole(id=$id, acceptedAssets=$acceptedAssets, minimumTokenQuantity=$minimumTokenQuantity, maximumTokenQuantity=$maximumTokenQuantity, filters=$filters, roleId=$roleId, aggregationType=$aggregationType)"
    }

}