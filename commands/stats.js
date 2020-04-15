const mongoose = require('mongoose');
const User = require('../models/user.js');

module.exports = {
  name: 'stats',
  description: 'Sends the stats for a given user.',
  execute(message, args, games) {
    User.findOne({ name: message.author.username }, (err, user) => {
      if (err) console.log(err);
      if (!user) return message.reply('You do not have any stats yet.');
      return message.reply(
        `you have ${user.blackTriplePoints} black triple points.`
      );
    });
  },
};
