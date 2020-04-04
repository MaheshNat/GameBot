const Game = require('../models/game');
let turn = 0;

module.exports = {
  name: 'tic-tac-toe',
  isGame: true,
  players: 2,
  description: 'A traditional game of tic-tac-toe',
  execute(message, args, games) {
    let game = games.find((game) =>
      game.players.includes(message.author.username)
    );
    if (!game)
      return message.reply('You have to join a game to use that command.');
    if (game.players.length !== this.players) return;
    if (!game.board) {
      game.board = [
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ];
      return message.reply('The game has started.');
    } else if (game.players[turn] !== message.author.username) {
      return message.reply('It is not your turn!');
    } else {
      let loc = parseInt(Object.keys(args).find((key) => !isNaN(key)));
      if (loc < 1 || loc > 9 || !Number.isInteger(loc))
        return message.reply(
          'Make sure you integer an integer location between 1 and 9 (inclusive)!'
        );
      let row = Math.floor((loc - 1) / 3);
      let col = Math.floor((loc - 1) % 3);
      if (game.board[row][col] !== '')
        return message.reply('You cannot a marker at that location!');
      game.board[row][col] = turn === 0 ? 'X' : 'O';

      turn++;
      turn %= game.players.length;
    }

    message.channel.send(printBoard(game.board));

    let result = checkWin(game.board);
    if (result) {
      if (result === 'draw')
        message.channel.send('The game ended in a draw!!!');
      else if (result === 'X')
        message.channel.send(
          `Congratulations! player ${game.players[0]} won the game!!!`
        );
      else if (result === 'O')
        message.channel.send(
          `Congratulations! player ${game.players[1]} won the game!!!`
        );
      games.splice(game);
    }
  },
};

function checkWin(board) {
  let rowCol = checkRowCol(board);
  let diag = checkDiagonal(board);
  if (rowCol) return rowCol;
  if (diag) return diag;
  if (checkDraw(board)) return 'draw';
  return false;
}

function checkDraw(board) {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] !== '') return false;
    }
  }
  return true;
}

function checkRowCol(board) {
  for (let i = 0; i < board.length; i++) {
    let result1 = check(board[i][0], board[i][1], board[i][2]);
    if (result1) return result1;
    let result2 = check(board[0][i], board[1][i], board[2][i]);
    if (result2) return result2;
  }
  return false;
}

function checkDiagonal(board) {
  let result1 = check(board[0][0], board[1][1], board[2][2]);
  if (result1) return result1;
  let result2 = check(board[2][0], board[1][1], board[0][2]);
  if (result2) return result2;
  return false;
}

function check(a, b, c) {
  if (a == b && b == c) return a;
  return false;
}

function printBoard(board) {
  let output = '';
  for (let row of board) {
    for (let cell of row) {
      output +=
        cell === ''
          ? ':white_large_square:'
          : cell === 'X'
          ? ':regional_indicator_x:'
          : ':o2:';
    }
    output += '\n';
  }
  return output;
}
