module.exports = {
  isValidName(pollName) {
    const pollNameRegex = /^[A-Za-z][-A-Za-z0-9]{0,29}$/;
    return pollNameRegex.test(pollName);
  },
  hasVotingEnded(poll) {
    if (poll.signupUntil) {
      return new Date(poll.signupUntil) < new Date();
    }
    return false;
  },
  hasVotingStarted(poll) {
    if (poll.signupAfter) {
      return new Date(poll.signupAfter) < new Date();
    }
    return true;
  },
  isPollArchived(poll) {
    return !!poll.closed;
  },
  async userCanSeePoll(member, poll) {
    if (!this.isPollArchived(poll)) {
      if (poll.requiredRoles?.length) {
        const needsAnyOfRoleIds = poll.requiredRoles.map((role) => role.roleId);
        return member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
      }
      return true;
    }
    return false;
  },
  async userCanVoteInPoll(member, poll, votingWeight) {
    if (!this.isPollArchived(poll) && !this.hasVotingEnded(poll) && this.hasVotingStarted(poll) && votingWeight > 0) {
      return member.roles.cache.some((role) => role.id === poll.requiredRoleId);
    }
    return false;
  },
};
