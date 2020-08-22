const client = require('../gameBot');

module.exports = {
  name: 'games',
  isGame: false,
  description: `Outputs the current games. Usage: ${process.env.prefix}games.`,
  execute(message, args, games) {
    let reply = '';
    //exiting if no games have been created
    if (games.length === 0) {
      return message.reply('No games have been created yet.');
    }
    //looping through games list and outputting game information as text
    games.forEach((game, index) => {
      reply += `index: ${index + 1}, game: ${
        game.name
      }, players: [${game.players.map(
        (player) => player.username
      )}], createdBy: ${game.createdBy.username}, private: ${
        game.isPrivate ? 'yes' : 'no'
      }, started: ${game.started ? 'yes' : 'no'}\n`;
    });
    message.channel.send(reply);
  },
};
