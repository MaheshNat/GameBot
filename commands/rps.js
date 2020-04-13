const discord = require('discord.js');

module.exports = {
  name: 'rps',
  isGame: true,
  players: 2,
  description: 'Normal game of rock paper scissors.',
  execute(message, args, games) {
    //finding the game the user is in
    let game = games.find((game) => game.players.includes(message.author));
    if (!game)
      return message.reply('You have to join a game to use that command.');
    if (game.players.length !== this.players) return;
    //exiting if 2 players have not been joined yet.
    if (!game.started) {
      game.started = true;
      game.hand1 = '';
      game.hand2 = '';
      hands = ['rock', 'paper', 'scissor'];

      //sends message to the player
      game.players[0].send('Select: \n !rps choice=(1:Rock 2:paper 3:scissor)');
      game.players[1].send('Select: \n !rps choice=(1:Rock 2:paper 3:scissor)');
      return message.channel.send('game started');
    }

    //reads the message of players[0] to determine their hand
    if (message.channel instanceof discord.DMChannel) {
      if (message.author === game.players[0]) {
        if (
          isNaN(args['choice']) ||
          (!isNaN(args['choice']) && (args['choice'] < 1 || args['choice'] > 3))
        ) {
          game.players[0].send('Please choose a valid number');
        } else {
          game.hand1 = args['choice'];
        }

        //reads the message of players[1] to determine their hand
      } else if (message.author === game.players[1]) {
        if (
          isNaN(args['choice']) ||
          (!isNaN(args['choice']) && args['choice'] < 1 && args['choice'] > 3)
        ) {
          game.players[1].send('Please choose a valid number');
        } else {
          game.hand2 = args['choice'];
        }
      }

      if (game.hand1 !== '' && game.hand2 !== '') {
        console.log('reached');
        //determines the winner by comparing the two messages using the helper function
        game.channel.send(
          determineWinner(
            hands[parseInt(game.hand1) - 1],
            hands[parseInt(game.hand2) - 1],
            game
          )
        );

        //deleting the game as it has ended
        games.splice(game);
      }
    }
  },
};

//compares the two hands and determines the winner
function determineWinner(hand1, hand2, game) {
  if (hand1 === hand2) {
    return 'tie!';
  }
  if (hand1 === 'paper') {
    if (hand2 === 'rock') {
      return `Congratulations! Player ${game.players[0].username} won the game!`;
    }
    if (hand2 === 'scissors') {
      return `Congratulations! Player ${game.players[1].username} won the game!`;
    }
  }
  if (hand1 === 'rock') {
    if (hand2 === 'paper') {
      return `Congratulations! Player ${game.players[1].username} won the game!`;
    }
    if (hand2 === 'scissors') {
      return `Congratulations! Player ${game.players[0].username} won the game!`;
    }
  }
  if (hand1 === 'scissors') {
    if (hand2 === 'rock') {
      return `Congratulations! Player ${game.players[1].username} won the game!`;
    }
    if (hand2 === 'paper') {
      return `Congratulations! Player ${game.players[0].username} won the game!`;
    }
  }
  return 'error lmao';
}
