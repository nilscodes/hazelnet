module.exports = {
  isValidName(pollName) {
    const pollNameRegex = /^[A-Za-z][-A-Za-z0-9]{0,29}$/;
    return pollNameRegex.test(pollName);
  },
};
