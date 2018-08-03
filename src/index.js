import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(__dirname, '../.env'),
});

const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });
