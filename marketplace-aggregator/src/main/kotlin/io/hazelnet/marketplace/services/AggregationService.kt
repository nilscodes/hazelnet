package io.hazelnet.marketplace.services

import io.hazelnet.marketplace.data.jpgstore.JpgStoreTransactionAction
import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import mu.KotlinLogging
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClientResponseException
import reactor.core.publisher.Flux
import java.util.*

private val logger = KotlinLogging.logger {}

private val policiesToInfoLog = listOf(
    "915c6730d25a826f7014a97fc4034066132527d59cc255dcb20b0000", // Justice
    "6bba45f822b76bea4e86b6733b05a2628933b05bce814ebd1f7db6a1", // R3in
    "51962deea60aec8b1fd7161e21d61312fbd296ef9f731991335b3f5", // Chief Rex
    "a1a23483764117264791aa80adac1c597bef547dca9e955a4aa229b3", // Selkies
    "42c4948ad7f920b0483418db49e3d67c7d89c590c7e7e596a5566041", // Clayaveras/Cryptolady
    "c90213d8b9a52b8377401bdd4117b125876117322a0332edc08a4725", // Clayaveras/Cryptolady
    "c859e9d7e71b8f90bdc1e453fd1b9adbc5e6163898fb574543cb5be8", // mabool
    "3530c5d7ce77ea067c20bbca7688e18731c8f0c7de456a940eefa27c", // mabool
)

@Service
class AggregationService(
    private val jpgStoreService: JpgStoreService,
    private val rabbitTemplate: RabbitTemplate,
    private val meterRegistry: MeterRegistry,
) {

    private val lastSalesSyncTimeForPolicy: MutableMap<String, Date> = mutableMapOf()
    private val jpgStoreSalesRequestCounter = Counter
        .builder("jpgstore_requestcount_sales")
        .description("Count of requests for aggregating sales from jpg.store")
        .register(meterRegistry)
    private val jpgStoreSalesStatusCounter: Counter.Builder = Counter
        .builder("jpgstore_statuscodes_sales")
        .description("HTTP status codes for encountered errors when aggregating sales from jpg.store")
    private val lastListingsSyncTimeForPolicy: MutableMap<String, Date> = mutableMapOf()
    private val jpgStoreListingsRequestCounter = Counter
        .builder("jpgstore_requestcount_listings")
        .description("Count of requests for aggregating listings from jpg.store")
        .register(meterRegistry)
    private val jpgStoreListingsStatusCounter: Counter.Builder = Counter
        .builder("jpgstore_statuscodes_listings")
        .description("HTTP status codes for encountered errors when aggregating listings from jpg.store")

    @RabbitListener(queues = ["salespolicies"])
    fun processSalesForPolicies(policyId: String) {
        val lastSyncTimeBeforeCall = lastSalesSyncTimeForPolicy[policyId] ?: Date()
        lastSalesSyncTimeForPolicy[policyId] = Date()
        val track = policiesToInfoLog.contains(policyId)
        if (track) {
            logger.info { "Tracking sales for policy $policyId. Previous sync was $lastSyncTimeBeforeCall, this sync is at ${lastSalesSyncTimeForPolicy[policyId]}." }
        }
        jpgStoreSalesRequestCounter.increment()
        jpgStoreService.getSales(listOf(policyId), 1)
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting jpg.store sales for policy $policyId" }
                jpgStoreSalesStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .filter {
                val sold = it.saleDate != null && it.saleDate.after(lastSyncTimeBeforeCall)
                if (track) {
                    logger.info { "Found sale with listing ID ${it.listingId} for item ${it.displayName} and sale date ${it.saleDate}. With last sync at $lastSyncTimeBeforeCall this is considered sold: $sold" }
                }
                sold
            }
            .subscribe { rabbitTemplate.convertAndSend("sales", it.toSalesInfo()) }
        jpgStoreService.getTransactionsForCollection(listOf(policyId), 1)
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting jpg.store transactions for policy $policyId" }
                jpgStoreSalesStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .flatMap { Flux.fromIterable(it.transactions) }
            .filter {
                val offerSold = it.transactionConfirmationDate != null
                    && it.transactionConfirmationDate.after(lastSyncTimeBeforeCall)
                    && it.action == JpgStoreTransactionAction.ACCEPT_OFFER
                if (track) {
                    logger.info { "Found ${it.action} for asset ${it.displayName} with confirmation date ${it.transactionConfirmationDate}. With last sync at $lastSyncTimeBeforeCall this offer is considered sold: $offerSold" }
                }
                offerSold
            }
            .subscribe { rabbitTemplate.convertAndSend("sales", it.toSalesInfo()) }
    }

    @RabbitListener(queues = ["listingspolicies"])
    fun processListingsForPolicies(policyId: String) {
        val lastSyncTimeBeforeCall = lastListingsSyncTimeForPolicy[policyId] ?: Date()
        lastListingsSyncTimeForPolicy[policyId] = Date()
        val track = policiesToInfoLog.contains(policyId);
        if (track) {
            logger.info { "Tracking listings for policy ${policyId}. Previous sync was ${lastSyncTimeBeforeCall}, this sync is at ${lastListingsSyncTimeForPolicy[policyId]}." }
        }
        jpgStoreListingsRequestCounter.increment()
        jpgStoreService.getListings(listOf(policyId), 1)
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting jpg.store listings for policy $policyId" }
                jpgStoreListingsStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .filter {
                val listed = it.listingDate.after(lastSyncTimeBeforeCall)
                if (track) {
                    logger.info { "Found listed with listing ID ${it.listingId} for item ${it.displayName} and listing date ${it.listingDate}. With last sync at $lastSyncTimeBeforeCall this is considered listed: $listed" }
                }
                listed
            }
            .subscribe { rabbitTemplate.convertAndSend("listings", it.toListingsInfo()) }
    }
}