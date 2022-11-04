package io.hazelnet.community.services.external

import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfoWithAssetCount
import io.hazelnet.community.data.external.cnftjungle.AssetInfo
import io.hazelnet.community.data.external.mutantstaking.StakeAssetsAtStakeAddress
import io.hazelnet.community.data.external.mutantstaking.StakeEntry
import io.hazelnet.shared.data.WhitelistSignup
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.ParameterizedTypeReference
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@Service
class MutantStakingService(
    @field:Qualifier("mutantStakingClient")
    private val mutantStakingClient: WebClient,
) {
    fun getStakeablePolicies(): Set<String> {
        return mutantStakingClient.post()
            .uri("/stakes/policies")
            .retrieve()
            .bodyToMono(object : ParameterizedTypeReference<Set<String>>() {})
            .block()!!
    }

    fun getStakedAssetsForPolicies(
        policyIds: Set<String>
    ) : List<StakeEntry> {
        return mutantStakingClient.post()
            .uri("/stakes")
            .bodyValue(mapOf(Pair("policies", policyIds)))
            .retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<StakeEntry>>() {})
            .block()!!
    }

    fun getStakedAssetsForStakeAddress(
        stakeAddress: String
    ) : List<StakeAssetsAtStakeAddress> {
        return mutantStakingClient.post()
            .uri("/stakes/assets")
            .bodyValue(mapOf(Pair("stakeAddress", stakeAddress)))
            .retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<StakeAssetsAtStakeAddress>>() {})
            .block()!!
    }
}