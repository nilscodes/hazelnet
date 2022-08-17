package io.hazelnet.community.data.cardano.metadata

class RegexOperatorAlgorithm: OperatorAlgorithm {
    override fun checkSingleValue(value: String, searchFor: String) = searchFor.toRegex().containsMatchIn(value)
}