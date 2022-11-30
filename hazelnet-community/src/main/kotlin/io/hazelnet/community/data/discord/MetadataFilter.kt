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

    companion object {
        fun findAttribute(
            metadata: String,
            attributePath: String,
        ): Any? {
            return try {
                val useAttributePath = fixupAttributePath(attributePath)
                JsonPath.read<Any>(metadata, "$.${useAttributePath}")
            } catch (pnfe: PathNotFoundException) {
                null
            }
        }

        private fun fixupAttributePath(attributeName: String): String {
            val useAttributePath = if (attributeName.startsWith("$.")) attributeName.substring(2) else attributeName
            if (useAttributePath.matches(Regex("^[ A-Za-z0-9]+$")) && useAttributePath.contains(" ")) {
                return "[\"${useAttributePath}\"]"
            }
            return useAttributePath
        }
    }
}