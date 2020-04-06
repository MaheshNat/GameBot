const client = require('../gameBot');

module.exports = {
  name: 'leave',
  isGame: false,
  description:
    'Allows the user to leave the game they are part of. Usage: !leave',
  execute(message, args, games) {
    //finding the game the user wants to leave
    let game = games.find((game) => game.players.includes(message.author));
    if (!game)
      return message.reply(
        'You have to be playing a game to use this command.'
      );

    //if the user is the creator of the game, the game is deleted
    if (game.createdBy === message.author) {
      message.reply(
        `Sucessfully ended a game of ${game.name}. Since you are the creator, this game will be discontinued.`
      );
      return games.splice(game, 1);
    }
    message.reply(
      `Sucessfully left a game of ${game.name} hosted by ${game.createdBy}.`
    );

    //finding the index of the game the user wants to leave
    let index = games.indexOf(game);
    //removing the player from the game's player array
    game.players.splice(message.author, 1);
    //removing the game if no players left, otherwise updating game
    if (game.players.length === 0) games.splice(index, index);
    else games[index] = game;
  },
};
