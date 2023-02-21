package io.hazelnet.community.data.discord

import io.hazelnet.community.data.AttributeOperatorType
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

internal class TokenOwnershipRoleTest {
    @Test
    fun meetsFilterCriteria() {
        val matchingFilter1 = TokenRoleMetadataFilter(0, "name", AttributeOperatorType.CONTAINS, "01813")
        val matchingFilter2 = TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.EQUALS, "Drowsy")
        val nonMatchingFilter = TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.NOTEQUALS, "Drowsy")
        val matchingWeightedFilter1 = TokenRoleMetadataFilter(0, "name", AttributeOperatorType.CONTAINS, "01813", 3)

        val matchingRole = TokenOwnershipRole(1, mutableSetOf(), 1, null, mutableSetOf(matchingFilter1, matchingFilter2), 1)
        assertEquals(Pair(true, 1), matchingRole.meetsFilterCriteria(METADATA_TAVERNSQUAD_1))
        val nonMatchingRole = TokenOwnershipRole(1, mutableSetOf(), 1, null, mutableSetOf(matchingFilter1, matchingFilter2, nonMatchingFilter), 1)
        assertEquals(Pair(false, 1), nonMatchingRole.meetsFilterCriteria(METADATA_TAVERNSQUAD_1))
        val weightedMatchingRole = TokenOwnershipRole(1, mutableSetOf(), 1, null, mutableSetOf(matchingWeightedFilter1, matchingFilter2, nonMatchingFilter), 1, TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR)
        assertEquals(Pair(true, 3), weightedMatchingRole.meetsFilterCriteria(METADATA_TAVERNSQUAD_1))
        val weightIgnoredOnAndPolicyAggregationType = TokenOwnershipRole(1, mutableSetOf(), 1, null, mutableSetOf(matchingWeightedFilter1), 1, TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND)
        assertEquals(Pair(true, 1), weightIgnoredOnAndPolicyAggregationType.meetsFilterCriteria(METADATA_TAVERNSQUAD_1))
    }
}