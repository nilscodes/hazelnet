package io.hazelnet.community.controllers

import io.hazelnet.community.data.VerificationRequest
import io.hazelnet.community.services.VerificationService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

@RestController
@RequestMapping("/verifications")
class VerificationController(
        private val verificationService: VerificationService
) {
    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun startVerification(@RequestBody @Valid verificationRequest: VerificationRequest) = verificationService.createVerificationRequest(verificationRequest)

    @GetMapping("/{verificationId}")
    @ResponseStatus(HttpStatus.OK)
    fun getVerification(@PathVariable verificationId: Long) = verificationService.getVerificationInfo(verificationId)

    @DeleteMapping("/{verificationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteVerification(@PathVariable verificationId: Long) = verificationService.deleteVerification(verificationId)
}