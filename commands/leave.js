const client = require('../gameBot');

module.exports = {
  name: 'leave',
  isGame: false,
  description: 'Allows the user to leave a game.',
  execute(message, args, games) {
    let game = games.find((game) =>
      game.players.includes(message.author.username)
    );
    if (!game)
      return message.reply(
        'You have to be playing a game to use this command.'
      );
    if (game.createdBy === message.author.username) {
      message.reply(
        `Sucessfully ended a game of ${game.name}. Since you are the creator, this game will be discontinued.`
      );
      return games.splice(game);
    }
    message.reply(
      `Sucessfully left a game of ${game.name} hosted by ${game.createdBy}.`
    );
    let index = games.indexOf(game);
    game.players.splice(message.author.username, 1);
    if (game.players.length === 0) games.splice(index, index);
    else games[index] = game;
  },
};
