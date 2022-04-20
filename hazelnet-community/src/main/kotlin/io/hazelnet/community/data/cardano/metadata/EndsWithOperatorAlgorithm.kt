package io.hazelnet.community.data.cardano.metadata

class EndsWithOperatorAlgorithm: OperatorAlgorithm {
    override fun checkSingleValue(value: String, searchFor: String) = value.endsWith(searchFor)
}