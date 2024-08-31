package io.hazelnet.shared

import io.hazelnet.shared.data.BlockchainType
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

internal class BlockchainAddressValidatorTest {
    @Test
    fun `can get Bitcoin type for ordinals taproot address`() {
        val address = "bc1pm20dfneq2cg37hfjn6yzhddeqp3w7pu5tvtvrtdyznt3tr6rrhxq05ugf9"
        val blockchainType = BlockchainAddressValidator.blockchainFromAddress(address)
        assertEquals(setOf(BlockchainType.BITCOIN), blockchainType)
    }

    @Test
    fun `can get Bitcoin type for all caps ordinals taproot address`() {
        val address = "bc1pm20dfneq2cg37hfjn6yzhddeqp3w7pu5tvtvrtdyznt3tr6rrhxq05ugf9".uppercase()
        val blockchainType = BlockchainAddressValidator.blockchainFromAddress(address)
        assertEquals(setOf(BlockchainType.BITCOIN), blockchainType)
    }

    @Test
    fun `can get Bitcoin type for regular payment address`() {
        val address = "39KqspQnJHCb1VxkGYDQNFeEWj3B9e6cAH"
        val blockchainType = BlockchainAddressValidator.blockchainFromAddress(address)
        assertEquals(setOf(BlockchainType.BITCOIN), blockchainType)
    }

    @Test
    fun `can get Cardano type for regular payment address`() {
        val address = "addr1q8q7jyap76l0d5gqj8naw5t49yu3f0h7qkzsps9z0gfjcu25uj747vu83mvg3fuh6ttdgwshjwtcne6esrpct2uzmnuqdqd82j"
        val blockchainType = BlockchainAddressValidator.blockchainFromAddress(address)
        assertEquals(setOf(BlockchainType.CARDANO), blockchainType)
    }

    @Test
    fun `can get Cardano type for all caps regular payment address`() {
        val address = "addr1q8q7jyap76l0d5gqj8naw5t49yu3f0h7qkzsps9z0gfjcu25uj747vu83mvg3fuh6ttdgwshjwtcne6esrpct2uzmnuqdqd82j".uppercase()
        val blockchainType = BlockchainAddressValidator.blockchainFromAddress(address)
        assertEquals(setOf(BlockchainType.CARDANO), blockchainType)
    }

    @Test
    fun `can get Ethereum and Polygon type for regular payment address`() {
        val address = "0x76D65cfDBd4314EAe011a3dc362AF3d31865Cf12"
        val blockchainType = BlockchainAddressValidator.blockchainFromAddress(address)
        assertEquals(setOf(BlockchainType.ETHEREUM, BlockchainType.POLYGON), blockchainType)
    }

    @Test
    fun `can get Ethereum and Polygon type for lowercase regular payment address`() {
        val address = "0x76D65cfDBd4314EAe011a3dc362AF3d31865Cf12".lowercase()
        val blockchainType = BlockchainAddressValidator.blockchainFromAddress(address)
        assertEquals(setOf(BlockchainType.ETHEREUM, BlockchainType.POLYGON), blockchainType)
    }

}