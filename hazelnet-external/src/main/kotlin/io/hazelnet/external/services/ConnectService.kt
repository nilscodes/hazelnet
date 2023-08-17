package io.hazelnet.external.services

import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfoWithAssetList
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Flux

@Service
class ConnectService(
    @Qualifier("connectClient")
    private val connectClient: WebClient,
) {
    fun getAllTokenOwnershipAssetsByPolicyId(
        stakeAddresses: List<String>,
        policyIdsWithOptionalAssetFingerprint: Set<String>
    ): List<TokenOwnershipInfoWithAssetList> {
        return Flux.fromIterable(stakeAddresses)
            .flatMap {
                connectClient.post()
                    .uri("/token/stake/{stakeAddress}/assets", it)
                    .bodyValue(policyIdsWithOptionalAssetFingerprint)
                    .retrieve()
                    .bodyToFlux(TokenOwnershipInfoWithAssetList::class.java)
            }.collectList().block()!!
    }
}