package io.hazelnet.community.data.cardano.metadata

class NotContainsOperatorAlgorithm: OperatorAlgorithm {
    override fun checkSingleValue(value: String, searchFor: String) = !value.contains(searchFor)

    override fun <T> checkIterable(value: Iterable<T>, searchFor: String): Boolean {
        return value.all { it.toString() != searchFor }
    }
}