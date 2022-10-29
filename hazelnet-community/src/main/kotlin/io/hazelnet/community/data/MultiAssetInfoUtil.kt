package io.hazelnet.community.data

import com.jayway.jsonpath.JsonPath
import com.jayway.jsonpath.PathNotFoundException
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo
import io.hazelnet.community.CommunityApplicationConfiguration

fun getImageUrlFromAssetInfo(ipfslink: String, assetInfo: MultiAssetInfo): String? {
    return try {
        val ipfsLink = JsonPath.read<String>(assetInfo.metadata, "$.image").replace("ipfs://", "", true)
        String.format(ipfslink, ipfsLink)
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