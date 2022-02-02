module.exports = {
  isStakedAddress(address) {
    const stakedAddressRegex = /^addr1[a-z0-9]{98}$/i;
    return stakedAddressRegex.test(address);
  },
};
