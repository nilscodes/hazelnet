package io.hazelnet.community.services.external

import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.external.NftCdnMetadata
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Flux

@Service
class NftCdnService(
    @Qualifier("nftCdnClient")
    private val nftCdnClient: WebClient,
    private val config: CommunityApplicationConfiguration
) {
    fun getAssetMetadata(assetFingerprints: List<String>): List<NftCdnMetadata> {
        return Flux.fromIterable(assetFingerprints)
            .flatMap {
                nftCdnClient.get()
                    .uri("https://$it.${config.nftcdn.domain}.nftcdn.io/metadata")
                    .retrieve()
                    .bodyToFlux(NftCdnMetadata::class.java)
            }.collectList().block()!!
    }
}