package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.other.SyncInfo
import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfo
import io.hazelnet.cardano.connect.data.verifications.VerificationConfirmation
import io.hazelnet.community.data.Verification
import org.springframework.core.ParameterizedTypeReference
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Flux
import java.text.SimpleDateFormat
import java.util.*

@Service
class ConnectService(
        private val connectClient: WebClient,
) {
    fun getActiveDelegationForPools(stakepoolHashes: List<String>): List<DelegationInfo> {
        return Flux.fromIterable(stakepoolHashes)
                .flatMap {
                    connectClient.get()
                            .uri("/stakepools/{poolHash}/delegation", it)
                            .retrieve()
                            .bodyToFlux(DelegationInfo::class.java)
                }.collectList().block()!!
    }

    fun getCurrentEpoch(): Int {
        return connectClient.get()
                .uri("/info/syncstatus")
                .retrieve()
                .bodyToMono(SyncInfo::class.java)
                .block()!!
                .currentEpoch
    }

    fun getStakepools(): List<StakepoolInfo> {
        return connectClient.get()
                .uri("/stakepools")
                .retrieve()
                .bodyToMono(object : ParameterizedTypeReference<List<StakepoolInfo>>() {})
                .block()!!
    }

    fun getAllTokenOwnership(stakeAddresses: List<String>, policyIds: List<String>): List<TokenOwnershipInfo> {
        return Flux.fromIterable(stakeAddresses)
                .flatMap {
                    connectClient.post()
                            .uri("/token/stake/{stakeAddress}", it)
                            .bodyValue(policyIds)
                            .retrieve()
                            .bodyToFlux(TokenOwnershipInfo::class.java)
                }.collectList().block()!!
    }

    fun getVerificationStatus(verification: Verification): VerificationConfirmation {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        dateFormat.timeZone = TimeZone.getTimeZone("UTC")
        return connectClient.get()
                .uri { uriBuilder ->
                    uriBuilder
                            .path("/verification/" + verification.address)
                            .queryParam("verificationAmount", verification.amount)
                            .queryParam("earliestBlockTime", dateFormat.format(verification.validAfter))
                            .build()
                }.retrieve()
                .bodyToMono(VerificationConfirmation::class.java)
                .block()!!
    }
}