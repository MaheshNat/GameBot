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
      //stores the state of the game
      game.turn = 0;
      game.stage = null;
      game.partnerStage = 0;
      for (let i = 2; i <= 10; i++)
        game.deck = game.deck.concat([`${i}c`, `${i}d`, `${i}h`, `${i}s`]);
      for (let face of ['j', 'q', 'k', 'a'])
        for (let suit of ['c', 'd', 'h', 's']) game.deck.push(`${face}${suit}`);
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
          `It is ${
            game.players[game.turn].username
          }'sgame.turnto start bidding.\n
          Type !bt bid=<int> to bid an integer amount between 0 and 250, or type !bt forfeit to stop bidding.\n
          Bidding will stop when all players except one have forfeited.
          `
        );
      game.stage = Stages.BIDDING;
      return message.channel.send(startEmbed);
    } else if (
      game.players[game.turn] !== message.author &&
      game.stage !== Stages.SELECTING_TRUMP &&
      game.stage !== Stages.SELECTING_PARTNERS
    ) {
      return message.reply('It is not your turn!');
    }
    if (game.stage === Stages.BIDDING) {
      if (args['bid']) {
        if (game.highestBid && args['bid'] <= game.highestBid)
          return message.reply(
            'You need to bid more than the current highest bid, or forfeit'
          );
        game.highestBid = clip(
          !game.highestBid
            ? args['bid']
            : Math.max(args['bid'], game.highestBid),
          100,
          250
        );
        message.channel.send(
          `${game.players[game.turn].username} just bid ${clip(
            args['bid'],
            100,
            250
          )}`
        );
      } else if (args['forfeit']) {
        game.forfeits.push(message.author);
        message.channel.send(
          `${game.players[game.turn].username} just forfeited!`
        );
      }

      if (game.forfeits.length === game.players.length - 1) {
        game.highestBidder = game.players.find(
          (player) => !game.forfeits.includes(player)
        );
        game.partnership = [game.highestBidder];
        game.opposition = [];
        game.stage = Stages.SELECTING_TRUMP;
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
            value: game.players[(game.turn + 1) % game.players.length].username,
          },
          {
            name: 'Forfeited Players',
            value: forfeitedPlayers.length === 0 ? 'none' : forfeitedPlayers,
          }
        );
      game.turn = (game.turn + 1) % game.players.length;
      message.channel.send(bidEmbed);
    } else if (game.stage === Stages.SELECTING_TRUMP) {
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
      game.stage = Stages.SELECTING_PARTNERS;
    } else if (game.stage === Stages.SELECTING_PARTNERS) {
      if (message.author !== game.highestBidder)
        return message.reply(
          `Only the highest bidder, ${highestBidder.username}, can send messages at this time.`
        );
      if (!isValidCard(args['partner']))
        return message.reply('You need to enter a valid card.');

      game.players.forEach((player) => {
        if (game.hands[player].includes(args['partner'])) {
          game.partnership.push(player);
          player.send('You are part of the partnership.');
        }
      });
      game.partnerStage++;
      message.channel.send(
        `${
          message.author.username
        } selected the player which has the ${getCardName(
          args['partner']
        )} as their partner.`
      );
      if (game.partnerStage === Math.floor(game.players.length / 2)) {
        game.players.forEach((player) => {
          if (!game.partnership.includes(player)) {
            game.opposition.push(player);
            player.send('You are part of the opposition.');
          }
        });
        message.channel.send(
          `The trump card and all partners have been declared.\nPlaying will now start, and it is ${message.author.username}'s turn play.`
        );
        game.cards = {};
        game.turn = game.players.findIndex(
          (player) => player === message.author
        );
        game.stage = Stages.PLAYING;
      }
    } else if (game.stage === Stages.PLAYING) {
      let card = Object.keys(args)[0];
      if (!isValidCard(card))
        return message.reply('You need to enter a valid card.');
      if (!game.hands[message.author].includes(card))
        return message.reply('You do not have that card!');
      let firstSuit =
        Object.values(game.cards).length > 0
          ? Object.values(game.cards)[0].charAt(
              Object.values(game.cards)[0].length - 1
            )
          : null;
      if (firstSuit)
        console.log(
          firstSuit,
          card.charAt(card.length - 1) !==
            firstSuit.charAt(firstSuit.length - 1),
          game.hands[message.author]
            .map((hand) => hand.charAt(hand.length - 1))
            .includes(firstSuit)
        );
      if (
        firstSuit &&
        card.charAt(card.length - 1) !==
          firstSuit.charAt(firstSuit.length - 1) &&
        game.hands[message.author]
          .map((hand) => hand.charAt(hand.length - 1))
          .includes(firstSuit)
      )
        return message.reply(
          `Since you have a card wih the suit ${suits[firstSuit]}, you have to play that card. You cannot play a card of a different suit.`
        );
      message.channel.send(
        `${message.author.username} played the ${getCardName(card)}`
      );
      game.cards[message.author] = card;
      sendCards(game, message, () => {
        game.turn = (game.turn + 1) % game.players.length;
      });
    }
  },
};

function isValidCard(card) {
  return fs.readdirSync('./images/playing_cards').includes(`${card}.png`);
}

function getCardName(card) {
  return `${values[card.charAt(1) === '0' ? '10' : card.charAt(0)]} of ${
    card.charAt(1) === '0' ? suits[card.charAt(2)] : suits[card.charAt(1)]
  }`;
}

function clip(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function sendCards(game, message, cb) {
  merge(
    Object.values(game.cards).map(
      (card) => `./images/playing_cards/${card}.png`
    )
  ).then((img) =>
    img.write('./images/cards.png', () => {
      const playEmbed = new discord.MessageEmbed()
        .setColor('32cfc1')
        .setTitle('Playing')
        .attachFiles(['./images/cards.png'])
        .addFields({
          name: 'Turn',
          value: game.players[(game.turn + 1) % game.players.length].username,
        });
      message.channel.send(playEmbed).then((message) =>
        fs.unlink('./images/cards.png', (result) => {
          console.log('done deleting');
          cb();
        })
      );
    })
  );
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
