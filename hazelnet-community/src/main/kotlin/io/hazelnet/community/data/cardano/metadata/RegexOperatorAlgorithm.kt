package io.hazelnet.community.data.cardano.metadata

import mu.KotlinLogging
import java.util.regex.PatternSyntaxException

private val logger = KotlinLogging.logger {}

class RegexOperatorAlgorithm: OperatorAlgorithm {
    override fun checkSingleValue(value: String, searchFor: String): Boolean {
        return try {
            searchFor.toRegex().containsMatchIn(value)
        } catch(e: PatternSyntaxException) {
            logger.info(e) { "Error evaluating metadata filter algorithm with regular expression $searchFor. Returning true to ignore filter." }
            true
        }
    }
}