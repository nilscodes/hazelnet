package io.hazelnet.cardano.connect.data

import com.fasterxml.jackson.annotation.JsonCreator

data class PolicyIdsAndExcludedAssets @JsonCreator constructor(
    val policyIdsWithOptionalAssetFingerprint: List<String>,
    val excludedAssetFingerprints: List<String> = emptyList(),
)
