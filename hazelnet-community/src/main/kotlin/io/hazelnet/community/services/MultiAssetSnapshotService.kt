package io.hazelnet.community.services

import io.hazelnet.community.data.cardano.MultiAssetSnapshot
import io.hazelnet.community.data.cardano.MultiAssetSnapshotEntry
import io.hazelnet.community.persistence.MultiAssetSnapshotRepository
import mu.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClientResponseException
import java.time.ZonedDateTime
import java.util.*

private val logger = KotlinLogging.logger {}

@Service
class MultiAssetSnapshotService(
    private val multiAssetSnapshotRepository: MultiAssetSnapshotRepository,
    private val externalAccountService: ExternalAccountService,
    private val connectService: ConnectService
) {
    fun scheduleSnapshot(multiAssetSnapshot: MultiAssetSnapshot): MultiAssetSnapshot
    {
        multiAssetSnapshot.createTime = Date.from(ZonedDateTime.now().toInstant())
        return multiAssetSnapshotRepository.save(multiAssetSnapshot)
    }

    fun getSnapshot(snapshotId: Int): MultiAssetSnapshot = multiAssetSnapshotRepository.findById(snapshotId).orElseThrow()
    fun getAssetFingerprintForSnapshot(snapshotId: Int) = multiAssetSnapshotRepository.getAssetFingerprintForSnapshot(snapshotId)

    fun getTokenWeightOfExternalAccount(snapshotIds: Set<Int>, externalAccountId: Long, weighted: Boolean): Long {
        val verifiedStakeAddresses =
            externalAccountService.getVerifiedStakeAddressesForExternalAccount(externalAccountId)
        val totalWeight = snapshotIds.sumOf { snapshotId ->
            val snapshot = this.getSnapshot(snapshotId)
            val totalOwnedTokens = snapshot.data
                .filter { verifiedStakeAddresses.contains(it.stakeAddress) }
                .sumOf { it.tokenQuantity * snapshot.tokenWeight }.toLong()
            if (weighted) {
                totalOwnedTokens
            } else if (totalOwnedTokens > 0) {
                1L
            } else {
                0L
            }
        }
        return if (weighted) {
            totalWeight
        } else if (totalWeight > 0) {
            1L
        } else {
            0L
        }
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 5000)
    fun runSnapshots() {
        val dueSnapshots = multiAssetSnapshotRepository.findAllDueSnapshots(Date())
        dueSnapshots.forEach {
            val policyIdWithOptionalAssetFingerprint =  it.policyId + (it.assetFingerprint ?: "")
            logger.info { "Taking snapshot with ID ${it.id} scheduled for ${it.createTime}, with policy/asset combination $policyIdWithOptionalAssetFingerprint" }
            try {
                val snapshotData =
                    connectService.getTokenSnapshotByPolicyId(setOf(policyIdWithOptionalAssetFingerprint))
                it.data = snapshotData.map { tokenOwnershipInfo ->  MultiAssetSnapshotEntry(tokenOwnershipInfo.stakeAddress, tokenOwnershipInfo.assetCount) }.toMutableSet()
                it.taken = true
                multiAssetSnapshotRepository.save(it)
            } catch (e: WebClientResponseException) {
                logger.error(e) { "Error retrieving snapshot data for ${it.id}" }
            }
        }
    }
}