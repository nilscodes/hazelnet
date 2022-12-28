package io.hazelnet.community.data

import com.jayway.jsonpath.JsonPath
import com.jayway.jsonpath.PathNotFoundException
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo

const val IPFS_PROTOCOL = "ipfs://"

fun getImageUrlFromAssetInfo(ipfslink: String, assetInfo: MultiAssetInfo): String? {
    return try {
        val imageAttribute = JsonPath.read<Any>(assetInfo.metadata, "$.image")
        val imageAttributeString = when (imageAttribute) {
            is String -> imageAttribute
            is List<*> -> imageAttribute.joinToString("")
            else -> ""
        }
        if (imageAttributeString.startsWith(IPFS_PROTOCOL)) {
            ipfslink.replace("%ipfs", imageAttributeString.substring(IPFS_PROTOCOL.length)).replace("%fp", assetInfo.assetFingerprint.assetFingerprint)
        } else {
            imageAttributeString
        }
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