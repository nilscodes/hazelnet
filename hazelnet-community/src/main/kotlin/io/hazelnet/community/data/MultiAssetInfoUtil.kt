package io.hazelnet.community.data

import com.jayway.jsonpath.JsonPath
import com.jayway.jsonpath.PathNotFoundException
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo

fun getImageUrlFromAssetInfo(ipfslink: String, assetInfo: MultiAssetInfo): String? {
    return try {
        val ipfsHashv0 = JsonPath.read<String>(assetInfo.metadata, "$.image").replace("ipfs://", "", true)
        ipfslink.replace("%ipfs", ipfsHashv0).replace("%fp", assetInfo.assetFingerprint.assetFingerprint)
    } catch(pnfe: PathNotFoundException) {
        null
    }
}

fun getItemNameFromAssetInfo(assetInfo: MultiAssetInfo): String {
    return try {
        return JsonPath.read(assetInfo.metadata, "$.name")
    } catch(pnfe: PathNotFoundException) {
        assetInfo.assetName
    }
}