package io.hazelnet.community.services

import com.bloxbean.cardano.client.util.AssetUtil
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.hazelnet.cardano.connect.data.token.*
import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.external.oura.*
import io.hazelnet.community.data.getImageUrlFromAssetInfo
import io.hazelnet.community.data.getItemNameFromAssetInfo
import io.hazelnet.marketplace.data.MintAnnouncement
import io.hazelnet.shared.decodeHex
import io.micrometer.core.instrument.Gauge
import io.micrometer.core.instrument.MeterRegistry
import mu.KotlinLogging
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.util.*
import java.util.concurrent.ConcurrentHashMap

private val logger = KotlinLogging.logger {}

const val KEEP_MINT_EVENTS_WITHOUT_METADATA_MILLISECONDS = 120000L
const val KEEP_METADATA_FOR_MILLISECONDS = 300000L

@Service
class OuraEventService(
    private val marketplaceService: DiscordMarketplaceService,
    private val discordServerService: DiscordServerService,
    private val rabbitTemplate: RabbitTemplate,
    private val config: CommunityApplicationConfiguration,
    meterRegistry: MeterRegistry,
) {
    private val mintQueue: LinkedList<OuraMintEvent> = LinkedList()
    private val metadataMap: MutableMap<String, OuraMetadataEvent> = ConcurrentHashMap()
    private val assetsToDatums: MutableMap<String, OuraTxOutputAssetEvent> = ConcurrentHashMap()
    private val datumsToMetadata: MutableMap<String, OuraPlutusDatumEvent> = ConcurrentHashMap()

    init {
        Gauge.builder("oura_mint_queue_size", mintQueue) {
            it.size.toDouble()
        }
            .description("Number of unprocessed Oura mint events")
            .register(meterRegistry)
        Gauge.builder("oura_metadata_map_size", metadataMap) {
            it.size.toDouble()
        }
            .description("Number of stored Oura metadata events")
            .register(meterRegistry)
    }

    fun receiveEvent(ouraEvent: Map<String, Any>) {
        try {
            if (ouraEvent["variant"] == "Mint") {
                val context = (ouraEvent["context"] as Map<String, Any>)
                val mint = (ouraEvent["mint"] as Map<String, Any>)
                val mintEvent = OuraMintEvent(
                    date = Date(context["timestamp"].toString().toLong() * 1000),
                    transactionHash = context["tx_hash"].toString(),
                    policyId = mint["policy"].toString(),
                    assetNameHex = mint["asset"].toString(),
                    quantity = mint["quantity"].toString().toLong()
                )
                mintQueue.add(mintEvent)
                logger.debug { "Received mint event with transaction hash ${mintEvent.transactionHash} and body $mintEvent" }
            } else if (ouraEvent["variant"] == "Metadata") {
                val context = (ouraEvent["context"] as Map<String, Any>)
                val metadata = (ouraEvent["metadata"] as Map<String, Any>)
                val json = metadata["map_json"] as Map<String, Any>?
                val metadataEvent = OuraMetadataEvent(
                    date = Date(context["timestamp"].toString().toLong() * 1000),
                    transactionHash = context["tx_hash"].toString(),
                    metadata = json ?: emptyMap(),
                )
                metadataMap[metadataEvent.transactionHash] = metadataEvent
                logger.debug { "Received metadata event with transaction hash ${metadataEvent.transactionHash} and body $metadataEvent" }
            } else if (ouraEvent["variant"] == "TxOutput") {
                val context = (ouraEvent["context"] as Map<String, Any>)
                val txOutput = (ouraEvent["tx_output"] as Map<String, Any>)
                val datumHash = txOutput["datum_hash"]
                if (datumHash is String) {
                    val outputEvents = (txOutput["assets"] as List<Map<String, Any>>?)?.map { asset ->
                        val assetName = asset["asset"] as String
                        OuraTxOutputAssetEvent(
                            date = Date(context["timestamp"].toString().toLong() * 1000),
                            transactionHash = context["tx_hash"].toString(),
                            policyId = asset["policy"].toString(),
                            assetNameHex = assetName,
                            datumHash = datumHash,
                        )
                    } ?: emptyList()
                    assetsToDatums.putAll(outputEvents.map { it.assetNameHex to it })
                    logger.debug { "Received txoutput event with transaction hash ${context["tx_hash"]} and body $outputEvents" }
                }
            } else if (ouraEvent["variant"] == "PlutusDatum") {
                val context = (ouraEvent["context"] as Map<String, Any>)
                val plutusDatum = (ouraEvent["plutus_datum"] as Map<String, Any>)
                if (plutusDatum["datum_hash"] is String) {
                    val plutusData = plutusDatum["plutus_data"] as Map<String, Any>
                    val json = processNestedMap(plutusData)
                    val plutusDatumEvent = OuraPlutusDatumEvent(
                        date = Date(context["timestamp"].toString().toLong() * 1000),
                        transactionHash = context["tx_hash"].toString(),
                        datumHash = plutusDatum["datum_hash"] as String,
                        plutusData = json,
                    )
                    datumsToMetadata[plutusDatumEvent.datumHash] = plutusDatumEvent
                    logger.debug { "Received plutusdatum event with transaction hash ${plutusDatumEvent.transactionHash} and body $plutusDatumEvent" }
                }
            }
        } catch (e: Exception) {
            // Catch all exceptions, Oura always wants a 200 back
            logger.error(
                "Error while processing Oura event with variant {} and context {}",
                ouraEvent["variant"],
                ouraEvent["context"],
                e
            )
        }
    }

    @Scheduled(fixedDelay = 30000)
    fun processEvents() {
        val currentMintChannels = marketplaceService.listAllMintMarketplaceChannels()
        val relevantPolicyIds = currentMintChannels.map { it.policyId }.toSet()
        logger.trace { "Processing ${mintQueue.size} mint events and ${metadataMap.size} metadata events, across ${currentMintChannels.size} mint trackers and ${relevantPolicyIds.size} unique policy IDs" }
        val queueToRetry = mutableListOf<OuraMintEvent>()
        while (mintQueue.isNotEmpty()) {
            val mintToProcess = mintQueue.pop()
            if (!relevantPolicyIds.contains(mintToProcess.policyId)) {
                logger.trace { "Skipping mint event with transaction hash ${mintToProcess.transactionHash} as policy ID ${mintToProcess.policyId} is not tracked" }
                continue
            }
            val cip68Token = Cip68Token(mintToProcess.assetNameHex)
            if (cip68Token.isValidCip68Token() && cip68Token.assetClass != Cip67Label(222)) {
                logger.trace { "Skipping mint event for token $cip68Token with transaction hash ${mintToProcess.transactionHash} as CIP-0068 token is not an NFT" }
                continue
            }
            val (metadataOfAsset, assetName) = lookUpMetadata(mintToProcess, cip68Token)
            if (metadataOfAsset is Map<String, Any>) {
                val combinedAssetInfo = MultiAssetInfo(
                    policyId = PolicyId(mintToProcess.policyId),
                    assetName = assetName,
                    assetFingerprint = AssetFingerprint(
                        AssetUtil.calculateFingerPrint(
                            mintToProcess.policyId,
                            mintToProcess.assetNameHex
                        )
                    ),
                    metadata = ObjectMapper().writeValueAsString(metadataOfAsset),
                    mintTransaction = mintToProcess.transactionHash,
                    quantity = mintToProcess.quantity,
                )

                currentMintChannels
                    .filter {
                        it.policyId == mintToProcess.policyId
                                && it.meetsFilterCriteria(combinedAssetInfo.metadata)
                    }
                    .map {
                        MintAnnouncement(
                            guildId = discordServerService.getGuildIdFromServerId(it.discordServerId!!),
                            channelId = it.channelId,
                            policyId = mintToProcess.policyId,
                            assetFingerprint = if (cip68Token.isValidCip68Token()) AssetUtil.calculateFingerPrint(
                                mintToProcess.policyId,
                                cip68Token.getNft().toHexString()
                            ) else combinedAssetInfo.assetFingerprint.assetFingerprint,
                            referenceTokenAssetFingerprint = if (cip68Token.isValidCip68Token()) AssetUtil.calculateFingerPrint(
                                mintToProcess.policyId,
                                cip68Token.getReferenceToken().toHexString()
                            ) else null,
                            assetNameHex = mintToProcess.assetNameHex,
                            assetName = combinedAssetInfo.assetName,
                            displayName = getItemNameFromAssetInfo(combinedAssetInfo),
                            assetImageUrl = getImageUrlFromAssetInfo(config.mintIpfslink!!, combinedAssetInfo),
                            mintDate = mintToProcess.date,
                            rarityRank = 0,
                            highlightAttributeDisplayName = it.highlightAttributeDisplayName,
                            highlightAttributeValue = it.extractHighlightAttribute(combinedAssetInfo.metadata)
                        )
                    }
                    .forEach {
                        logger.trace { "Sending mint announcement to guild ${it.guildId} and channel ${it.channelId} for mint event with transaction hash ${mintToProcess.transactionHash} and asset $cip68Token" }
                        rabbitTemplate.convertAndSend("mintannouncements", it)
                    }
            } else if (mintToProcess.date.after(Date(System.currentTimeMillis() - KEEP_MINT_EVENTS_WITHOUT_METADATA_MILLISECONDS))) {
                logger.trace { "Retrying mint event with transaction hash ${mintToProcess.transactionHash} as metadata is not yet available" }
                queueToRetry.add(mintToProcess)
            }
        }
        mintQueue.addAll(queueToRetry)
        expireOutdatedMetadata()
    }

    private fun lookUpMetadata(mintToProcess: OuraMintEvent, cip68Token: Cip68Token): Pair<Map<String, Any>?, String> {
        val metadataOfPolicy =
            metadataMap[mintToProcess.transactionHash]?.metadata?.get(mintToProcess.policyId) as Map<String, Any>?
        logger.trace { "Processing mint event with transaction hash ${mintToProcess.transactionHash} and metadata $metadataOfPolicy" }
        if (metadataOfPolicy is Map<String, Any>) {
            logger.trace { "CIP-0068 status for token from transaction ${mintToProcess.transactionHash}: $cip68Token" }
            return if (cip68Token.isValidCip68Token()) {
                Pair(metadataOfPolicy[mintToProcess.assetNameHex] as Map<String, Any>?, cip68Token.assetName)
            } else {
                val assetName = mintToProcess.assetNameHex.decodeHex()
                Pair(metadataOfPolicy[assetName] as Map<String, Any>?, assetName)
            }
        } else {
            val referenceTokenAssetNameHex = cip68Token.getReferenceToken().toHexString()
            val datumHashForAsset = assetsToDatums[referenceTokenAssetNameHex]?.datumHash
            if (datumHashForAsset != null) {
                val metadataOfDatum = datumsToMetadata[datumHashForAsset]?.plutusData
                logger.trace { "Found plutus metadata for asset name ${mintToProcess.assetNameHex} and datum hash $datumHashForAsset" }
                val fields = metadataOfDatum?.get("fields") as List<Any>?
                if (fields != null && fields.firstOrNull() != null) {
                    return Pair(fields.first() as Map<String, Any>?, mintToProcess.assetNameHex.decodeHex())
                }
            }
        }
        return Pair(null, mintToProcess.assetNameHex)
    }

    private fun expireOutdatedMetadata() {
        metadataMap.entries.removeIf { it.value.date.before(Date(System.currentTimeMillis() - KEEP_METADATA_FOR_MILLISECONDS)) }
        assetsToDatums.entries.removeIf { it.value.date.before(Date(System.currentTimeMillis() - KEEP_METADATA_FOR_MILLISECONDS)) }
        datumsToMetadata.entries.removeIf { it.value.date.before(Date(System.currentTimeMillis() - KEEP_METADATA_FOR_MILLISECONDS)) }
    }

}