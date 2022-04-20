package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import com.jayway.jsonpath.JsonPath
import com.jayway.jsonpath.PathNotFoundException
import io.hazelnet.community.data.AttributeOperatorType
import org.springframework.lang.NonNull
import javax.persistence.*
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_token_role_filters")
class MetadataFilter @JsonCreator constructor(
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

    ) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as MetadataFilter

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

    fun apply(metadata: String): Boolean {
        val valueToCheck = findAttribute(metadata)
        if (valueToCheck != null)
        {
            val operatorAlgorithm = operator.makeAlgorithm()
            return if (valueToCheck is Iterable<*>) {
                operatorAlgorithm.checkIterable(valueToCheck, attributeValue)
            } else {
                operatorAlgorithm.checkSingleValue(valueToCheck.toString(), attributeValue)
            }
        }
        return false
    }

    private fun findAttribute(
        metadata: String
    ): Any? {
        return try {
            JsonPath.read<Any>(metadata, "$.${attributeName}")
        } catch(pnfe: PathNotFoundException) {
            null
        }
    }

}