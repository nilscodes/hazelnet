package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.token.MultiAssetInfo
import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.external.cnftjungle.AssetInfo
import io.hazelnet.community.data.getImageUrlFromAssetInfo
import io.hazelnet.community.data.getItemNameFromAssetInfo
import io.hazelnet.community.services.external.CnftJungleService
import io.hazelnet.marketplace.data.ListingAnnouncement
import io.hazelnet.marketplace.data.ListingsInfo
import io.hazelnet.marketplace.data.SaleAnnouncement
import io.hazelnet.marketplace.data.SalesInfo
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import reactor.util.function.Tuple2

@Service
class DiscordMarketplaceChannelPublisher(
    private val discordMarketplaceService: DiscordMarketplaceService,
    private val discordServerService: DiscordServerService,
    private val cnftJungleService: CnftJungleService,
    private val connectService: ConnectService,
    private val rabbitTemplate: RabbitTemplate,
    private val config: CommunityApplicationConfiguration,
) {

    @RabbitListener(queues = ["sales"])
    fun processSales(sale: SalesInfo) {
        val marketplaceChannelsForPolicy = discordMarketplaceService.listAllSalesMarketplaceChannels(sale.policyId)
        val combinedAssetInfo = retrieveAssetInfo(sale.policyId, sale.assetNameHex)
        marketplaceChannelsForPolicy.mapNotNull {
            if ((it.minimumValue == null || sale.price >= it.minimumValue!!)
                && (it.maximumValue == null || sale.price <= it.maximumValue!!)
                && it.meetsFilterCriteria(combinedAssetInfo.t1.metadata)
                && it.canShowForMarketplace(sale.source)) {
                SaleAnnouncement(
                    guildId = discordServerService.getGuildIdFromServerId(it.discordServerId!!),
                    channelId = it.channelId,
                    policyId = sale.policyId,
                    assetFingerprint = combinedAssetInfo.t1.assetFingerprint.assetFingerprint,
                    assetNameHex = sale.assetNameHex,
                    assetName = combinedAssetInfo.t1.assetName,
                    displayName = getItemNameFromAssetInfo(combinedAssetInfo.t1),
                    source = sale.source,
                    marketplaceAssetUrl = sale.marketplaceAssetUrl,
                    assetImageUrl = getImageUrlFromAssetInfo(config.salesIpfslink!!, combinedAssetInfo.t1),
                    price = sale.price,
                    saleDate = sale.saleDate,
                    rarityRank = combinedAssetInfo.t2.rarityRank,
                    type = sale.type,
                    highlightAttributeDisplayName = it.highlightAttributeDisplayName,
                    highlightAttributeValue = it.extractHighlightAttribute(combinedAssetInfo.t1.metadata)
                )
            } else {
                null
            }
        }
            .forEach { rabbitTemplate.convertAndSend("saleannouncements", it) }
    }

    @RabbitListener(queues = ["listings"])
    fun processListings(listing: ListingsInfo) {
        val marketplaceChannelsForPolicy = discordMarketplaceService.listAllListingMarketplaceChannels(listing.policyId)
        val combinedAssetInfo = retrieveAssetInfo(listing.policyId, listing.assetNameHex)
        marketplaceChannelsForPolicy.mapNotNull {
            if ((it.minimumValue == null || listing.price >= it.minimumValue!!)
                && (it.maximumValue == null || listing.price <= it.maximumValue!!)
                && it.meetsFilterCriteria(combinedAssetInfo.t1.metadata)
                && it.canShowForMarketplace(listing.source)) {
                ListingAnnouncement(
                    guildId = discordServerService.getGuildIdFromServerId(it.discordServerId!!),
                    channelId = it.channelId,
                    policyId = listing.policyId,
                    assetFingerprint = combinedAssetInfo.t1.assetFingerprint.assetFingerprint,
                    assetNameHex = listing.assetNameHex,
                    assetName = combinedAssetInfo.t1.assetName,
                    displayName = getItemNameFromAssetInfo(combinedAssetInfo.t1),
                    source = listing.source,
                    marketplaceAssetUrl = listing.marketplaceAssetUrl,
                    assetImageUrl = getImageUrlFromAssetInfo(config.salesIpfslink!!, combinedAssetInfo.t1),
                    price = listing.price,
                    listingDate = listing.listingDate,
                    rarityRank = combinedAssetInfo.t2.rarityRank,
                    highlightAttributeDisplayName = it.highlightAttributeDisplayName,
                    highlightAttributeValue = it.extractHighlightAttribute(combinedAssetInfo.t1.metadata)
                )
            } else {
                null
            }
        }
            .forEach { rabbitTemplate.convertAndSend("listingannouncements", it) }
    }

    private fun retrieveAssetInfo(policyId: String, assetNameHex: String): Tuple2<MultiAssetInfo, AssetInfo> {
        val blockchainAssetInfo = connectService.getMultiAssetInfoSingle(policyId, assetNameHex)
        val cnftJungleAssetInfo = cnftJungleService.getAssetInfo(policyId, assetNameHex)
            .onErrorReturn(
                AssetInfo(
                    assetId = "${policyId}${assetNameHex}",
                    policyId = policyId
                )
            )
        return Mono.zip(blockchainAssetInfo, cnftJungleAssetInfo)
            .block()!!
    }
}