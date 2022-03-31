module.exports = {
  isValidName(pollName) {
    const pollNameRegex = /^[A-Za-z][-A-Za-z0-9]{0,29}$/;
    return pollNameRegex.test(pollName);
  },
  hasVotingEnded(poll) {
    if (poll.openUntil) {
      return new Date(poll.openUntil) < new Date();
    }
    return false;
  },
  hasVotingStarted(poll) {
    if (poll.openAfter) {
      return new Date(poll.openAfter) < new Date();
    }
    return true;
  },
  isPollArchived(poll) {
    return !!poll.closed;
  },
  userCanSeePoll(member, poll) {
    if (!this.isPollArchived(poll)) {
      if (poll.requiredRoles?.length) {
        const needsAnyOfRoleIds = poll.requiredRoles.map((role) => role.roleId);
        return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
      }
      return true;
    }
    return false;
  },
  userCanVoteInPoll(member, poll, votingWeight) {
    if (!this.isPollArchived(poll) && !this.hasVotingEnded(poll) && this.hasVotingStarted(poll) && votingWeight > 0) {
      const needsAnyOfRoleIds = poll.requiredRoles.map((role) => role.roleId);
      return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
    }
    return false;
  },
};
