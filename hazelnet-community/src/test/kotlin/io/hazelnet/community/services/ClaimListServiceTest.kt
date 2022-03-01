package io.hazelnet.community.services

import io.hazelnet.community.data.claim.PhysicalOrderItem
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class ClaimListServiceTest {

    @Test
    fun getOrderedProducts() {
        val claimListService = ClaimListService(mockk(), mockk(), mockk(), mockk())
        assertEquals(mapOf(
            Pair(5, 6),
            Pair(25, 1),
        ), claimListService.getOrderedProducts(listOf(
            PhysicalOrderItem(5, 3),
            PhysicalOrderItem(5, 2),
            PhysicalOrderItem(5, 1),
            PhysicalOrderItem(25, 1),
        )))
    }
}