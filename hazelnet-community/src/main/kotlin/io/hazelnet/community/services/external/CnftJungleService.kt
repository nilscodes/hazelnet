package io.hazelnet.community.services.external

import io.hazelnet.community.data.external.cnftjungle.AssetInfo
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@Service
class CnftJungleService(
    @field:Qualifier("cnftJungleClient")
    private val cnftJungleClient: WebClient,
) {

    fun getAssetInfo(policyId: String, assetNameHex: String): Mono<AssetInfo> {
        return cnftJungleClient.get()
            .uri("/assets/asset-info/{policyId}{assetNameHex}", policyId, assetNameHex)
            .retrieve()
            .bodyToMono(AssetInfo::class.java)
    }
}