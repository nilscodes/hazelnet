package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.HandleUtil
import io.hazelnet.cardano.connect.data.PolicyIdsAndExcludedAssets
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
@CacheConfig(cacheNames = ["tokenmetadata", "besthandleforstake", "policyinfo"])
class TokenService(
    @Value("\${io.hazelnet.connect.cardano.handlepolicy}")
    private val handlePolicy: String,
    private val tokenDao: TokenDao,
    private val handleService: HandleService,
) {
    fun getMultiAssetCountsForStakeAddress(
        stakeAddress: String,
        policyIdsAndExcludedAssets: PolicyIdsAndExcludedAssets,
    ): List<TokenOwnershipInfoWithAssetCount> {
        if (policyIdsAndExcludedAssets.policyIdsWithOptionalAssetFingerprint.isEmpty()) {
            return tokenDao.getMultiAssetCountsForStakeAddress(stakeAddress)
        }
        val allTokenOwnershipInfoWithAssetCount = mutableListOf<TokenOwnershipInfoWithAssetCount>()
        val (purePolicyIds, policyIdsWithAssetFingerprint) = extractTokenConstraints(
            policyIdsAndExcludedAssets.policyIdsWithOptionalAssetFingerprint
        )
        if (purePolicyIds.isNotEmpty()) {
            allTokenOwnershipInfoWithAssetCount.addAll(
                tokenDao.getMultiAssetCountsWithPolicyIdForStakeAddress(
                    stakeAddress,
                    purePolicyIds,
                    policyIdsAndExcludedAssets.excludedAssetFingerprints.map { AssetFingerprint(it) },
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


    @Cacheable(cacheNames = ["besthandleforstake"])
    fun findBestHandleForStakeAddress(stakeAddress: String): Handle {
        val shortestHandle = getMultiAssetListForStakeAddress(stakeAddress, listOf(handlePolicy))
            .find { it.policyIdWithOptionalAssetFingerprint == handlePolicy }
            ?.assetList
                ?.map {
                    val cip68Token = Cip68Token(it)
                    if (cip68Token.isValidCip68Token()) {
                        cip68Token.assetName
                    } else {
                        it.decodeHex()
                    }
                }
                ?.minByOrNull { it.length }
        return if (shortestHandle != null) {
            handleService.resolveHandle(shortestHandle)
        } else {
            Handle(handle = "", nftTokenNameHex = "", resolved = false)
        }
    }

    fun findHandlesForStakeAddress(stakeAddress: String): List<Handle> {
        return getMultiAssetListForStakeAddress(stakeAddress, listOf(handlePolicy))
            .filter { it.policyIdWithOptionalAssetFingerprint == handlePolicy }
            .map { it.assetList }
            .flatten()
            .map { HandleUtil.getHandle(handlePolicy, it) }
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

    fun getMultiAssetInfoForAssetFingerprint(assetFingerprint: String): MultiAssetInfo {
        return tokenDao.getMultiAssetInfoForAssetFingerprint(AssetFingerprint(assetFingerprint));
    }

    @Cacheable(cacheNames = ["policyinfo"], unless = "#result == null")
    fun getPolicyInfo(policyId: String) = tokenDao.getPolicyInfo(policyId)

    @Scheduled(fixedDelay = 6 * 60 * 60 * 1000)
    @CacheEvict(allEntries = true, cacheNames = ["tokenmetadata"], )
    fun clearMultiAssetInfoCache() {
        // Annotation-based cache clearing of asset info every 6 hours in case metadata changes
    }

    @Scheduled(fixedDelay = 60 * 60 * 1000)
    @CacheEvict(allEntries = true, cacheNames = ["besthandleforstake"], )
    fun clearHandleToStakeAddressCache() {
        // Annotation-based cache clearing of handle info every hour in case handle moves
    }

    @Scheduled(fixedDelay = 60 * 1000)
    @CacheEvict(allEntries = true, cacheNames = ["policyinfo"], )
    fun clearPolicyInfoCache() {
        // Annotation-based cache clearing of policy info every minute
    }

}