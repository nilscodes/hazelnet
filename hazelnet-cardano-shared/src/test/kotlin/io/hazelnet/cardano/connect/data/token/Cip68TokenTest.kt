package io.hazelnet.cardano.connect.data.token

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

const val STARSHIP_HEX = "000de1407374617273686970303033353934"
val STARSHIP = Cip68Token(STARSHIP_HEX)

class Cip68TokenTest {
    @Test
    fun `valid full hex name including label can be detected`() {
        assertEquals(222, STARSHIP.assetClass.label)
        assertEquals("starship003594", STARSHIP.assetName)
    }

    @Test
    fun `check token name validity`() {
        assertTrue(Cip68Token(STARSHIP_HEX).isValidCip68Token())
        assertFalse(Cip68Token("436c61794e6174696f6e39323031").isValidCip68Token())
    }

    @Test
    fun `toString representation`() {
        assertEquals("(222)starship003594", STARSHIP.toString())
    }

    @Test
    fun `get reference token hexname from nft token`() {
        val starshipNft = Cip68Token(STARSHIP_HEX)
        val starshipRef = Cip68Token(Cip67Label(100), "starship003594")
        assertEquals(starshipRef, starshipNft.getReferenceToken())
    }

    @Test
    fun `nft asset hex can be generated from scratch`() {
        assertEquals(
            STARSHIP_HEX,
            Cip68Token(Cip67Label(222), "starship003594").toHexString()
        )
        assertEquals(
            "000643b07374617273686970303033353934",
            Cip68Token(Cip67Label(100), "starship003594").toHexString()
        )
    }

    @Test
    fun `can recover original hex name for non CIP-0068 token name`() {
        val nonCip68Token = Cip68Token("436c61794e6174696f6e39323031")
        assertEquals("436c61794e6174696f6e39323031", nonCip68Token.toHexString())
    }

    @Test
    fun `cip67 test vectors work`() {
        assertEquals(0, Cip67Label("00000000").label)
        assertEquals(1, Cip67Label("00001070").label)
        assertEquals(23, Cip67Label("00017650").label)
        assertEquals(99, Cip67Label("000632e0").label)
        assertEquals(533, Cip67Label("00215410").label)
        assertEquals(2000, Cip67Label("007d0550").label)
        assertEquals(4567, Cip67Label("011d7690").label)
        assertEquals(11111, Cip67Label("02b670b0").label)
        assertEquals(49328, Cip67Label("0c0b0f40").label)
        assertEquals(65535, Cip67Label("0ffff240").label)
    }

    @Test
    fun `cip67 labels convert correctly into hex`() {
        assertEquals("00000000", Cip67Label(0).toString())
        assertEquals("00001070", Cip67Label(1).toString())
        assertEquals("00017650", Cip67Label(23).toString())
        assertEquals("000632e0", Cip67Label(99).toString())
        assertEquals("00215410", Cip67Label(533).toString())
        assertEquals("007d0550", Cip67Label(2000).toString())
        assertEquals("011d7690", Cip67Label(4567).toString())
        assertEquals("02b670b0", Cip67Label(11111).toString())
        assertEquals("0c0b0f40", Cip67Label(49328).toString())
        assertEquals("0ffff240", Cip67Label(65535).toString())
    }

}