package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.drep.DRepInfo
import org.springframework.cache.annotation.CacheConfig
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
@CacheConfig(cacheNames = ["dreps"])
class DRepService(
        private val connectService: ConnectService
) {
    @Cacheable(key = "'all'", cacheNames = ["dreps"])
    fun getDReps(): Map<String, DRepInfo> {
        return connectService
                .getDReps()
                .associateBy { it.hash }
    }

    @Scheduled(fixedDelay = 600000)
    @CacheEvict(key = "'all'", cacheNames = ["dreps"])
    fun clearDRepCache() {
        // Annotation-based cache clearing
    }

}