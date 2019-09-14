import Promise from 'bluebird';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(__dirname, '../.env')
});

const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });

function getLinkURLs(text) {
  return text.match(/\bhttps?:\/\/\S+/gi);
}

async function getPageContent(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url);

  const image = await page.evaluate(() =>
    document.querySelector('.media-element').getAttribute('src')
  );

  const title = await page.evaluate(
    () => document.querySelector('h1').innerText
  );

  if (image) {
    const imagePage = await browser.newPage();
    await imagePage.goto(image);
  }

  await browser.close();

  return {
    title,
    image
  };
}

function downloadImage(url) {
  return axios({
    method: 'GET',
    url,
    responseType: 'arraybuffer'
  }).then(res => res.data);
}

async function processPage(page, chatId) {
  const { title, image } = page;

  if (image) {
    await bot.sendMessage(chatId, title);

    const file = await downloadImage(image);

    await bot.sendPhoto(chatId, file);
  }
}

bot.on('message', async msg => {
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
        await Promise.map(pages, page => processPage(page, id), {
          concurrency: 1
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
});
