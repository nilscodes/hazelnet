package io.hazelnet.marketplace.services

import io.hazelnet.marketplace.data.plutusart.PlutusArtAction
import io.hazelnet.marketplace.data.plutusart.PlutusArtListingPage
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
class PlutusArtService(
    @Qualifier("plutusArtClient")
    private val connectClient: WebClient,
    private val rabbitTemplate: RabbitTemplate,
    private val meterRegistry: MeterRegistry,
) {
    private val lastSalesSyncTimeForPolicy: MutableMap<String, Date> = mutableMapOf()
    private val lastListingsSyncTimeForPolicy: MutableMap<String, Date> = mutableMapOf()
    private var lastAllSalesSyncTimeForPolicy = Date()
    private var lastAllListingsSyncTimeForPolicy = Date()
    private val plutusArtSalesRequestCounter = Counter
        .builder("plutusart_requestcount_sales")
        .description("Count of requests for aggregating sales from plutus.art")
        .register(meterRegistry)
    private val plutusArtSalesStatusCounter: Counter.Builder = Counter
        .builder("plutusart_statuscodes_sales")
        .description("HTTP status codes for encountered errors when aggregating sales from plutus.art")
    private val plutusArtListingsRequestCounter = Counter
        .builder("plutusart_requestcount_listings")
        .description("Count of requests for aggregating listings from plutus.art")
        .register(meterRegistry)
    private val plutusArtListingsStatusCounter: Counter.Builder = Counter
        .builder("plutusart_statuscodes_listings")
        .description("HTTP status codes for encountered errors when aggregating listings from plutus.art")

    fun processSalesForPolicy(policyId: String, policiesToInfoLog: List<String>) {
        val lastSyncTimeBeforeCall = lastSalesSyncTimeForPolicy[policyId] ?: Date()
        val now = Date()
        val track = policiesToInfoLog.contains(policyId)
        if (track) {
            logger.info { "Tracking plutus.art sales for policy $policyId. Previous sync was $lastSyncTimeBeforeCall, this sync is at $now." }
        }
        plutusArtSalesRequestCounter.increment()
        this.getSales(listOf(policyId))
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting plutus.art sales for policy $policyId" }
                plutusArtSalesStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .flatMap { Flux.fromIterable(it.listings) }
            .filter {
                val sold = it.state.isConfirmed && it.updatedAt != null && it.updatedAt.after(lastSyncTimeBeforeCall)
                if (track) {
                    logger.info { "Found sale with listing ID ${it.internalId} for item ${it.getDisplayName()} and sale date ${it.updatedAt}. With last sync at $lastSyncTimeBeforeCall this is considered sold: $sold" }
                }
                sold
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
            logger.info { "Tracking plutus.art listings for policy ${policyId}. Previous sync was ${lastSyncTimeBeforeCall}, this sync is at $now." }
        }
        plutusArtListingsRequestCounter.increment()
        this.getListings(listOf(policyId))
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting plutus.art listings for policy $policyId" }
                plutusArtListingsStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .flatMap { Flux.fromIterable(it.listings) }
            .filter {
                val listed = it.state.isConfirmed && it.createdAt.after(lastSyncTimeBeforeCall)
                if (track) {
                    logger.info { "Found listed with listing ID ${it.internalId} for item ${it.getDisplayName()} and listing date ${it.createdAt}. With last sync at $lastSyncTimeBeforeCall this is considered listed: $listed" }
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

    fun processAllSales() {
        val lastSyncTimeBeforeCall = lastAllSalesSyncTimeForPolicy
        val now = Date()
        plutusArtSalesRequestCounter.increment()
        this.getAllActivity(PlutusArtAction.Accept)
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting plutus.art sales for all-sales tracker" }
                plutusArtSalesStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .flatMap { Flux.fromIterable(it.listings) }
            .filter {  it.state.isConfirmed && it.updatedAt != null && it.updatedAt.after(lastSyncTimeBeforeCall)  }
            .doFinally {
                if (it == SignalType.ON_COMPLETE) {
                    lastAllSalesSyncTimeForPolicy = now
                }
            }
            .subscribe { rabbitTemplate.convertAndSend("sales", it.toSalesInfo(true)) }
    }

    fun processAllListings() {
        val lastSyncTimeBeforeCall = lastAllListingsSyncTimeForPolicy
        val now = Date()
        plutusArtListingsRequestCounter.increment()
        this.getAllActivity(PlutusArtAction.Offer)
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting plutus.art listings for all-listings tracker" }
                plutusArtListingsStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .flatMap { Flux.fromIterable(it.listings) }
            .filter { it.state.isConfirmed && it.createdAt.after(lastSyncTimeBeforeCall) }
            .doFinally {
                if (it == SignalType.ON_COMPLETE) {
                    lastAllListingsSyncTimeForPolicy = now
                }
            }
            .subscribe { rabbitTemplate.convertAndSend("listings", it.toListingsInfo(true)) }
    }

    private fun getListings(policyIds: List<String>): Flux<PlutusArtListingPage> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/collection/$it/offers")
                            .queryParam("page", "0")
                            .queryParam("count", "10")
                            .queryParam("sort", "new")
                            .queryParam("sortOrder", "desc")
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(PlutusArtListingPage::class.java)
            }
    }

    private fun getSales(policyIds: List<String>): Flux<PlutusArtListingPage> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/collection/$it/activity")
                            .queryParam("page", "0")
                            .queryParam("count", "10")
                            .queryParam("sort", "new")
                            .queryParam("sortOrder", "desc")
                            .queryParam("action", PlutusArtAction.Accept.name)
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(PlutusArtListingPage::class.java)
            }
    }

    private fun getAllActivity(action: PlutusArtAction): Flux<PlutusArtListingPage> {
        return connectClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/search/activity")
                    .queryParam("page", "0")
                    .queryParam("count", "10")
                    .queryParam("sort", "new")
                    .queryParam("sortOrder", "desc")
                    .queryParam("action", action.name)
                    .build()
            }
            .retrieve()
            .bodyToFlux(PlutusArtListingPage::class.java)
    }
}