package io.hazelnet.community.services

import io.hazelnet.cardano.connect.data.token.GLOBAL_TRACKING_POLICY_ID_PLACEHOLDER
import com.bloxbean.cardano.client.util.AssetUtil
import io.hazelnet.cardano.connect.data.token.Cip68Token
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo
import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.external.cnftjungle.AssetInfo
import io.hazelnet.community.data.getImageUrlFromAssetInfo
import io.hazelnet.community.data.getItemNameFromAssetInfo
import io.hazelnet.community.services.external.CnftJungleService
import io.hazelnet.community.services.external.NftCdnService
import io.hazelnet.marketplace.data.ListingAnnouncement
import io.hazelnet.marketplace.data.ListingsInfo
import io.hazelnet.marketplace.data.SaleAnnouncement
import io.hazelnet.marketplace.data.SalesInfo
import mu.KotlinLogging
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import reactor.core.publisher.toMono
import reactor.util.function.Tuple2

private val logger = KotlinLogging.logger {}

@Service
class DiscordMarketplaceChannelPublisher(
    private val discordMarketplaceService: DiscordMarketplaceService,
    private val discordServerService: DiscordServerService,
    private val cnftJungleService: CnftJungleService,
    private val connectService: ConnectService,
    private val rabbitTemplate: RabbitTemplate,
    private val config: CommunityApplicationConfiguration,
    private val nftCdnService: NftCdnService,
) {

    @RabbitListener(queues = ["sales"])
    fun processSales(sale: SalesInfo) {
        val policyIdToUse = if (sale.globalMarketplaceTracking) GLOBAL_TRACKING_POLICY_ID_PLACEHOLDER else sale.policyId
        val marketplaceChannelsForPolicy = discordMarketplaceService.listAllSalesMarketplaceChannels(policyIdToUse)
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
        val policyIdToUse = if (listing.globalMarketplaceTracking) GLOBAL_TRACKING_POLICY_ID_PLACEHOLDER else listing.policyId
        val marketplaceChannelsForPolicy = discordMarketplaceService.listAllListingMarketplaceChannels(policyIdToUse)
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
        val cip68Token = Cip68Token(assetNameHex)
        logger.debug { "Getting asset info for asset $assetNameHex on policy $policyId. CIP-0068 token: ${cip68Token.isValidCip68Token()}"}
        val blockchainAssetInfo = if (cip68Token.isValidCip68Token()) {
            Mono.just(nftCdnService.getAssetMetadata(listOf(AssetUtil.calculateFingerPrint(policyId, cip68Token.getReferenceToken().toHexString())))
                .map { it.toMultiAssetInfo() }.first())
        } else {
            connectService.getMultiAssetInfoSingle(policyId, assetNameHex)
        }
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