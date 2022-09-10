package io.hazelnet.cardano.connect.data.address

data class Handle(val handle: String, val address: String? = null, val resolved: Boolean = true, val image: String? = null) {
    override fun toString(): String {
        return "Handle(handle='$handle', address=$address, resolved=$resolved, image=$image)"
    }

    fun augmentWithImage(image: String) = Handle(handle, address, resolved, image)

}