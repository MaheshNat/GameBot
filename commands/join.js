const client = require('../gameBot');

module.exports = {
  name: 'join',
  isGame: false,
  description: `Allows the user to a join a game with a specific index. Usage: ${process.env.prefix}join <int>`,
  execute(message, args, games) {
    //exiting if user is attempting to join their own game.
    if (games.find((game) => game.players.includes(message.author)))
      return message.reply(`You are already part of this game!`);
    //finding the game the user wants to join using the args object
    let joinGame =
      games[parseInt(Object.keys(args).find((key) => !isNaN(key))) - 1];
    if (!joinGame) return message.reply('You need to enter an id to join.');
    if (joinGame.started) {
      return message.reply(
        `This game has already started! Type ${process.env.prefix}games to view current games.`
      );
    }
    if (joinGame.isPrivate) {
      joinGame.requests.push(message.author);
      return message.channel.send(
        `@${joinGame.createdBy.username}, would you like ${message.author.username} to join your game? Type ${process.env.prefix}accept @${message.author.username} to accept.`
      );
    }
    //adding the user to the game's players
    joinGame.players.push(message.author);
    if (joinGame.name === 'rps') joinGame.channel = message.channel;
    message.reply(
      `Successfully joined a game of ${joinGame.name} created by ${joinGame.createdBy.username}`
    );

    let command = client.commands.get(joinGame.name);
    if (joinGame.players.length === command.players) {
      command.execute(message, args, games, true);
    }
  },
};
