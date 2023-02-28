package io.hazelnet.marketplace.services

import io.hazelnet.marketplace.data.jpgstore.JpgStoreListingPage
import io.hazelnet.marketplace.data.jpgstore.JpgStoreSalesInfo
import io.hazelnet.marketplace.data.jpgstore.JpgStoreTransactionAction
import io.hazelnet.marketplace.data.jpgstore.JpgStoreTransactionsContainer
import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import mu.KotlinLogging
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import reactor.core.publisher.Flux
import reactor.core.publisher.SignalType
import java.util.*

private val logger = KotlinLogging.logger {}

@Service
class JpgStoreService(
    @Qualifier("jpgStoreClient")
    private val connectClient: WebClient,
    private val rabbitTemplate: RabbitTemplate,
    private val meterRegistry: MeterRegistry,
) {

    private val lastSalesSyncTimeForPolicy: MutableMap<String, Date> = mutableMapOf()
    private val lastListingsSyncTimeForPolicy: MutableMap<String, Date> = mutableMapOf()
    private val jpgStoreSalesRequestCounter = Counter
        .builder("jpgstore_requestcount_sales")
        .description("Count of requests for aggregating sales from jpg.store")
        .register(meterRegistry)
    private val jpgStoreSalesStatusCounter: Counter.Builder = Counter
        .builder("jpgstore_statuscodes_sales")
        .description("HTTP status codes for encountered errors when aggregating sales from jpg.store")
    private val jpgStoreListingsRequestCounter = Counter
        .builder("jpgstore_requestcount_listings")
        .description("Count of requests for aggregating listings from jpg.store")
        .register(meterRegistry)
    private val jpgStoreListingsStatusCounter: Counter.Builder = Counter
        .builder("jpgstore_statuscodes_listings")
        .description("HTTP status codes for encountered errors when aggregating listings from jpg.store")

    fun processSalesForPolicy(policyId: String, policiesToInfoLog: List<String>) {
        val lastSyncTimeBeforeCall = lastSalesSyncTimeForPolicy[policyId] ?: Date()
        val now = Date()
        val track = policiesToInfoLog.contains(policyId)
        if (track) {
            logger.info { "Tracking jpg.store sales for policy $policyId. Previous sync was $lastSyncTimeBeforeCall, this sync is at $now." }
        }
        jpgStoreSalesRequestCounter.increment()
        this.getSales(listOf(policyId), 1)
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
        this.getTransactionsForCollection(listOf(policyId), 1)
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

    fun processListingsForPolicy(policyId: String, policiesToInfoLog: List<String>) {
        val lastSyncTimeBeforeCall = lastListingsSyncTimeForPolicy[policyId] ?: Date()
        val now = Date()
        val track = policiesToInfoLog.contains(policyId);
        if (track) {
            logger.info { "Tracking jpg.store listings for policy ${policyId}. Previous sync was ${lastSyncTimeBeforeCall}, this sync is at $now." }
        }
        jpgStoreListingsRequestCounter.increment()
        this.getListings(listOf(policyId))
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting jpg.store listings for policy $policyId" }
                jpgStoreListingsStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .flatMap { Flux.fromIterable(it.listings) }
            .filter {
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

    private fun getListings(policyIds: List<String>): Flux<JpgStoreListingPage> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/policy/$it/listings")
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(JpgStoreListingPage::class.java)
            }
    }

    private fun getSales(policyIds: List<String>, page: Int): Flux<JpgStoreSalesInfo> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/policy/$it/sales")
                            .queryParam("page", page)
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(JpgStoreSalesInfo::class.java)
            }
    }

    private fun getTransactionsForCollection(policyIds: List<String>, page: Int): Flux<JpgStoreTransactionsContainer> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/collection/$it/transactions")
                            .queryParam("page", page)
                            .queryParam("count", 50)
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(JpgStoreTransactionsContainer::class.java)
            }
    }
}