package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import io.hazelnet.community.data.AttributeOperatorType
import org.springframework.lang.NonNull
import javax.persistence.*
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_token_role_filters")
class TokenRoleMetadataFilter @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "metadata_filter_id")
    var id: Long?,

    @Column(name = "attribute_name")
    @field:NonNull
    @field:Size(min = 1, max = 64)
    var attributeName: String,

    @Column(name = "operator")
    @field:NonNull
    var operator: AttributeOperatorType,

    @Column(name = "attribute_value")
    @field:NonNull
    @field:Size(min = 1, max = 128)
    var attributeValue: String,

    ): MetadataFilter() {

    fun apply(metadata: String) = super.apply(metadata, attributeName, operator, attributeValue)

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as TokenRoleMetadataFilter

        if (id != other.id) return false
        if (attributeName != other.attributeName) return false
        if (operator != other.operator) return false
        if (attributeValue != other.attributeValue) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + attributeName.hashCode()
        result = 31 * result + operator.hashCode()
        result = 31 * result + attributeValue.hashCode()
        return result
    }

    override fun toString(): String {
        return "MetadataFilter(id=$id, attributeName='$attributeName', operator=$operator, attributeValue='$attributeValue')"
    }

}