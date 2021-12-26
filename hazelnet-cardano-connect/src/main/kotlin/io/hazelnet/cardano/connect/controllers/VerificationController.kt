package io.hazelnet.cardano.connect.controllers

import io.hazelnet.cardano.connect.data.verifications.VerificationConfirmation
import io.hazelnet.cardano.connect.services.VerificationService
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping(("/verification"))
class VerificationController(
        private val verificationService: VerificationService
)
{
    @GetMapping("/{walletAddress}")
    @ResponseStatus(HttpStatus.OK)
    fun verifyAddress(
            @PathVariable walletAddress: String,
            @RequestParam verificationAmount : Long,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) earliestBlockTime : Date
    ) : VerificationConfirmation {
        return verificationService.verify(walletAddress, verificationAmount, earliestBlockTime)
    }
}