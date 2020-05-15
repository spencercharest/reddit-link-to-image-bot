import TelegramBot from 'node-telegram-bot-api';
import unescape from 'unescape';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

import { Post } from './types/post';
import { Image, ProcessedImage } from './types/image';

dotenv.config({
  path: path.join(__dirname, '../.env'),
});

const TOKEN = process.env.TOKEN;
const REDDIT = 'reddit.com';

const bot = new TelegramBot(TOKEN, { polling: true });

const getAPIURL = (slug: string): string =>
  `https://www.reddit.com/comments/${slug}/.json`;

const getLinkURLs = (text: string): string[] =>
  text.includes(REDDIT) ? text.match(/\bhttps?:\/\/\S+/gi) : [];

const getPostSlug = (url: string): string => {
  const START_DELIMITER = '/comments/';
  const END_DELIMITER = '/';
  const regex = new RegExp(`${START_DELIMITER}(.*?)${END_DELIMITER}`, 'g');
  const [match] = url.match(regex);
  return match.replace(START_DELIMITER, '').replace(END_DELIMITER, '');
};

const processImage = (image: Image): ProcessedImage => {
  if (image.variants.gif) {
    return {
      url: unescape(image.variants.gif.source.url),
      isVideo: false,
    };
  }

  if (image.variants.mp4) {
    return {
      url: unescape(image.variants.mp4.source.url),
      isVideo: true,
    };
  }

  return {
    url: unescape(image.source.url),
    isVideo: false,
  };
};

const getPostData = async (
  url: string,
): Promise<{ title: string; images: ProcessedImage[] }> => {
  const { data } = await axios.get<Post[]>(url);

  const title = data[0]?.data?.children[0]?.data?.title || '';

  const images = data.reduce((acc: ProcessedImage[], post: Post) => {
    const urls = post.data.children.reduce((acc: ProcessedImage[], child) => {
      if (!child.data.preview) {
        return acc;
      }

      return [...acc, ...child.data.preview.images.map(processImage)];
    }, []);

    return [...acc, ...urls];
  }, []);

  return { title, images };
};

const getImage = (image: ProcessedImage): Promise<Buffer> =>
  axios
    .get<Buffer>(image.url, {
      responseType: 'arraybuffer',
    })
    .then(({ data }) => data);

const processLink = async (id: string | number, link: string) => {
  const slug = getPostSlug(link);
  const url = getAPIURL(slug);
  const post = await getPostData(url);

  if (post.images.length) {
    await bot.sendMessage(id, post.title);
  }

  await Promise.all(
    post.images.map(async (img) => {
      const buffer = await getImage(img);

      if (img.isVideo) {
        await bot.sendVideo(id, buffer);
      } else {
        await bot.sendPhoto(id, buffer);
      }
    }),
  );
};

bot.on('message', async ({ text, chat: { id } }) => {
  const links = getLinkURLs(text);
  await Promise.all(links.map((link) => processLink(id, link)));
});
