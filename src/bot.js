import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import axios from 'axios';
import Groq from 'groq-sdk';


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const emoji = {
  happy: '😄',
  sad: '😢',
  love: '❤️',
  fire: '🔥',
  idea: '💡',
  robot: '🤖',
  sparkles: '✨',
  wave: '👋',
  thumbsUp: '👍',
  clap: '👏',
  party: '🥳',
};

// Your existing utility functions (fetchJoke, fetchQuote, fetchWeather, randomChoice, etc.) remain unchanged

// Groq ask function
async function askGroq(prompt) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that replies in 1 or 2 short lines.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 60,  // limit response length
      temperature: 0.7,
    });
    return completion.choices[0]?.message?.content.trim() || "No response from Groq.";
  } catch (err) {
    console.error("Groq API error:", err);
    if (err.status === 429 || err.code === 'insufficient_quota') {
      return "⚠️ I'm currently overloaded with requests. Please try again soon!";
    }
    return "❌ Sorry, I couldn't get a response from Groq. Please try again later.";
  }
}

// Bot Ready
client.once(Events.ClientReady, () => {
  console.log(`${emoji.robot} ${client.user.tag} is online!`);
});

// Message Handler
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();
  const lower = content.toLowerCase();

  if (lower === '/help') {
    return message.reply(
      `${emoji.idea} Here’s what I can do:\n` +
      `• /joke for a joke 🤣\n` +
      `• /inspire for a quote ✨\n` +
      `• /weather <city> for weather 🌦️\n` +
      `• /ask <question> to chat with me 🤖\n` +
      `• Say hi, thanks, or anything else for a friendly reply!`
    );
  }

  if (lower === '/joke') {
    const joke = await fetchJoke();
    return message.reply(`${emoji.happy} Here's a joke:\n${joke}`);
  }

  if (lower === '/inspire') {
    const quote = await fetchQuote();
    return message.reply(`${emoji.sparkles} *${quote}*`);
  }

  if (lower.startsWith('/weather')) {
    const parts = content.split(' ');
    if (parts.length < 2) {
      return message.reply('Please provide a city name 🌍');
    }
    const city = parts.slice(1).join(' ');
    const weather = await fetchWeather(city);
    return message.reply(weather);
  }

  if (lower.startsWith('/ask ')) {
    const prompt = content.slice(5).trim();
    if (!prompt) {
      return message.reply('Please provide a question or prompt.');
    }

    await message.channel.sendTyping();
    const reply = await askGroq(prompt);
    return message.reply(`${emoji.robot} ${reply}`);
  }

  // Greetings
  if (['hi', 'hello', 'hey', 'hola', 'how are you'].some(greet => lower.includes(greet))) {
    return message.reply(getGreetingReply(message.author.username));
  }

  // Farewells
  if (['bye', 'goodbye', 'see ya', 'later', 'cya'].some(word => lower.includes(word))) {
    return message.reply(getFarewellReply(message.author.username));
  }

  // Thanks
  if (['thank you', 'thanks', 'thx', 'ty'].some(word => lower.includes(word))) {
    return message.reply(`${emoji.thumbsUp} You’re welcome, ${message.author.username}!`);
  }

  // Laughs
  if (['lol', 'haha', 'lmao', 'rofl'].some(word => lower.includes(word))) {
    try {
      await message.react('😂');
    } catch {}
    return message.reply("Glad I could make you laugh! 😄");
  }

  // Compliments
  if (['awesome', 'great', 'cool', 'nice', 'love it'].some(word => lower.includes(word))) {
    return message.reply(getCompliment());
  }

  // Default fallback
  try {
    await message.react(emoji.robot);
    await message.react(emoji.sparkles);
  } catch {}

  return message.reply(getFallbackReply());
});

client.login(process.env.DISCORDJS_BOT_TOKEN);
