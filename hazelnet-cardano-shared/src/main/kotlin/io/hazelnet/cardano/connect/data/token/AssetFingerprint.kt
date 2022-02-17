package io.hazelnet.cardano.connect.data.token

@JvmInline
value class AssetFingerprint(val assetFingerprint: String) {
    init {
        require("^asset1[A-Za-z-0-9]{38}\$".toRegex().matches(assetFingerprint))
    }
}