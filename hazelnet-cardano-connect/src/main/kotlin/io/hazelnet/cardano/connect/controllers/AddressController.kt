package io.hazelnet.cardano.connect.controllers

import io.hazelnet.cardano.connect.data.address.AddressDetails
import io.hazelnet.cardano.connect.services.AddressService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping(("/wallets"))
class AddressController(
    private val walletService: AddressService
) {
    @GetMapping("/{walletAddress}")
    @ResponseStatus(HttpStatus.OK)
    fun walletInfo(@PathVariable walletAddress: String) = walletService.getAddress(walletAddress)

    @GetMapping("/{walletAddress}/assets/{policyId}")
    @ResponseStatus(HttpStatus.OK)
    fun walletAssets(@PathVariable walletAddress: String, @PathVariable policyId: String) =
        walletService.getAssetsFromPolicyAtAddress(walletAddress, policyId)

    @GetMapping("/{walletAddress}/handles")
    @ResponseStatus(HttpStatus.OK)
    fun walletHandles(@PathVariable walletAddress: String) =
        walletService.getHandlesAtAddress(walletAddress)
}