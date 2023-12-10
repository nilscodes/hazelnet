package io.hazelnet.community.services

import com.bloxbean.cardano.client.util.AssetUtil
import io.hazelnet.cardano.connect.data.token.Cip68Token
import io.hazelnet.cardano.connect.data.token.GLOBAL_TRACKING_POLICY_ID_PLACEHOLDER
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo
import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.getImageUrlFromAssetInfo
import io.hazelnet.community.data.getItemNameFromAssetInfo
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

private val logger = KotlinLogging.logger {}

@Service
class DiscordMarketplaceChannelPublisher(
    private val discordMarketplaceService: DiscordMarketplaceService,
    private val discordServerService: DiscordServerService,
    private val connectService: ConnectService,
    private val rabbitTemplate: RabbitTemplate,
    private val config: CommunityApplicationConfiguration,
    private val nftCdnService: NftCdnService,
) {

    @RabbitListener(queues = ["sales"])
    fun processSales(sale: SalesInfo) {
        val policyIdToUse = if (sale.globalMarketplaceTracking) GLOBAL_TRACKING_POLICY_ID_PLACEHOLDER else sale.policyId
        val marketplaceChannelsForPolicy = discordMarketplaceService.listAllSalesMarketplaceChannels(policyIdToUse)
        val cip68Token = Cip68Token(sale.assetNameHex)
        val combinedAssetInfo = retrieveAssetInfo(sale.policyId, cip68Token)
        marketplaceChannelsForPolicy.mapNotNull {
            if ((it.minimumValue == null || sale.price >= it.minimumValue!!)
                && (it.maximumValue == null || sale.price <= it.maximumValue!!)
                && it.meetsFilterCriteria(combinedAssetInfo.metadata)
                && it.canShowForMarketplace(sale.source)) {
                SaleAnnouncement(
                    guildId = discordServerService.getGuildIdFromServerId(it.discordServerId!!),
                    channelId = it.channelId,
                    policyId = sale.policyId,
                    assetFingerprint = if (cip68Token.isValidCip68Token()) AssetUtil.calculateFingerPrint(sale.policyId, cip68Token.getNft().toHexString()) else combinedAssetInfo.assetFingerprint.assetFingerprint,
                    referenceTokenAssetFingerprint = if (cip68Token.isValidCip68Token()) AssetUtil.calculateFingerPrint(sale.policyId, cip68Token.getReferenceToken().toHexString()) else null,
                    assetNameHex = sale.assetNameHex,
                    assetName = combinedAssetInfo.assetName,
                    displayName = getItemNameFromAssetInfo(combinedAssetInfo),
                    source = sale.source,
                    marketplaceAssetUrl = sale.marketplaceAssetUrl,
                    assetImageUrl = getImageUrlFromAssetInfo(config.salesIpfslink!!, combinedAssetInfo),
                    price = sale.price,
                    saleDate = sale.saleDate,
                    rarityRank = 0,
                    type = sale.type,
                    highlightAttributeDisplayName = it.highlightAttributeDisplayName,
                    highlightAttributeValue = it.extractHighlightAttribute(combinedAssetInfo.metadata)
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
        val cip68Token = Cip68Token(listing.assetNameHex)
        val combinedAssetInfo = retrieveAssetInfo(listing.policyId, cip68Token)
        marketplaceChannelsForPolicy.mapNotNull {
            if ((it.minimumValue == null || listing.price >= it.minimumValue!!)
                && (it.maximumValue == null || listing.price <= it.maximumValue!!)
                && it.meetsFilterCriteria(combinedAssetInfo.metadata)
                && it.canShowForMarketplace(listing.source)) {
                ListingAnnouncement(
                    guildId = discordServerService.getGuildIdFromServerId(it.discordServerId!!),
                    channelId = it.channelId,
                    policyId = listing.policyId,
                    assetFingerprint = if (cip68Token.isValidCip68Token()) AssetUtil.calculateFingerPrint(listing.policyId, cip68Token.getNft().toHexString()) else combinedAssetInfo.assetFingerprint.assetFingerprint,
                    referenceTokenAssetFingerprint = if (cip68Token.isValidCip68Token()) AssetUtil.calculateFingerPrint(listing.policyId, cip68Token.getReferenceToken().toHexString()) else null,
                    assetNameHex = listing.assetNameHex,
                    assetName = combinedAssetInfo.assetName,
                    displayName = getItemNameFromAssetInfo(combinedAssetInfo),
                    source = listing.source,
                    marketplaceAssetUrl = listing.marketplaceAssetUrl,
                    assetImageUrl = getImageUrlFromAssetInfo(config.salesIpfslink!!, combinedAssetInfo),
                    price = listing.price,
                    listingDate = listing.listingDate,
                    rarityRank = 0,
                    highlightAttributeDisplayName = it.highlightAttributeDisplayName,
                    highlightAttributeValue = it.extractHighlightAttribute(combinedAssetInfo.metadata)
                )
            } else {
                null
            }
        }
            .forEach { rabbitTemplate.convertAndSend("listingannouncements", it) }
    }

    private fun retrieveAssetInfo(policyId: String, cip68Token: Cip68Token): MultiAssetInfo {
        logger.debug { "Getting asset info for asset ${cip68Token.toHexString()} on policy $policyId. CIP-0068 token: ${cip68Token.isValidCip68Token()}"}
        val blockchainAssetInfo = if (cip68Token.isValidCip68Token()) {
            Mono.just(nftCdnService.getAssetMetadata(listOf(AssetUtil.calculateFingerPrint(policyId, cip68Token.getReferenceToken().toHexString())))
                .map { it.toMultiAssetInfo() }.first())
        } else {
            connectService.getMultiAssetInfoSingle(policyId, cip68Token.toHexString())
        }
        return blockchainAssetInfo.block()!!
    }
}