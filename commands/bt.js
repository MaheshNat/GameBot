const discord = require('discord.js');
const merge = require('merge-img');
const fs = require('fs');
const User = require('../models/user.js');
const mongoose = require('mongoose');

const Stages = {
  BIDDING: 'Bidding',
  SELECTING_TRUMP: 'Selecting_Trump',
  SELECTING_PARTNERS: 'Selecting_Partners',
  PLAYING: 'Playing',
  END_GAME: 'End_Game',
};

const suits = {
  s: 'Spades',
  c: 'Clubs',
  h: 'Hearts',
  d: 'Diamonds',
};

const values = {
  a: 'Ace',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
  '10': 'Ten',
  j: 'Jack',
  q: 'Queen',
  k: 'King',
};

const faceValues = {
  j: 11,
  q: 12,
  k: 13,
  a: 14,
};

const biddingMillis = 30000;

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
        sortHands(game, player);
        sendHand(game, player);
      });
      const startEmbed = new discord.MessageEmbed()
        .setColor('#32cfc1')
        .setTitle('The game has started!')
        .setDescription(
          `It is ${game.players[game.turn].username}'s turn to start bidding.\n
          Type !bt <int> to bid an integer amount between 0 and 250, or type !bt forfeit to stop bidding.\n
          Bidding will stop when all players except one have forfeited.
          `
        );
      game.stage = Stages.BIDDING;
      game.secondsLeft = biddingMillis / 1000;
      game.timeout = setTimeout(() => {
        if (!game.highestBidder) {
          game.highestBid = 125;
          game.highestBidder =
            game.players[Math.floor(Math.random() * game.players.length)];
          return message.channel.send(
            `Since no one bid, ${game.highestBidder.username} has been chosen as the random default highest bidder.`
          );
        }
        message.channel.send(
          `${game.highestBidder.username} has bidded ${game.highestBid}, bringing an end to the bidding round.`
        );
        clearInterval(game.interval);
        game.stage = Stages.SELECTING_TRUMP;
      }, biddingMillis);
      game.interval = setInterval(() => {
        console.log('interval called', game.secondsLeft);
        game.secondsLeft -= 1;
      }, 1000);
      return message.channel.send(startEmbed);
    } else if (
      game.players[game.turn] !== message.author &&
      game.stage !== Stages.BIDDING &&
      game.stage !== Stages.SELECTING_TRUMP &&
      game.stage !== Stages.SELECTING_PARTNERS
    ) {
      return message.reply('It is not your turn!');
    }
    if (game.stage === Stages.BIDDING) {
      let bid = clip(Object.keys(args)[0], 125, 250);
      console.log(!isNaN(bid), !game.highestBid, bid > game.highestBid);
      if (!isNaN(bid) && (!game.highestBid || bid > game.highestBid)) {
        game.highestBid = bid;
        game.highestBidder = message.author;
        const bidEmbed = new discord.MessageEmbed()
          .setColor('32cfc1')
          .setTitle('Bidding')
          .addFields(
            {
              name: 'Highest Bid',
              value: !game.highestBid ? 'none' : game.highestBid,
            },
            {
              name: 'Highest Bidder',
              value: !game.highestBidder ? 'none' : game.highestBidder,
            },
            {
              name: 'Seconds Left',
              value: Math.floor(game.secondsLeft),
            }
          );
        message.channel.send(bidEmbed);

        if (bid === 250) {
          game.stage = Stages.SELECTING_TRUMP;
          clearInterval(game.interval);
          clearTimeout(game.timeout);
          return message.channel.send(
            `${game.highestBidder.username} has bidded 250, the highest possible bid, bringing an end to the bidding round.\n${game.highestBidder.username}, type !bt trump= followed by a suit to declare as the trump suit ('c' (clubs), 'd' (diamonds), 'h' (hearts), or 's' (spades))`
          );
        }
      } else return message.reply('You need to enter an integer value to bid.');
    } else if (game.stage === Stages.SELECTING_TRUMP) {
      if (message.author !== game.highestBidder)
        return message.reply(
          `Only the highest bidder, ${game.highestBidder.username}, can send messages at this time.`
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
          `Only the highest bidder, ${game.highestBidder.username}, can send messages at this time.`
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
      if (game.partnerStage === Math.floor(game.players.length / 2) - 1) {
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
      game.hands[message.author].splice(
        game.hands[message.author].indexOf(card),
        1
      );
      if (game.hands[message.author].length > 0) sendHand(game, message.author);
      game.cards[message.author] = card;
      sendCards(game, message, () => {
        if (Object.values(game.cards).length === game.players.length) {
          let winner = getWinner(game);
          message.channel.send(
            `${
              winner.username
            } is the winner of this round by playing the ${getCardName(
              game.cards[winner]
            )}!`
          );
          if (game.partnership.includes(winner)) {
            let counts = 0;
            game.partnership.forEach((player) => {
              if (player === winner) counts++;
            });
            if (counts === 2)
              Object.values(game.cards).forEach((card) => {
                game.partnerPoints += 2 * getPoints(card);
              });
            else
              Object.values(game.cards).forEach((card) => {
                game.partnerPoints += getPoints(card);
              });
          }
          console.log('partnerPoints: ' + game.partnerPoints);
          game.cards = {};
          game.turn = game.players.indexOf(winner);
          if (game.hands[winner].length === 0) {
            message.channel.send(
              'All cards have been played, bringing an end to the playing rounds.'
            );
            //end game
            if (game.partnerPoints >= game.highestBid) {
              message.channel.send(
                `Congratulations! The partnership team has collected ${game.partnerPoints} points, which is greater than the highest bid, which was ${game.highestBid}.\nThe partnership has won this game.`
              );
              for (let player of game.partnership) {
                User.findOne({ name: player.username }, (err, user) => {
                  if (!user) {
                    let pts;
                    if (player === game.highestBidder)
                      pts = 50 + game.highestBid;
                    else pts = game.highestBid;
                    User.create({
                      _id: mongoose.Types.ObjectId(),
                      name: player.username,
                      blackTriplePoints: pts,
                    });
                  } else {
                    let pts;
                    if (player === game.highestBidder)
                      pts = 50 + game.highestBid + user.blackTriplePoints;
                    else pts = game.highestBid + game.blackTriplePoints;
                    User.update(
                      { name: player.username },
                      { blackTriplePoints: pts }
                    );
                  }
                });
              }
            } else {
              message.channel.send(
                `The partnership collected ${game.partnerPoints} points, which is less than the highest bid, which was ${game.highestBid}.\nThe partnership has lost this game.`
              );
              game.partnership.filter(
                (item, index) => game.partnership.indexOf(item) === index
              );
              for (let player of game.partnership) {
                User.findOne({ name: player.username }, (err, user) => {
                  if (!user) {
                    let pts;
                    if (player === game.highestBidder) pts = -100;
                    else pts = -50;
                    User.create({
                      _id: mongoose.Types.ObjectId(),
                      name: player.username,
                      blackTriplePoints: pts,
                    });
                  } else {
                    if (player === game.highestBidder)
                      pts = user.blackTriplePoints - 100;
                    else pts = user.blackTriplePoints - 50;
                    User.update(
                      { name: player.username },
                      { blackTriplePoints: pts }
                    );
                  }
                });
              }
            }
            games.splice(game);
          }
        } else game.turn = (game.turn + 1) % game.players.length;
      });
    }
  },
};

function sortHands(game, player) {
  game.hands[player].sort((a, b) => {
    aSuit = Object.keys(suits).indexOf(a.charAt(a.length - 1));
    bSuit = Object.keys(suits).indexOf(b.charAt(b.length - 1));
    if (
      aSuit < bSuit ||
      (aSuit === bSuit &&
        Object.keys(values).indexOf(a.substring(0, a.length - 1)) <
          Object.keys(values).indexOf(b.substring(0, b.length - 1)))
    )
      return -1;
    return 1;
  });
}

function getWinner(game) {
  let winner;
  for (let key of game.players) {
    let value = game.cards[key];
    let oldSuit, newCardBigger;
    if (winner) {
      oldSuit = game.cards[winner].charAt(game.cards[winner].length - 1);
      newCardBigger = getPointValue(value) > getPointValue(game.cards[winner]);
    }

    if (!winner) winner = key;
    else if (value.charAt(value.length - 1) === game.trump) {
      if ((oldSuit === game.trump && newCardBigger) || oldSuit !== game.trump)
        winner = key;
    } else if (newCardBigger && oldSuit !== game.trump) winner = key;
  }
  return winner;
}

function getPoints(card) {
  if (card === '3s') return 30;
  else if (card.charAt(0) === '5') return 5;
  else if (card.length === 3 || isNaN(card.charAt(0))) return 10;
  return 0;
}

function getPointValue(value) {
  if (isNaN(value.charAt(0))) return parseInt(faceValues[value.charAt(0)]);
  if (value.length === 3) return 10;
  return parseInt(value.charAt(0));
}

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
