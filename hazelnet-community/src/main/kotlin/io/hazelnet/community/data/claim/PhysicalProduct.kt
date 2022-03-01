package io.hazelnet.community.data.claim

import com.fasterxml.jackson.annotation.JsonCreator
import io.hazelnet.community.persistence.data.GenericMapUserType
import org.hibernate.annotations.Type
import org.hibernate.annotations.TypeDef
import org.springframework.lang.NonNull
import javax.persistence.*
import javax.validation.constraints.Size

@Entity
@Table(name = "physical_products")
@TypeDef(name = "GenericMapUserType", typeClass = GenericMapUserType::class)
class PhysicalProduct @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    var id: Int?,

    @Column(name = "product_name")
    @field:NonNull
    @field:Size(min = 1, max = 200)
    var name: String,

    @Suppress("JpaAttributeTypeInspection")
    @Column(name = "product_variations")
    @Type(type = "GenericMapUserType")
    var variations: Map<String, Any>?,
) {

}