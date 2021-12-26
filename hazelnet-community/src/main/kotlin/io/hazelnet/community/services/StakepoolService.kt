package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import org.springframework.cache.annotation.CacheConfig
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
@CacheConfig(cacheNames = ["stakepools"])
class StakepoolService(
        private val connectService: ConnectService
) {
    @Cacheable
    fun getStakepools(): Map<String, StakepoolInfo> {
        return connectService
                .getStakepools()
                .associateBy { it.hash }
    }

    @Scheduled(fixedDelay = 600000)
    @CacheEvict(allEntries = true)
    fun clearStakepoolCache() {
        // Annotation-based cache clearing
    }
}