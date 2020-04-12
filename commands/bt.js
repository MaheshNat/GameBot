const discord = require('discord.js');
const merge = require('merge-img');
const fs = require('fs');

const Stages = {
  BIDDING: 'Bidding',
  SELECTING_TRUMP: 'Selecting_Trump',
  SELECTING_PARTNERS: 'Selecting_Partners',
  PLAYING: 'Playing',
};

const suits = {
  c: 'Clubs',
  d: 'Diamonds',
  h: 'Hearts',
  s: 'Spades',
};

const values = {
  1: 'One',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
  j: 'Jack',
  q: 'Queen',
  k: 'King',
  a: 'Ace',
};

//represents the index of the player whose turn it is
let turn = 0;
//stores the state of the game
let stage;

module.exports = {
  name: 'bt',
  isGame: true,
  players: 7,
  description: 'The card game of black spades.',
  execute(message, args, games, start = false) {
    //finding the game the user is in
    let game = games.find((game) => game.players.includes(message.author));
    if (!game)
      return message.reply('You have to join a game to use that command.');
    //exiting if 7 players have not been joined yet.
    if (game.players.length !== this.players && !game.started) return;
    //setting up deck if it has not been created yet
    if (!game.deck) {
      //creating a deck containing all the cards
      game.deck = [];
      //creating an array to store players who forfeit during bidding round
      game.forfeits = [];
      for (let i = 2; i <= 10; i++)
        game.deck = game.deck.concat([`${i}c`, `${i}d`, `${i}h`, `${i}s`]);
      for (let face of ['j', 'q', 'k', 'a'])
        game.deck = game.deck.concat([
          `${face}c`,
          `${face}d`,
          `${face}h`,
          `${face}s`,
        ]);
      //shuffling the deck
      game.deck.sort(() => Math.random() - 0.5);

      //assigning each player a deck of 7 cards
      game.hands = {};
      game.players.forEach((player) => {
        game.hands[player] = game.deck.splice(
          0,
          Math.floor(52 / game.players.length)
        );
        console.log(game.hands[player]);
        sendHand(game, player);
      });
      const startEmbed = new discord.MessageEmbed()
        .setColor('#32cfc1')
        .setTitle('The game has started!')
        .setDescription(
          `It is ${game.players[turn].username}'s turn to start bidding.\n
          Type !bt bid=<int> to bid an integer amount between 0 and 250, or type !bt forfeit to stop bidding.\n
          Bidding will stop when all players except one have forfeited.
          `
        );
      stage = Stages.BIDDING;
      return message.channel.send(startEmbed);
    } else if (
      game.players[turn] !== message.author &&
      stage !== Stages.SELECTING_TRUMP &&
      stage !== Stages.SELECTING_PARTNERS
    ) {
      return message.reply('It is not your turn!');
    }
    if (stage === Stages.BIDDING) {
      if (args['bid']) {
        if (game.highestBid && args['bid'] <= game.highestBid)
          return message.reply(
            'You need to bid more than the current highest bid, or forfeit'
          );
        game.highestBid = clip(
          !game.highestBid
            ? args['bid']
            : Math.max(args['bid'], game.highestBid),
          0,
          250
        );
        message.channel.send(
          `${game.players[turn].username} just bid ${clip(args['bid'], 0, 250)}`
        );
      } else if (args['forfeit']) {
        game.forfeits.push(message.author);
        message.channel.send(`${game.players[turn].username} just forfeited!`);
      }

      if (game.forfeits.length === game.players.length - 1) {
        game.highestBidder = game.players.find(
          (player) => !game.forfeits.includes(player)
        );
        stage = Stages.SELECTING_TRUMP;
        return message.channel.send(
          `Everyone except for ${game.highestBidder.username} has forfeited, bringing an end to the bidding round.\n${game.highestBidder.username}, type !bt trump= followed by a suit to declare as the trump suit ('c' (clubs), 'd' (diamonds), 'h' (hearts), or 's' (spades))`
        );
      }
      let forfeitedPlayers = game.forfeits.map((player) => player.username);

      const bidEmbed = new discord.MessageEmbed()
        .setColor('32cfc1')
        .setTitle('Bidding')
        .addFields(
          {
            name: 'Highest Bid',
            value: !game.highestBid ? 'none' : game.highestBid,
          },
          {
            name: 'Turn',
            value: game.players[(turn + 1) % game.players.length].username,
          },
          {
            name: 'Forfeited Players',
            value: forfeitedPlayers.length === 0 ? 'none' : forfeitedPlayers,
          }
        );
      turn = (turn + 1) % game.players.length;
      message.channel.send(bidEmbed);
    } else if (stage === Stages.SELECTING_TRUMP) {
      if (message.author !== game.highestBidder)
        return message.reply(
          `Only the highest bidder, ${highestBidder.username}, can send messages at this time.`
        );
      if (!['c', 'd', 'h', 's'].includes(args['trump']))
        return message.reply(
          `You need to enter !bt trump= followed by 'c' (clubs), 'd' (diamonds), 'h' (hearts), or 's' (spades)`
        );
      game.trump = args['trump'];
      message.channel.send(
        `${message.author.username} selected ${
          suits[game.trump]
        } as the trump suit.\nType !bt partner= followed by a card name to select a partner. Card names start with the rank (2-10, j, q, k, a), and are followed by the suit (c, d, h, s).\nFor example, a card name of 'as' would represent the ace of spades.`
      );
      stage = Stages.SELECTING_PARTNERS;
    } else if (stage === Stages.SELECTING_PARTNERS) {
      if (message.author !== game.highestBidder)
        return message.reply(
          `Only the highest bidder, ${highestBidder.username}, can send messages at this time.`
        );
      if (
        !fs
          .readdirSync('./images/playing_cards')
          .includes(`${args['partner']}.png`)
      )
        return message.reply('You need to enter a valid card.');

      message.channel.send(
        `${message.author.username} selected the player which has the ${
          values[
            args['partner'].charAt(1) === '0' ? '10' : args['partner'].charAt(0)
          ]
        } of ${
          args['partner'].charAt(1) === '0'
            ? suits[args['partner'].charAt(2)]
            : suits[args['partner'].charAt(1)]
        } as their partner.`
      );
    }
  },
};

function clip(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function sendHand(game, player) {
  //NOTE: REFACTOR TO USE PROMISES!!! FOR SOME REASON THEY DON'T WORK!

  //merges the images of the players cards into one cohesive image
  //merges -> writes to file -> sends images aig-> deletes files
  //for some reason the discord.js library can't send file objects, it always needs a
  //file directory in order to send it, so we have to write the file to the bot's directory.
  let fileName = '';
  merge(game.hands[player].map((card) => `./images/playing_cards/${card}.png`))
    .then((img) => {
      console.log('done merging');
      fileName = `./images/${player.username}.png`;
      img.write(fileName, () => {
        console.log('done writing');
        player
          .send('Your black triple hand:', {
            files: [fileName],
          })
          .then((message) => {
            console.log('done sending');
            fs.unlink(fileName, (result) => {
              console.log('done deleting');
            });
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
}
