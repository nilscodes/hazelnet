package io.hazelnet.cardano.connect.controllers

import io.hazelnet.cardano.connect.data.payment.PaymentConfirmation
import io.hazelnet.cardano.connect.services.PaymentService
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/payment")
class PaymentController(
    private val paymentService: PaymentService,
) {
    @GetMapping("/{walletAddress}")
    @ResponseStatus(HttpStatus.OK)
    fun verifyAddress(
        @PathVariable walletAddress: String,
        @RequestParam paymentAmount : Long,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) earliestBlockTime : Date
    ) : PaymentConfirmation {
        return paymentService.verify(walletAddress, paymentAmount, earliestBlockTime)
    }
}