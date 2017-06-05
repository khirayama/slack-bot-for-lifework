const users = [{
  slack: 'khirayama',
  github: 'khirayama',
  kibela: 'khirayama',
}];

module.exports = {
  users,
  github2slack: (githubName) => {
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user.github === githubName) {
        return user.slack;
      }
    }
    return null;
  },
};
