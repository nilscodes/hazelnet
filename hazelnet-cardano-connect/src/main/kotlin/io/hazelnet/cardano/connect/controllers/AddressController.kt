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
    fun walletInfo(@PathVariable walletAddress: String): AddressDetails = walletService.getAddress(walletAddress)
}