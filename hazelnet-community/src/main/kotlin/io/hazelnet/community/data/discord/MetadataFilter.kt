package io.hazelnet.community.data.discord

import com.jayway.jsonpath.JsonPath
import com.jayway.jsonpath.PathNotFoundException
import io.hazelnet.community.data.AttributeOperatorType

open class MetadataFilter {

    protected fun apply(
        metadata: String,
        attributeName: String,
        operator: AttributeOperatorType,
        attributeValue: String,
    ): Boolean {
        val valueToCheck = findAttribute(metadata, attributeName)
        if (valueToCheck != null) {
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
        metadata: String,
        attributeName: String,
    ): Any? {
        return try {
            val attributePath = if (attributeName.startsWith("$.")) attributeName.substring(2) else attributeName
            JsonPath.read<Any>(metadata, "$.${attributePath}")
        } catch (pnfe: PathNotFoundException) {
            null
        }
    }
}