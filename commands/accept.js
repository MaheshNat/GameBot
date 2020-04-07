const client = require('../gameBot');

module.exports = {
  name: 'accept',
  isGame: false,
  description:
    'Allows a game creator to invite another user to their private game. Usage: !accept @<username>',
  execute(message, args, games) {
    //finding the game the user created
    let game = games.find((game) => game.createdBy === message.author);
    if (!game)
      return message.reply(
        'You have to be the creator of a game in order to use this command.'
      );

    if (message.mentions.members.length === 0)
      return message.reply('You have to mention a user to accept.');

    let player = message.mentions.users.first(1)[0];

    if (!game.requests.includes(player))
      return message.reply(
        `${player.username} has not sent a request to join your game yet.`
      );

    game.players.push(player);
    message.reply(`Successfully accepted ${player.username} into the game.`);

    let command = client.commands.get(game.name);
    if (joinGame.players.length === command.players)
      command.execute(message, args, games);
  },
};
