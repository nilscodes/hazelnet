package io.hazelnet.cardano.connect.data

import com.bloxbean.cardano.client.util.AssetUtil
import io.hazelnet.cardano.connect.data.address.Handle
import io.hazelnet.cardano.connect.data.token.Cip68Token
import io.hazelnet.shared.decodeHex

class HandleUtil {
    companion object {
        fun getHandle(handlePolicy: String, assetNameHex: String): Handle {
            val cip68Token = Cip68Token(assetNameHex)
            return if (cip68Token.isValidCip68Token()) {
                Handle(handle = cip68Token.assetName, nftTokenNameHex=cip68Token.toHexString(), resolved = false, assetFingerprint = AssetUtil.calculateFingerPrint(handlePolicy, cip68Token.toHexString()))
            } else {
                Handle(handle = assetNameHex.decodeHex(), nftTokenNameHex = assetNameHex, resolved = false, assetFingerprint = AssetUtil.calculateFingerPrint(handlePolicy, assetNameHex))
            }
        }
    }
}