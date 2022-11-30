package io.hazelnet.community.data.discord

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

internal class MetadataFilterTest
{
    @Test
    fun `attribute finding automatically fixes certain erroneous cases`()
    {
        assertEquals("Orange", MetadataFilter.findAttribute("{\"Planet colour\":\"Orange\"}", "Planet colour"))
    }
}