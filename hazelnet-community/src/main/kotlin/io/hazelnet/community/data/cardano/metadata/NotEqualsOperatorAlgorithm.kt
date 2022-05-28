package io.hazelnet.community.data.cardano.metadata

class NotEqualsOperatorAlgorithm: OperatorAlgorithm {
    override fun checkSingleValue(value: String, searchFor: String) = value != searchFor
}