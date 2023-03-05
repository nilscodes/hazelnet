package io.hazelnet.cardano.connect.data.token

import com.github.snksoft.crc.CRC
import io.hazelnet.cardano.connect.util.toHex
import io.hazelnet.shared.decodeHex

data class Cip68Token(val assetClass: Cip67Label, val assetName: String) {
    constructor(fullAssetNameHex: String) : this(
        Cip67Label(fullAssetNameHex),
        if(Cip67Label(fullAssetNameHex).label == -1) fullAssetNameHex else fullAssetNameHex.substring(8).decodeHex()
    )

    fun isValidCip68Token(): Boolean {
        return assetClass.label >= 0
    }

    fun toHexString(): String {
        return "$assetClass${assetName.toByteArray(Charsets.UTF_8).toHex()}"
    }

    override fun toString(): String {
        return "(${assetClass.label})$assetName"
    }

    fun getReferenceToken() = Cip68Token(Cip67Label(100), assetName)
}

data class Cip67Label(val label: Int) {
    init {
        require(label in -1..65535)
    }

    constructor(assetLabelHex: String) : this(assetLabelHex.getCip67LabelNum())

    override fun toString(): String {
        if (label >= 0) {
            val paddedHex = label.toString(16).padStart(4, '0')
            val checksum = crc8ChecksumFromHexString(paddedHex).toInt().toString(16).padStart(2, '0')
            return "0${paddedHex}${checksum}0"
        }
        throw IllegalArgumentException("Invalid CIP-0067 label name \"$this\"")
    }
}

private fun String.getCip67LabelNum(): Int {
    if (this.length >= 8 && this[0] == '0' && this[7] == '0') {
        val numHex = this.substring(1, 5)
        val check = Integer.decode("0x${this.substring(5, 7)}").toLong()
        val calculatedChecksum = crc8ChecksumFromHexString(numHex)
        if (check == calculatedChecksum) {
            return Integer.decode("0x$numHex");
        }
    }
    return -1
}

private fun crc8ChecksumFromHexString(numHex: String): Long {
    val numHexBytes = numHex.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
    return CRC.calculateCRC(CRC.Parameters(8, 0x07, 0, false, false, 0), numHexBytes)
}
