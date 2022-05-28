package io.hazelnet.cardano.connect.data.token

import com.fasterxml.jackson.annotation.JsonCreator

data class MultiAssetInfo(
    val policyId: PolicyId,
    val assetName: String,
    val assetFingerprint: AssetFingerprint,
    val metadata: String,
    val mintTransaction: String,
    val quantity: Long,
) {

    companion object {
        @JvmStatic
        @JsonCreator
        fun create(
            policyId: String,
            assetName: String,
            assetFingerprint: String,
            metadata: String,
            mintTransaction: String,
            quantity: Long,
        ) = MultiAssetInfo(PolicyId(policyId), assetName, AssetFingerprint(assetFingerprint), metadata, mintTransaction, quantity)
    }
}