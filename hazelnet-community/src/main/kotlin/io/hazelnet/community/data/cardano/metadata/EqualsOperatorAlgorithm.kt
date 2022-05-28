package io.hazelnet.community.data.cardano.metadata

class EqualsOperatorAlgorithm: OperatorAlgorithm {
    override fun checkSingleValue(value: String, searchFor: String) = value == searchFor
}