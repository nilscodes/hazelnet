package io.hazelnet.community.data.discord

import io.hazelnet.community.data.AttributeOperatorType
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

internal class TokenOwnershipRoleTest {
    @Test
    fun meetsFilterCriteria() {
        val matchingFilter1 = TokenRoleMetadataFilter(0, "name", AttributeOperatorType.CONTAINS, "01813")
        val matchingFilter2 = TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.EQUALS, "Drowsy")
        val nonMatchingFilter = TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.NOTEQUALS, "Drowsy")

        val matchingRole = TokenOwnershipRole(1, mutableSetOf(), 1, null, mutableSetOf(matchingFilter1, matchingFilter2), 1)
        assertTrue(matchingRole.meetsFilterCriteria(METADATA_TAVERNSQUAD_1))
        val nonMatchingRole = TokenOwnershipRole(1, mutableSetOf(), 1, null, mutableSetOf(matchingFilter1, matchingFilter2, nonMatchingFilter), 1)
        assertFalse(nonMatchingRole.meetsFilterCriteria(METADATA_TAVERNSQUAD_1))
    }
}