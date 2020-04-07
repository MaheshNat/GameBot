module.exports = {
  name: 'hello',
  description:
    'Responds with hi! to check if the bot is working. Usage: !hello',
  execute(message, args, games) {
    message.reply('Hi!');
  },
};
