package io.hazelnet.marketplace.data.plutusart

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import io.hazelnet.marketplace.data.ListingsInfo
import io.hazelnet.marketplace.data.Marketplace
import io.hazelnet.marketplace.data.SalesInfo
import io.hazelnet.marketplace.data.SalesType
import java.util.*

@JsonIgnoreProperties(ignoreUnknown = true)
data class PlutusArtActivityInfo @JsonCreator constructor(
    @JsonProperty("_id")
    val internalId: String,

    @JsonProperty("action")
    val action: PlutusArtAction,

    @JsonProperty("createdAt")
    val createdAt: Date,

    @JsonProperty("updatedAt")
    val updatedAt: Date?,

    @JsonProperty("state")
    val state: PlutusArtState,

    @JsonProperty("totalCost")
    val totalCost: PlutusArtTotalCost,

    @JsonProperty("offerAssetTokens")
    val offerAssetTokens: List<PlutusArtTokenInfo>
) {
    fun getDisplayName(): String {
        return if (offerAssetTokens.isNotEmpty()) {
            offerAssetTokens.first().name
        } else {
            "No assets offered"
        }
    }

    fun toSalesInfo(): SalesInfo {
        val firstToken = offerAssetTokens.first()
        return SalesInfo(
            policyId = firstToken.policyId,
            assetNameHex = firstToken.nameHex,
            source = Marketplace.PLUTUSART,
            marketplaceAssetUrl = "https://www.plutus.art/asset/${firstToken.unit}",
            price = totalCost.lovelace,
            saleDate = updatedAt!!,
            type = SalesType.BUY,
        )
    }

    fun toListingsInfo(): ListingsInfo {
        val firstToken = offerAssetTokens.first()
        return ListingsInfo(
            policyId = firstToken.policyId,
            assetNameHex = firstToken.nameHex,
            source = Marketplace.PLUTUSART,
            marketplaceAssetUrl = "https://www.plutus.art/asset/${firstToken.unit}",
            price = totalCost.lovelace,
            listingDate = createdAt,
        )
    }
}
