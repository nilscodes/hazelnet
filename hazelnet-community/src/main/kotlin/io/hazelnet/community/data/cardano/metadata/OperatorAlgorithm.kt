package io.hazelnet.community.data.cardano.metadata

interface OperatorAlgorithm {
    fun <T> checkIterable(value: Iterable<T>, searchFor: String): Boolean {
        return value.any { checkSingleValue(it.toString(), searchFor) }
    }
    fun checkSingleValue(value: String, searchFor: String): Boolean
}