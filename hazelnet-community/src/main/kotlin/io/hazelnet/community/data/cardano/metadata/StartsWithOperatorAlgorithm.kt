package io.hazelnet.community.data.cardano.metadata

class StartsWithOperatorAlgorithm: OperatorAlgorithm {
    override fun checkSingleValue(value: String, searchFor: String) = value.startsWith(searchFor)
}