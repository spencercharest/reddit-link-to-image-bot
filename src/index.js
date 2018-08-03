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

function downloadImage(url) {
  return axios({
    method: 'GET',
    url,
    responseType: 'arraybuffer',
  })
    .then(res => res.data);
}

async function processPage(page, chatId) {
  const { title, image } = page;

  if (image) {
    await bot.sendMessage(chatId, title);

    const file = await downloadImage(image);

    await bot.sendPhoto(chatId, file);
  }
}

bot.on('message', async (msg) => {
  const { text, chat } = msg;
  const { id } = chat;
  // only run for reddit posts
  if (text.includes('reddit.com')) {
    try {
      // get link urls from text
      const linkURLs = getLinkURLs(text);
      // get page content
      const pages = await Promise.map(linkURLs, url => getPageContent(url));
      // determine if any of the posts have images
      const haveImages = pages.some(page => Boolean(page.image));

      if (haveImages) {
      // send a message to troll matt
        await bot.sendMessage(
          id,
          'I see you linked to a Reddit image post instead of just sending the image. Don\'t do that. Don\'t be like Matt. Let me help you out with that.',
        );

        await Promise.map(pages, page => processPage(page, id), { concurrency: 1 });
      }
    } catch (e) {
      console.error(e);
    }
  }
});
