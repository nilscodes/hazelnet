package io.hazelnet.community.data.claim

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIdentityInfo
import com.fasterxml.jackson.annotation.JsonIdentityReference
import com.fasterxml.jackson.annotation.ObjectIdGenerators
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.cardano.Stakepool
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.*
import javax.validation.Valid
import javax.validation.constraints.Min
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "physical_orders")
class PhysicalOrder @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    var id: Int?,

    @Column(name = "external_account_id")
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var externalAccountId: Long,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "order_creation", updatable = false)
    var createTime: Date?,

    @Column(name = "claim_list_id")
    var claimListId: Int,

    @Column(name = "ship_to_name")
    @field:NonNull
    @field:Size(min = 1, max = 200)
    var shipTo: String,

    @Column(name = "country")
    @field:NonNull
    @field:Size(min = 1, max = 100)
    var country: String,

    @Column(name = "phone")
    @field:Size(min = 1, max = 30)
    var phone: String?,

    @Column(name = "zip")
    @field:Size(min = 1, max = 30)
    @field:NonNull
    var zipCode: String,

    @Column(name = "city")
    @field:Size(min = 1, max = 200)
    @field:NonNull
    var city: String,

    @Column(name = "street")
    @field:Size(min = 1, max = 500)
    @field:NonNull
    var street: String,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "physical_orders_items", joinColumns = [JoinColumn(name = "order_id")])
    @field:Valid
    var items: MutableList<PhysicalOrderItem> = mutableListOf(),

    @Column(name = "processed")
    var processed: Boolean = false,

    @Column(name = "tracking_number")
    @field:Size(min = 1, max = 200)
    var trackingNumber: String?,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as PhysicalOrder

        if (id != other.id) return false
        if (externalAccountId != other.externalAccountId) return false
        if (createTime != other.createTime) return false
        if (claimListId != other.claimListId) return false
        if (shipTo != other.shipTo) return false
        if (country != other.country) return false
        if (phone != other.phone) return false
        if (zipCode != other.zipCode) return false
        if (city != other.city) return false
        if (street != other.street) return false
        if (items != other.items) return false
        if (processed != other.processed) return false
        if (trackingNumber != other.trackingNumber) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + externalAccountId.hashCode()
        result = 31 * result + (createTime?.hashCode() ?: 0)
        result = 31 * result + claimListId
        result = 31 * result + shipTo.hashCode()
        result = 31 * result + country.hashCode()
        result = 31 * result + phone.hashCode()
        result = 31 * result + zipCode.hashCode()
        result = 31 * result + city.hashCode()
        result = 31 * result + street.hashCode()
        result = 31 * result + items.hashCode()
        result = 31 * result + processed.hashCode()
        result = 31 * result + (trackingNumber?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "PhysicalOrder(id=$id, externalAccountId=$externalAccountId, createTime=$createTime, claimListId=$claimListId, shipTo='$shipTo', country='$country', phone='$phone', zipCode='$zipCode', city='$city', street='$street', items=$items, processed=$processed, trackingNumber=$trackingNumber)"
    }

}