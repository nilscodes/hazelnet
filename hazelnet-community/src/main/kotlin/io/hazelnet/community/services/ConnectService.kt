package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.address.AddressDetails
import io.hazelnet.cardano.connect.data.address.Handle
import io.hazelnet.cardano.connect.data.drep.DRepDelegationInfo
import io.hazelnet.cardano.connect.data.drep.DRepInfo
import io.hazelnet.cardano.connect.data.other.EpochDetails
import io.hazelnet.cardano.connect.data.other.SyncInfo
import io.hazelnet.cardano.connect.data.payment.PaymentConfirmation
import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import io.hazelnet.cardano.connect.data.token.*
import io.hazelnet.cardano.connect.data.verifications.VerificationConfirmation
import io.hazelnet.community.data.Verification
import io.hazelnet.community.data.cardano.DRep
import io.hazelnet.community.data.premium.IncomingDiscordPayment
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.ParameterizedTypeReference
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.text.SimpleDateFormat
import java.util.*

@Service
class ConnectService(
    @Qualifier("connectClient")
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

    fun findHandlesForStakeAddress(
        stakeAddresses: List<String>,
    ): List<Handle> {
        return Flux.fromIterable(stakeAddresses)
            .flatMap {
                connectClient.get()
                    .uri("/token/stake/{stakeAddress}/handles", it)
                    .retrieve()
                    .bodyToFlux(Handle::class.java)
            }.collectList().block()!!
    }

    fun getWalletForAsset(assetFingerprint: String): AddressDetails {
        return connectClient.get()
            .uri("/token/fingerprints/$assetFingerprint")
            .retrieve()
            .bodyToMono(AddressDetails::class.java)
            .block()!!
    }

    fun getActiveDelegationForPools(stakepoolHashes: List<String>, withoutAmount: Boolean): List<DelegationInfo> {
        return Flux.fromIterable(stakepoolHashes)
            .flatMap { poolHash ->
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/stakepools/$poolHash/delegation")
                            .queryParam("withoutAmount", withoutAmount.toString())
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(DelegationInfo::class.java)
            }.collectList().block()!!
    }

    fun getActiveDelegationForDReps(dRepHashes: List<String>, withoutAmount: Boolean): List<DRepDelegationInfo> {
        return Flux.fromIterable(dRepHashes)
            .flatMap { dRepHash ->
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/dreps/$dRepHash/delegation")
                            .queryParam("withoutAmount", withoutAmount.toString())
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(DRepDelegationInfo::class.java)
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

    fun getSyncInfo(): SyncInfo {
        return connectClient.get()
            .uri("/info/syncstatus")
            .retrieve()
            .bodyToMono(SyncInfo::class.java)
            .block()!!
    }

    fun getEpochDetails(): EpochDetails {
        return connectClient.get()
            .uri("/info/epochdetails")
            .retrieve()
            .bodyToMono(EpochDetails::class.java)
            .block()!!
    }

    fun getStakepools(): List<StakepoolInfo> {
        return connectClient.get()
            .uri("/stakepools")
            .retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<StakepoolInfo>>() {})
            .block()!!
    }

    fun getDReps(): List<DRepInfo> {
        return connectClient.get()
            .uri("/dreps")
            .retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<DRepInfo>>() {})
            .block()!!
    }

    fun getAllTokenOwnershipCountsByPolicyId(
        stakeAddresses: List<String>,
        policyIdsWithOptionalAssetFingerprint: Set<String>,
        excludedAssetFingerprints: Set<String>,
    ): List<TokenOwnershipInfoWithAssetCount> {
        return Flux.fromIterable(stakeAddresses)
            .flatMap {
                connectClient.post()
                    .uri("/token/stake/{stakeAddress}", it)
                    .bodyValue(mapOf(
                        Pair("policyIdsWithOptionalAssetFingerprint", policyIdsWithOptionalAssetFingerprint),
                        Pair("excludedAssetFingerprints", excludedAssetFingerprints),
                    ))
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

    fun resolveDRepView(dRepView: String): List<DRepInfo> {
        return connectClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/dreps")
                    .queryParam("dRepView", dRepView)
                    .build()
            }.retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<DRepInfo>>() {})
            .block()!!
    }

    fun resolveDRepHash(dRepHash: String): List<DRepInfo> {
        return connectClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/dreps")
                    .queryParam("dRepHash", dRepHash)
                    .build()
            }.retrieve()
            .bodyToMono(object : ParameterizedTypeReference<List<DRepInfo>>() {})
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
                    .uri("/token/assets/{policyId}/{assetNameHex}", it.first, it.second)
                    .retrieve()
                    .bodyToFlux(MultiAssetInfo::class.java)
            }.collectList().block()!!
    }

    fun getPolicyInfo(policyIds: List<String>): List<PolicyInfo> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri("/token/policies/{policyId}", it)
                    .retrieve()
                    .bodyToFlux(PolicyInfo::class.java)
                    .onErrorReturn(PolicyInfo(PolicyId(it), 0))
            }.collectList().block()!!
    }

    fun getMultiAssetInfoFromAssetFingerprint(assetFingerprint: String): MultiAssetInfo {
        return connectClient.get()
            .uri("/token/fingerprints/{fingerprint}", assetFingerprint)
            .retrieve()
            .bodyToMono(MultiAssetInfo::class.java)
            .block()!!
    }

    fun getMultiAssetInfoSingle(policyId: String, assetNameHex: String): Mono<MultiAssetInfo> {
        return connectClient.get()
            .uri("/token/assets/{policyId}/{assetNameHex}", policyId, assetNameHex)
            .retrieve()
            .bodyToMono(MultiAssetInfo::class.java)
    }
}