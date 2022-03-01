package io.hazelnet.community.services

import io.hazelnet.community.data.claim.ClaimList
import io.hazelnet.community.data.claim.PhysicalOrder
import io.hazelnet.community.data.claim.PhysicalOrderItem
import io.hazelnet.community.data.claim.PhysicalProduct
import io.hazelnet.community.persistence.ClaimListRepository
import io.hazelnet.community.persistence.PhysicalOrderRepository
import io.hazelnet.community.persistence.PhysicalProductRepository
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*
import javax.transaction.Transactional
import kotlin.NoSuchElementException

@Service
class ClaimListService(
    private val claimListRepository: ClaimListRepository,
    private val physicalProductRepository: PhysicalProductRepository,
    private val physicalOrderRepository: PhysicalOrderRepository,
    private val externalAccountService: ExternalAccountService,
) {
    fun getProduct(productId: Int) = physicalProductRepository.findById(productId)
    fun getProducts(productIds: List<Int>) = physicalProductRepository.findAllById(productIds)
    fun addPhysicalProduct(physicalProduct: PhysicalProduct) = physicalProductRepository.save(physicalProduct)

    fun getClaimList(claimListId: Int) = claimListRepository.findById(claimListId)
    fun addClaimList(claimList: ClaimList): ClaimList {
        claimList.createTime = Date.from(ZonedDateTime.now().toInstant())
        return claimListRepository.save(claimList)
    }

    fun getPhysicalOrders(claimListId: Int) = physicalOrderRepository.findByClaimListId(claimListId)
    fun getPhysicalOrder(claimListId: Int, orderId: Int): PhysicalOrder {
        val physicalOrder = physicalOrderRepository.findByIdAndClaimListId(orderId, claimListId)
        if (physicalOrder.isPresent) {
            return physicalOrder.get()
        }
        throw NoSuchElementException("No physical order for claim list with ID $claimListId and order ID $orderId found")
    }

    @Transactional
    fun addAndVerifyPhysicalOrder(claimListId: Int, physicalOrder: PhysicalOrder): PhysicalOrder {
        val optionalClaimList = getClaimList(claimListId)
        val claimList = optionalClaimList.orElseThrow { NoSuchElementException("No claim list with ID $claimListId found when adding a physical order") }
        val existingOrderForUser = physicalOrderRepository.findByClaimListIdAndExternalAccountId(claimListId, physicalOrder.externalAccountId)
        if (existingOrderForUser.isEmpty || !existingOrderForUser.get().processed) {
            physicalOrder.createTime = Date.from(ZonedDateTime.now().toInstant())
            physicalOrder.claimListId = claimList.id!!
            val confirmedStakeAddressesOfUser =
                externalAccountService.getExternalAccountVerifications(physicalOrder.externalAccountId)
                    .filter { it.confirmed }
                    .mapNotNull { it.cardanoStakeAddress }
            this.verifyPhysicalOrder(claimList, physicalOrder, confirmedStakeAddressesOfUser)
            if (existingOrderForUser.isPresent) {
                physicalOrderRepository.delete(existingOrderForUser.get())
            }
            val newOrder = physicalOrderRepository.save(physicalOrder)
            claimList.claims
                .filter { confirmedStakeAddressesOfUser.contains(it.stakeAddress) }
                .forEach { it.orderId = newOrder.id }
            claimListRepository.save(claimList)
            return newOrder
        }
        throw IllegalArgumentException("Cannot submit a new order for user ${physicalOrder.externalAccountId} on claim list ${claimList.id} since there is already a processed order with ID ${existingOrderForUser.get().id}")
    }

    private fun verifyPhysicalOrder(claimList: ClaimList, physicalOrder: PhysicalOrder, confirmedStakeAddressesOfUser: List<String>) {
        val orderedProducts = getOrderedProducts(physicalOrder.items)
        val availableProducts = getAvailableProducts(claimList, physicalOrder.externalAccountId, confirmedStakeAddressesOfUser)
        orderedProducts.forEach { (product, count) ->
            if (count > (availableProducts[product] ?: 0)) {
                throw IllegalArgumentException("More products ordered than available for order. Ordered $orderedProducts but only $availableProducts available")
            }
        }
    }

    fun getAvailableProducts(claimList: ClaimList, externalAccountId: Long, confirmedStakeAddressesOfUser: List<String>): Map<Int, Int> {
        return claimList.claims
            .filter { confirmedStakeAddressesOfUser.contains(it.stakeAddress) }
            .groupBy({ it.claimableProduct }, { it.claimableCount })
            .mapValues { (_, values) -> values.sum() }
    }

    fun getOrderedProducts(items: List<PhysicalOrderItem>): Map<Int, Int> {
        return items
            .groupBy({ it.productId }, { it.count })
            .mapValues { (_, values) -> values.sum() }
    }

    fun getClaimListsOfDiscordServer(discordServerId: Int) = claimListRepository.findByDiscordServer(discordServerId)
    fun getPhysicalOrderForUser(claimListId: Int, externalAccountId: Long): PhysicalOrder {
        return physicalOrderRepository.findByClaimListIdAndExternalAccountId(claimListId, externalAccountId)
            .orElseThrow { NoSuchElementException("No orders found for claim list $claimListId and user $externalAccountId")}
    }



}