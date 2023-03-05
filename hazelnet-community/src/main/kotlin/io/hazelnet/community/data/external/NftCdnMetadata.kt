package io.hazelnet.community.data.external

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.ObjectMapper
import io.hazelnet.cardano.connect.data.token.AssetFingerprint
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo
import io.hazelnet.cardano.connect.data.token.PolicyId

data class NftCdnMetadata @JsonCreator constructor(
    @JsonProperty("id")
    val assetNameHex: String,

    @JsonProperty("name")
    val assetName: String,

    @JsonProperty("policy")
    val policyId: String,

    @JsonProperty("fingerprint")
    val assetFingerprint: String,

    @JsonProperty("metadata")
    val metadata: Map<String, Any>,
) {
    fun toMultiAssetInfo() = MultiAssetInfo(
        policyId = PolicyId(policyId),
        assetName = assetName,
        assetFingerprint = AssetFingerprint(assetFingerprint),
        metadata = ObjectMapper().writeValueAsString(metadata),
        mintTransaction = "",
        quantity = 1L
    )

}
