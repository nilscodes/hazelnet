package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.address.AddressDetails
import io.hazelnet.cardano.connect.data.address.Handle
import io.hazelnet.cardano.connect.data.other.SyncInfo
import io.hazelnet.cardano.connect.data.payment.PaymentConfirmation
import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo
import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfoWithAssetCount
import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfoWithAssetList
import io.hazelnet.cardano.connect.data.verifications.VerificationConfirmation
import io.hazelnet.cardano.connect.util.toHex
import io.hazelnet.community.data.Verification
import io.hazelnet.community.data.premium.IncomingDiscordPayment
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
    fun getWalletInfo(address: String): AddressDetails {
        return connectClient.get()
            .uri("/wallets/$address")
            .retrieve()
            .bodyToMono(AddressDetails::class.java)
            .block()!!
    }

    fun resolveHandle(handle: String): Handle {
        return connectClient.get()
            .uri("/handles/$handle")
            .retrieve()
            .bodyToMono(Handle::class.java)
            .block()!!
    }

    fun getActiveDelegationForPools(stakepoolHashes: List<String>): List<DelegationInfo> {
        return Flux.fromIterable(stakepoolHashes)
            .flatMap {
                connectClient.get()
                    .uri("/stakepools/{poolHash}/delegation", it)
                    .retrieve()
                    .bodyToFlux(DelegationInfo::class.java)
            }.collectList().block()!!
    }

    fun getDelegationSnapshotForPools(stakepoolHashes: List<String>, epoch: Int): List<DelegationInfo> {
        return Flux.fromIterable(stakepoolHashes)
            .flatMap {
                connectClient.get()
                    .uri("/stakepools/{poolHash}/delegation/{epoch}", it, epoch)
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

    fun getAllTokenOwnershipCountsByPolicyId(
        stakeAddresses: List<String>,
        policyIdsWithOptionalAssetFingerprint: Set<String>
    ): List<TokenOwnershipInfoWithAssetCount> {
        return Flux.fromIterable(stakeAddresses)
            .flatMap {
                connectClient.post()
                    .uri("/token/stake/{stakeAddress}", it)
                    .bodyValue(policyIdsWithOptionalAssetFingerprint)
                    .retrieve()
                    .bodyToFlux(TokenOwnershipInfoWithAssetCount::class.java)
            }.collectList().block()!!
    }

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

    fun getPaymentStatus(incomingDiscordPayment: IncomingDiscordPayment): PaymentConfirmation {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        dateFormat.timeZone = TimeZone.getTimeZone("UTC")
        return connectClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/payment/" + incomingDiscordPayment.receivingAddress)
                    .queryParam("paymentAmount", incomingDiscordPayment.amount)
                    .queryParam("earliestBlockTime", dateFormat.format(incomingDiscordPayment.validAfter))
                    .build()
            }.retrieve()
            .bodyToMono(PaymentConfirmation::class.java)
            .block()!!
    }

    fun resolvePoolView(poolView: String): List<StakepoolInfo> {
        return connectClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/stakepools")
                    .queryParam("poolView", poolView)
                    .build()
            }.retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<StakepoolInfo>>() {})
            .block()!!
    }

    fun resolvePoolHash(poolHash: String): List<StakepoolInfo> {
        return connectClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/stakepools")
                    .queryParam("poolHash", poolHash)
                    .build()
            }.retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<StakepoolInfo>>() {})
            .block()!!
    }

    fun getTokenSnapshotByPolicyId(policyIdsWithOptionalAssetFingerprint: Set<String>): List<TokenOwnershipInfoWithAssetCount> {
        return connectClient.post()
            .uri("/token/stake")
            .bodyValue(policyIdsWithOptionalAssetFingerprint)
            .retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<TokenOwnershipInfoWithAssetCount>>() {})
            .block()!!

    }

    fun getMultiAssetInfo(assets: List<Pair<String, String>>): List<MultiAssetInfo> {
        return Flux.fromIterable(assets)
            .flatMap {
                connectClient.get()
                    .uri("/token/assets/{policyId}/{assetNameHex}", it.first, it.second.toByteArray().toHex())
                    .retrieve()
                    .bodyToFlux(MultiAssetInfo::class.java)
            }.collectList().block()!!
    }
}