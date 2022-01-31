package io.hazelnet.cardano.connect.services

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

internal class AddressServiceTest {
    @Test
    fun getStakeKeyViewFromAddressValid()
    {
        val stakeKeyView = AddressService.getStakeKeyViewFromAddress("addr1q8wuxchxv28pr57r2prxgxyl306jwgm5cu023acvqsm85n9puwaam680mej3fukzxc8pj2kxsd5zuktf3yh5n570576qt7lvuw")
        assertEquals("stake1uxs78w7aarhaueg57tprvrse9trgx6pwt95cjt6f60860dqx794d6", stakeKeyView)
    }

    @Test
    fun getStakeKeyViewFromAddressUnstaked()
    {
        val stakeKeyView = AddressService.getStakeKeyViewFromAddress("addr1vx7wprnjyu6al5vr3mqcxkeruclljmyq8dgkh746g2zchaqaar77j")
        assertNull(stakeKeyView)
    }
}