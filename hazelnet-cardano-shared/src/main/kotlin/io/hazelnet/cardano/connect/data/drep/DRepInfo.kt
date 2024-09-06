package io.hazelnet.cardano.connect.data.drep

data class DRepInfo(
    val hash: String,
    val view: String,
    val name: String,
) {
    override fun toString(): String {
        return "DRepInfo(hash='$hash', view='$view', name='$name')"
    }
}
