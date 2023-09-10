package io.hazelnet.cardano.connect.data.address

import io.hazelnet.cardano.connect.data.token.AssetFingerprint

data class Handle(val handle: String, val nftTokenNameHex: String, val address: String? = null, val resolved: Boolean = true, val assetFingerprint: String? = null) {
    override fun toString(): String {
        return "Handle(handle='$handle', address=$address, resolved=$resolved, assetFingerprint=$assetFingerprint)"
    }

    fun augmentWithAssetFingerprint(assetFingerprint: AssetFingerprint) = Handle(handle, nftTokenNameHex, address, resolved, assetFingerprint.assetFingerprint)

}