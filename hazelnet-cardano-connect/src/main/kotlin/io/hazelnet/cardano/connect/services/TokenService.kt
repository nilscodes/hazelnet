package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.address.Handle
import io.hazelnet.cardano.connect.data.token.*
import io.hazelnet.cardano.connect.persistence.token.TokenDao
import io.hazelnet.cardano.connect.util.PolicyTools
import io.hazelnet.shared.decodeHex
import org.springframework.beans.factory.annotation.Value
import org.springframework.cache.annotation.CacheConfig
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
@CacheConfig(cacheNames = ["tokenmetadata", "handleforstake"])
class TokenService(
    @Value("\${io.hazelnet.connect.cardano.handlepolicy}")
    private val handlePolicy: String,
    private val tokenDao: TokenDao,
    private val handleService: HandleService,
) {
    fun getMultiAssetCountsForStakeAddress(
        stakeAddress: String,
        policyIdsWithOptionalAssetFingerprint: List<String>
    ): List<TokenOwnershipInfoWithAssetCount> {
        if (policyIdsWithOptionalAssetFingerprint.isEmpty()) {
            return tokenDao.getMultiAssetCountsForStakeAddress(stakeAddress)
        }
        val allTokenOwnershipInfoWithAssetCount = mutableListOf<TokenOwnershipInfoWithAssetCount>()
        val (purePolicyIds, policyIdsWithAssetFingerprint) = extractTokenConstraints(
            policyIdsWithOptionalAssetFingerprint
        )
        if (purePolicyIds.isNotEmpty()) {
            allTokenOwnershipInfoWithAssetCount.addAll(
                tokenDao.getMultiAssetCountsWithPolicyIdForStakeAddress(
                    stakeAddress,
                    purePolicyIds
                )
            )
        }
        if (policyIdsWithAssetFingerprint.isNotEmpty()) {
            allTokenOwnershipInfoWithAssetCount.addAll(
                tokenDao.getMultiAssetCountsWithPolicyIdAndAssetFingerprintForStakeAddress(
                    stakeAddress,
                    policyIdsWithAssetFingerprint
                )
            )
        }

        return allTokenOwnershipInfoWithAssetCount
    }

    // TODO Think about how to reuse the same method above
    fun getMultiAssetListForStakeAddress(
        stakeAddress: String,
        policyIdsWithOptionalAssetFingerprint: List<String>
    ): List<TokenOwnershipInfoWithAssetList> {
        if (policyIdsWithOptionalAssetFingerprint.isEmpty()) {
            return tokenDao.getMultiAssetListForStakeAddress(stakeAddress)
        }
        val allTokenOwnershipInfoWithAssetList = mutableListOf<TokenOwnershipInfoWithAssetList>()
        val (purePolicyIds, policyIdsWithAssetFingerprint) = extractTokenConstraints(
            policyIdsWithOptionalAssetFingerprint
        )
        if (purePolicyIds.isNotEmpty()) {
            allTokenOwnershipInfoWithAssetList.addAll(
                tokenDao.getMultiAssetListWithPolicyIdForStakeAddress(
                    stakeAddress,
                    purePolicyIds
                )
            )
        }
        if (policyIdsWithAssetFingerprint.isNotEmpty()) {
            allTokenOwnershipInfoWithAssetList.addAll(
                tokenDao.getMultiAssetListWithPolicyIdAndAssetFingerprintForStakeAddress(
                    stakeAddress,
                    policyIdsWithAssetFingerprint
                )
            )
        }

        return allTokenOwnershipInfoWithAssetList
    }

    fun getMultiAssetCountStakeSnapshot(
        policyIdsWithOptionalAssetFingerprint: List<String>
    ): List<TokenOwnershipInfoWithAssetCount> {
        if (policyIdsWithOptionalAssetFingerprint.isEmpty()) {
            throw IllegalArgumentException("Cannot retrieve a multi asset snapshot without providing at least one policy ID")
        }
        val allTokenOwnershipInfoWithAssetCount = mutableListOf<TokenOwnershipInfoWithAssetCount>()
        val (purePolicyIds, policyIdsWithAssetFingerprint) = extractTokenConstraints(
            policyIdsWithOptionalAssetFingerprint
        )
        if (purePolicyIds.isNotEmpty()) {
            allTokenOwnershipInfoWithAssetCount.addAll(
                tokenDao.getMultiAssetCountSnapshotForPolicyId(
                    purePolicyIds
                )
            )
        }
        if (policyIdsWithAssetFingerprint.isNotEmpty()) {
            allTokenOwnershipInfoWithAssetCount.addAll(
                tokenDao.getMultiAssetCountSnapshotForPolicyIdAndAssetFingerprint(
                    policyIdsWithAssetFingerprint
                )
            )
        }

        return allTokenOwnershipInfoWithAssetCount
    }


    @Cacheable(cacheNames = ["handleforstake"])
    fun findBestHandleForStakeAddress(stakeAddress: String): Handle {
        val shortestHandle = getMultiAssetListForStakeAddress(stakeAddress, listOf(handlePolicy))
            .find { it.policyIdWithOptionalAssetFingerprint == handlePolicy }
            ?.assetList?.minByOrNull { it.length }
        return if (shortestHandle != null) {
            handleService.resolveHandle(shortestHandle)
        } else {
            Handle(handle = "", resolved = false)
        }
    }

    private fun extractTokenConstraints(policyIdsWithOptionalAssetFingerprint: List<String>): Pair<List<PolicyId>, List<Pair<PolicyId, AssetFingerprint>>> {
        val purePolicyIds =
            policyIdsWithOptionalAssetFingerprint.filter { PolicyTools.isPolicyId(it) }.map { PolicyId(it) }
        val policyIdsWithAssetFingerprint =
            policyIdsWithOptionalAssetFingerprint.filter { !PolicyTools.isPolicyId(it) }
                .map { Pair(PolicyId(it.substring(0, 56)), AssetFingerprint(it.substring(56))) }
        return Pair(purePolicyIds, policyIdsWithAssetFingerprint)
    }

    fun getWalletForAsset(assetFingerprint: String) = tokenDao.getWalletForAsset(AssetFingerprint(assetFingerprint))

    @Cacheable(cacheNames = ["tokenmetadata"], unless = "#result == null")
    fun getMultiAssetInfo(policyId: String, assetNameHex: String): MultiAssetInfo {
        return tokenDao.getMultiAssetInfo(policyId, assetNameHex.decodeHex());
    }

    @Scheduled(fixedDelay = 6 * 60 * 60 * 1000)
    @CacheEvict(allEntries = true, cacheNames = ["tokenmetadata"], )
    fun clearMultiAssetInfoCache() {
        // Annotation-based cache clearing of asset info every 6 hours in case metadata changes
    }

    @Scheduled(fixedDelay = 60 * 60 * 1000)
    @CacheEvict(allEntries = true, cacheNames = ["handleforstake"], )
    fun clearHandleToStakeAddressCache() {
        // Annotation-based cache clearing of handle info every hour in case handle moves
    }

}