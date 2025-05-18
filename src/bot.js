require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const axios = require('axios');

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

async function fetchJoke() {
  try {
    const res = await axios.get('https://official-joke-api.appspot.com/random_joke');
    return `${res.data.setup} - ${res.data.punchline}`;
  } catch {
    return 'Why did the robot fail his test? He kept short-circuiting the answers! 🤖';
  }
}

async function fetchQuote() {
  try {
    const res = await axios.get('https://api.quotable.io/random');
    return `${res.data.content} — *${res.data.author}*`;
  } catch {
    return 'In the middle of every difficulty lies opportunity. — *Albert Einstein*';
  }
}

async function fetchWeather(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
  try {
    const res = await axios.get(url);
    const data = res.data;
    return `📍 **${data.name}**\n🌡️ Temp: ${data.main.temp}°C\n☁️ Weather: ${data.weather[0].description}`;
  } catch {
    return '❌ Could not fetch weather. Make sure the city is correct!';
  }
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getGreetingReply(username) {
  const replies = [
    `Hey ${username}! ${emoji.wave} How can I help you today?`,
    `Hello ${username}! ${emoji.robot} What’s up?`,
    `Hi there ${username}! ${emoji.sparkles} Ready to chat!`,
    `Yo ${username}! ${emoji.fire} What’s going on?`,
  ];
  return randomChoice(replies);
}

function getFarewellReply(username) {
  const replies = [
    `Goodbye ${username}! ${emoji.wave} Come back soon!`,
    `See you later, ${username}! ${emoji.party}`,
    `Take care, ${username}! ${emoji.thumbsUp}`,
    `Catch you later, ${username}! ${emoji.robot}`,
  ];
  return randomChoice(replies);
}

function getCompliment() {
  const compliments = [
    "You're awesome! 😎",
    "Keep shining! ✨",
    "You're a star! 🌟",
    "Love your vibes! ❤️",
  ];
  return randomChoice(compliments);
}

function getFallbackReply() {
  const replies = [
    "I'm here if you want to chat! 🤖",
    "Tell me more! 💡",
    "That's interesting! 😄",
    "I love hearing from you! ❤️",
    "Keep it coming! 🔥",
  ];
  return randomChoice(replies);
}

client.once(Events.ClientReady, () => {
  console.log(`${emoji.robot} ${client.user.tag} is online!`);
});

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

  if (['hi', 'hello', 'hey', 'hola', 'how are you'].some(greet => lower.includes(greet))) {
    return message.reply(getGreetingReply(message.author.username));
  }

  if (['bye', 'goodbye', 'see ya', 'later', 'cya'].some(word => lower.includes(word))) {
    return message.reply(getFarewellReply(message.author.username));
  }

  if (['thank you', 'thanks', 'thx', 'ty'].some(word => lower.includes(word))) {
    return message.reply(`${emoji.thumbsUp} You’re welcome, ${message.author.username}!`);
  }

  if (['lol', 'haha', 'lmao', 'rofl'].some(word => lower.includes(word))) {
    try {
      await message.react('😂');
    } catch {}
    return message.reply("Glad I could make you laugh! 😄");
  }

  if (['awesome', 'great', 'cool', 'nice', 'love it'].some(word => lower.includes(word))) {
    return message.reply(getCompliment());
  }

  try {
    await message.react(emoji.robot);
    await message.react(emoji.sparkles);
  } catch {}

  return message.reply(getFallbackReply());
});

client.login(process.env.DISCORDJS_BOT_TOKEN);
