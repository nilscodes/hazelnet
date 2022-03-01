package io.hazelnet.external.services

import io.hazelnet.external.data.claim.AnonymousPhysicalOrder
import io.hazelnet.external.data.claim.PhysicalProduct
import org.springframework.stereotype.Service

@Service
class ClaimListService(
        private val communityService: CommunityService
) {
    fun getClaimListOrders(guildId: Long, claimListName: String): List<AnonymousPhysicalOrder> {
        return communityService.getClaimListOrders(guildId, claimListName)
    }

    fun getClaimListProducts(guildId: Long, claimListName: String): List<PhysicalProduct> {
        return communityService.getClaimListProducts(guildId, claimListName)
    }

}