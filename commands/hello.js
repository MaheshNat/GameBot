module.exports = {
  name: 'hello',
  description:
    'Responds with hi! to check if the bot is working. Usage: !hello',
  execute(message, args) {
    message.reply('Hi!');
  },
};
