package io.hazelnet.community.data

import com.jayway.jsonpath.JsonPath
import com.jayway.jsonpath.PathNotFoundException
import io.hazelnet.cardano.connect.data.token.Cip68Token
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo
import io.hazelnet.cardano.connect.util.toHex

const val IPFS_PROTOCOL = "ipfs://"

fun getImageUrlFromAssetInfo(ipfslink: String, assetInfo: MultiAssetInfo, fallbackImage: String? = null): String? {
    if (assetInfo.metadata.isBlank()) {
        if (fallbackImage != null) {
            return prepareIpfsLinkIfNeeded(fallbackImage, ipfslink, assetInfo)
        }
        return null
    }
    return try {
        val imageAttribute = JsonPath.read<Any>(assetInfo.metadata, "$.image")
        val imageAttributeString = when (imageAttribute) {
            is String -> imageAttribute
            is List<*> -> imageAttribute.joinToString("")
            else -> ""
        }
        prepareIpfsLinkIfNeeded(imageAttributeString, ipfslink, assetInfo)
    } catch(pnfe: PathNotFoundException) {
        null
    }
}

fun getMarketplaceUrl(marketplaceAssetUrl: String, assetInfo: MultiAssetInfo, cip68Token: Cip68Token): String {
    if (marketplaceAssetUrl.isBlank()) {
        return "https://jpg.store/asset/${assetInfo.policyId.policyId}${cip68Token.toHexString()}"
    }
    return try {
        val marketplaceUrl = JsonPath.read<String>(assetInfo.metadata, "$.marketplaceUrl")
        marketplaceUrl
    } catch(pnfe: PathNotFoundException) {
        marketplaceAssetUrl
    }
}

private fun prepareIpfsLinkIfNeeded(
    imageAttributeString: String,
    ipfslink: String,
    assetInfo: MultiAssetInfo
) = if (imageAttributeString.startsWith(IPFS_PROTOCOL)) {
    ipfslink.replace("%ipfs", imageAttributeString.substring(IPFS_PROTOCOL.length))
        .replace("%fp", assetInfo.assetFingerprint.assetFingerprint)
} else {
    imageAttributeString
}

fun getItemNameFromAssetInfo(assetInfo: MultiAssetInfo): String {
    if (assetInfo.metadata.isBlank()) {
        return assetInfo.assetName
    }
    return try {
        return JsonPath.read(assetInfo.metadata, "$.name")
    } catch(pnfe: PathNotFoundException) {
        assetInfo.assetName
    }
}