package io.hazelnet.cardano.connect.data.address

data class Handle(val handle: String, val address: String? = null, val resolved: Boolean = true) {
    override fun toString(): String {
        return "Handle(handle='$handle', address=$address, resolved=$resolved)"
    }
}