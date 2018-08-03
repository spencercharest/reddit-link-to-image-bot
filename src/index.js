import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(__dirname, '../.env'),
});

const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });

function getLinkURLs(text) {
  return text.match(/\bhttps?:\/\/\S+/gi);
}

bot.on('message', async (msg) => {
  const { text } = msg;
  // only run for reddit posts
  if (text.includes('reddit.com')) {
    // get link urls from text
    const linkURLs = getLinkURLs(text);
  }
});
