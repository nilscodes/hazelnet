package io.hazelnet.community.data.claim

import com.fasterxml.jackson.annotation.JsonCreator
import io.hazelnet.community.persistence.data.GenericMapUserType
import org.hibernate.annotations.Type
import org.hibernate.annotations.TypeDef
import org.springframework.lang.NonNull
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.Min

@Embeddable
@TypeDef(name = "GenericMapUserType", typeClass = GenericMapUserType::class)
class PhysicalOrderItem @JsonCreator constructor(
    @Column(name = "product_id")
    @field:NonNull
    @field:Min(1)
    var productId: Int,

    @Column(name = "product_count")
    @field:NonNull
    @field:Min(1)
    var count: Int,

    @Suppress("JpaAttributeTypeInspection")
    @Column(name = "product_variation")
    @Type(type = "GenericMapUserType")
    var variation: Map<String, Any>? = null,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as PhysicalOrderItem

        if (productId != other.productId) return false
        if (count != other.count) return false
        if (variation != other.variation) return false

        return true
    }

    override fun hashCode(): Int {
        var result = productId
        result = 31 * result + count
        result = 31 * result + variation.hashCode()
        return result
    }

    override fun toString(): String {
        return "PhysicalOrderItem(productId=$productId, count=$count, variation=$variation)"
    }

}