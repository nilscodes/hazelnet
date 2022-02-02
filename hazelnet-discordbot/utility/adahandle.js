module.exports = {
  isHandle(addressOrHandle) {
    const handleRegex = /^\$[-._a-zA-Z0-9]{1,15}$/i;
    return handleRegex.test(addressOrHandle);
  },
};
