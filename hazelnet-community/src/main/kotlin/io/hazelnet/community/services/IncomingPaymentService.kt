package io.hazelnet.community.services

import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.HandleNotResolvedException
import io.hazelnet.community.data.IncomingPaymentAlreadyRequestedException
import io.hazelnet.community.data.premium.IncomingDiscordPayment
import io.hazelnet.community.data.premium.IncomingDiscordPaymentRequest
import io.hazelnet.community.persistence.IncomingDiscordPaymentRepository
import mu.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClientResponseException
import java.lang.IllegalStateException
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit
import java.util.*
import javax.transaction.Transactional

private val logger = KotlinLogging.logger {}

@Service
class IncomingPaymentService(
    private val config: CommunityApplicationConfiguration,
    private val connectService: ConnectService,
    private val incomingDiscordPaymentRepository: IncomingDiscordPaymentRepository,
    private val discordServerService: DiscordServerService,
    private val billingService: BillingService,
) {
    @Transactional
    fun requestIncomingPayment(guildId: Long, incomingDiscordPaymentRequest: IncomingDiscordPaymentRequest): IncomingDiscordPayment {
        if (config.fundedhandle != null) {
            val discordServer = discordServerService.getDiscordServer(guildId)
            val existingIncomingPayment = incomingDiscordPaymentRepository.findByDiscordServerId(discordServer.id!!)
            if (existingIncomingPayment.isPresent) {
                throw IncomingPaymentAlreadyRequestedException("A payment of ${existingIncomingPayment.get().amount} lovelace for guild $guildId is already in progress")
            }
            val handleToReceive = connectService.resolveHandle(config.fundedhandle)
            if (handleToReceive.resolved) {
                val maxVerificationWaitTimeInMinutes = 24 * 60L
                val exactPaymentAmount = getUniquePaymentAmount(incomingDiscordPaymentRequest.refillAmount)
                val validAfter = ZonedDateTime.now().toInstant()
                val validBefore = validAfter.plus(maxVerificationWaitTimeInMinutes, ChronoUnit.MINUTES)
                val newIncomingDiscordPayment = IncomingDiscordPayment(
                    null,
                    handleToReceive.address!!,
                    exactPaymentAmount,
                    discordServer,
                    Date.from(validAfter),
                    Date.from(validBefore),
                )
                return incomingDiscordPaymentRepository.save(newIncomingDiscordPayment)
            }
            throw HandleNotResolvedException("The handle with the name ${handleToReceive.handle} could not be resolved to a valid address")
        }
        throw IllegalArgumentException("Bot not in premium mode")
    }

    private fun getUniquePaymentAmount(refillAmount: Long): Long {
        val outstandingPayments = incomingDiscordPaymentRepository.findAll()
        val usedAmounts = outstandingPayments.map { it.amount }
        var paymentAmount: Long
        var amountFound = false
        var attempts = 0
        do {
            paymentAmount = refillAmount + (0..9999).random().toLong()
            if (!usedAmounts.contains(paymentAmount)) {
                amountFound = true
            }
            if (attempts++ > 10000) {
                throw IllegalStateException("Too many incoming payments to generate a unique payment amount")
            }
        } while (!amountFound)
        return paymentAmount
    }

    fun getCurrentPayment(guildId: Long): IncomingDiscordPayment {
        val discordServer = discordServerService.getDiscordServer(guildId)
        return incomingDiscordPaymentRepository.findByDiscordServerId(discordServer.id!!)
            .orElseThrow()
    }

    fun cancelIncomingPayment(guildId: Long) {
        val payment = getCurrentPayment(guildId)
        incomingDiscordPaymentRepository.delete(payment)
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 5000)
    fun runPaymentChecks() {
        incomingDiscordPaymentRepository.deleteExpired(Date())
        val outstandingIncomingPayments = incomingDiscordPaymentRepository.findAll()
        for (incomingPayment in outstandingIncomingPayments) {
            try {
                val confirmation = connectService.getPaymentStatus(incomingPayment)
                billingService.confirmPayment(incomingPayment, confirmation)
                incomingDiscordPaymentRepository.delete(incomingPayment)
            } catch (e: WebClientResponseException) {
                logger.debug { "No valid payment with amount ${incomingPayment.amount} found for ${incomingPayment.receivingAddress} for payment with ID ${incomingPayment.id}" }
            }
        }
    }

}