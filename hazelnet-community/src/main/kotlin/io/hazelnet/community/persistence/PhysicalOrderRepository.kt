package io.hazelnet.community.persistence

import io.hazelnet.community.data.claim.PhysicalOrder
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface PhysicalOrderRepository: CrudRepository<PhysicalOrder, Int> {
    fun findByClaimListId(claimListId: Int): List<PhysicalOrder>
    fun findByIdAndClaimListId(orderId: Int, claimListId: Int): Optional<PhysicalOrder>
    fun findByClaimListIdAndExternalAccountId(claimListId: Int, externalAccountId: Long): Optional<PhysicalOrder>
}