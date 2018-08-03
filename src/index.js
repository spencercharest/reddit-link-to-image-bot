import Promise from 'bluebird';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import cheerio from 'cheerio';
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

async function getPageContent(url) {
  // get html
  const { data } = await axios.get(url);
  // load into cheerio
  const $ = cheerio.load(data);
  // get image source and post title
  const image = $('img').attr('src');
  const title = $('h2').text();

  return {
    title,
    image,
  };
}

bot.on('message', async (msg) => {
  const { text } = msg;
  // only run for reddit posts
  if (text.includes('reddit.com')) {
    // get link urls from text
    const linkURLs = getLinkURLs(text);
    // get page content
    const content = await Promise.map(linkURLs, url => getPageContent(url));
  }
});
