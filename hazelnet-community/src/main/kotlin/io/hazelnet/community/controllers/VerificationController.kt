package io.hazelnet.community.controllers

import io.hazelnet.community.data.ExposedWallet
import io.hazelnet.community.data.VerificationRequest
import io.hazelnet.community.services.VerificationService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
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

    @GetMapping("/{verificationId}/exposedwallets")
    @ResponseStatus(HttpStatus.OK)
    fun getExposedWallets(@PathVariable verificationId: Long) = verificationService.getExposedWallets(verificationId)

    @PostMapping("/{verificationId}/exposedwallets")
    @ResponseStatus(HttpStatus.CREATED)
    fun addExposedWallet(@PathVariable verificationId: Long, @RequestBody @Valid exposedWallet: ExposedWallet): ResponseEntity<ExposedWallet> {
        val exposedWallet = verificationService.addExposedWallet(verificationId, exposedWallet)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{exposedWalletId}")
                    .buildAndExpand(exposedWallet.id)
                    .toUri()
            )
            .body(exposedWallet)
    }

    @DeleteMapping("/{verificationId}/exposedwallets/{exposedWalletId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteExposedWallet(@PathVariable verificationId: Long, @PathVariable exposedWalletId: Long) = verificationService.deleteExposedWallet(verificationId, exposedWalletId)
}