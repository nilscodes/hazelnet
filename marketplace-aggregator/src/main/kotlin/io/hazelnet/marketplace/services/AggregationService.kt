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
import reactor.core.publisher.SignalType
import java.util.*

private val logger = KotlinLogging.logger {}

private val policiesToInfoLog: List<String> = listOf()

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
        val now = Date()
        val track = policiesToInfoLog.contains(policyId)
        if (track) {
            logger.info { "Tracking sales for policy $policyId. Previous sync was $lastSyncTimeBeforeCall, this sync is at $now." }
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
            .doFinally {
                if (it == SignalType.ON_COMPLETE) {
                    lastSalesSyncTimeForPolicy[policyId] = now
                }
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
            .doFinally {
                if (it == SignalType.ON_COMPLETE) {
                    lastSalesSyncTimeForPolicy[policyId] = now
                }
            }
            .subscribe { rabbitTemplate.convertAndSend("sales", it.toSalesInfo()) }
    }

    @RabbitListener(queues = ["listingspolicies"])
    fun processListingsForPolicies(policyId: String) {
        val lastSyncTimeBeforeCall = lastListingsSyncTimeForPolicy[policyId] ?: Date()
        val now = Date()
        val track = policiesToInfoLog.contains(policyId);
        if (track) {
            logger.info { "Tracking listings for policy ${policyId}. Previous sync was ${lastSyncTimeBeforeCall}, this sync is at $now." }
        }
        jpgStoreListingsRequestCounter.increment()
        jpgStoreService.getListings(listOf(policyId))
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting jpg.store listings for policy $policyId" }
                jpgStoreListingsStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .flatMap { Flux.fromIterable(it.listings) }
            .filter {
                 // Only update on successful retrieval
                val listed = it.listingDate.after(lastSyncTimeBeforeCall)
                if (track) {
                    logger.info { "Found listed with listing ID ${it.listingId} for item ${it.displayName} and listing date ${it.listingDate}. With last sync at $lastSyncTimeBeforeCall this is considered listed: $listed" }
                }
                listed
            }
            .doFinally {
                if (it == SignalType.ON_COMPLETE) {
                    lastListingsSyncTimeForPolicy[policyId] = now
                }
            }
            .subscribe { rabbitTemplate.convertAndSend("listings", it.toListingsInfo()) }
    }
}