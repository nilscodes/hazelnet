package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import org.springframework.cache.annotation.CacheConfig
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
@CacheConfig(cacheNames = ["stakepools", "delegation"])
class StakepoolService(
        private val connectService: ConnectService
) {
    @Cacheable(key = "'all'", cacheNames = ["stakepools"])
    fun getStakepools(): Map<String, StakepoolInfo> {
        return connectService
                .getStakepools()
                .associateBy { it.hash }
    }

    @Scheduled(fixedDelay = 600000)
    @CacheEvict(key = "'all'", cacheNames = ["stakepools"])
    fun clearStakepoolCache() {
        // Annotation-based cache clearing
    }

    @Scheduled(fixedDelay = 3600000)
    @CacheEvict(allEntries = true, cacheNames = ["delegation"])
    fun clearDelegationCache() {
        // Annotation-based cache clearing
    }

    @Cacheable(cacheNames = ["delegation"])
    fun getDelegation(poolHash: String) = connectService.getActiveDelegationForPools(listOf(poolHash))
}