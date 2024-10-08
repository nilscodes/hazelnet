package io.hazelnet.community.services.external

import io.hazelnet.cardano.connect.util.toHex
import io.hazelnet.community.data.external.tokenregistry.TokenMetadata
import io.hazelnet.community.services.ConnectService
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.http.HttpStatus
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import reactor.core.publisher.Mono

@Service
class CardanoTokenRegistryService(
    @Qualifier("tokenRegistryClient")
    private val tokenRegistryClient: WebClient,
    private val connectService: ConnectService,
) {
    private fun getTokenMetadata(policyId: String, assetNameHex: String): TokenMetadata? {
        val result = tokenRegistryClient.get()
            .uri("/metadata/{subject}", policyId + assetNameHex)
            .retrieve()
            .onStatus({ status -> status == HttpStatus.NO_CONTENT }, { Mono.empty() })
            .bodyToMono(TokenMetadata::class.java)
            .blockOptional() // Use blockOptional() to avoid NullPointerException

        return result.orElse(null)
    }

    @Cacheable(cacheNames = ["tokenRegistryMetadata"])
    fun getTokenMetadata(assetFingerprint: String): TokenMetadata? {
        return try {
            val assetInfo = connectService.getMultiAssetInfoFromAssetFingerprint(assetFingerprint)
            getTokenMetadata(
                assetInfo.policyId.policyId,
                assetInfo.assetName.toByteArray(Charsets.UTF_8).toHex()
            )
        } catch (e: WebClientResponseException) {
            null
        }
    }

    @Scheduled(fixedDelay = 6 * 60 * 60 * 1000)
    @CacheEvict(allEntries = true, cacheNames = ["tokenRegistryMetadata"], )
    fun clearTokenRegistryCache() {
        // Annotation-based cache clearing of registry cache every 6 hours in case metadata changes
    }
}