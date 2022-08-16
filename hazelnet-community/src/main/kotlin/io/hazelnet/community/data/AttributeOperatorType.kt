package io.hazelnet.community.data

import io.hazelnet.community.data.cardano.metadata.*

enum class AttributeOperatorType {
    EQUALS {
        override fun makeAlgorithm() = EqualsOperatorAlgorithm()
    },
    NOTEQUALS {
        override fun makeAlgorithm() = NotEqualsOperatorAlgorithm()
    },
    CONTAINS {
        override fun makeAlgorithm() = ContainsOperatorAlgorithm()
    },
    NOTCONTAINS {
        override fun makeAlgorithm() = NotContainsOperatorAlgorithm()
    },
    STARTSWITH {
        override fun makeAlgorithm() = StartsWithOperatorAlgorithm()
    },
    ENDSWITH {
        override fun makeAlgorithm() = EndsWithOperatorAlgorithm()
    },
    REGEX {
        override fun makeAlgorithm() = RegexOperatorAlgorithm()
    };

    abstract fun makeAlgorithm(): OperatorAlgorithm
}