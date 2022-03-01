package io.hazelnet.community.controllers

import io.hazelnet.community.data.claim.PhysicalProduct
import io.hazelnet.community.services.ClaimListService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/products")
class ProductController(
    private val claimListService: ClaimListService
) {

    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun addProduct(@RequestBody @Valid physicalProduct: PhysicalProduct): ResponseEntity<PhysicalProduct> {
        val newPhysicalProduct = claimListService.addPhysicalProduct(physicalProduct)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{productId}")
                .buildAndExpand(newPhysicalProduct.id)
                .toUri())
            .body(newPhysicalProduct)
    }

    @GetMapping("/{productId}")
    @ResponseStatus(HttpStatus.OK)
    fun getProduct(@PathVariable productId: Int) = claimListService.getProduct(productId)
}