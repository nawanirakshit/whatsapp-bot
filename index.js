const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require('openai');
require('dotenv').config();

const CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  MODEL: 'gpt-4o-mini',
  MAX_TOKENS: 500,

  // Your bot's name and brand
  BOT_NAME: process.env.BOT_NAME,
  BRAND_NAME: process.env.BRAND_NAME,

  SYSTEM_PROMPT:
    'You are a helpful WhatsApp assistant called ' + process.env.BOT_NAME + '. Keep replies concise and friendly. ' +
    'Use simple language. Do not use markdown formatting like ** or ## as it does not render on WhatsApp.',

  // Whitelist — set to false to allow everyone
  USE_WHITELIST: true,
  ALLOWED_NUMBERS: process.env.ALLOWED_NUMBERS
    ? process.env.ALLOWED_NUMBERS.split(',')
    : [],

  REPLY_TO_GROUPS: false,
  MAX_HISTORY: 10,

  // How long (ms) before user session resets after inactivity
  // e.g. 30 mins = 1800000
  SESSION_TIMEOUT: 1800000,
};

// =============================================
//   FLOW DEFINITIONS
//   Add your custom flows here!
// =============================================

// Keywords that trigger specific replies (case-insensitive)
// Each entry: { keywords: [...], reply: '...' }
const KEYWORD_FLOWS = [
  {
    keywords: ['hi', 'hello', 'hey', 'hlo', 'hii', 'good morning', 'good evening', 'good afternoon'],
    reply: (name) =>
      `👋 Hello${name ? ' ' + name : ''}! Welcome to *${CONFIG.BRAND_NAME}*.\n\n` +
      `I'm ${CONFIG.BOT_NAME}, your virtual assistant. 😊\n\n` +
      `Type *menu* to see what I can help you with, or just ask me anything!`,
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'cya', 'take care'],
    reply: () =>
      `👋 Goodbye! Have a wonderful day!\n` +
      `Feel free to message anytime. We're always here to help! 😊`,
  },
  {
    keywords: ['thanks', 'thank you', 'thankyou', 'thx', 'ty'],
    reply: () =>
      `You're welcome! 😊 Is there anything else I can help you with?`,
  },
  {
    keywords: ['menu', 'options', 'help', 'what can you do'],
    reply: () =>
      `🤖 *${CONFIG.BOT_NAME} Menu*\n\n` +
      `Here's what I can help with:\n\n` +
      `1️⃣ *pricing* — View our pricing plans\n` +
      `2️⃣ *about* — Learn about us\n` +
      `3️⃣ *contact* — Get contact details\n` +
      `4️⃣ *hours* — Business hours\n` +
      `5️⃣ *support* — Get technical support\n\n` +
      `Or just type any question and I'll answer it! 💬`,
  },
  {
    keywords: ['pricing', 'price', 'cost', 'plans', 'rates', 'charges'],
    reply: () =>
      `💰 *Our Pricing Plans*\n\n` +
      `🟢 *Basic* — ₹999/month\n` +
      `   • Feature A\n` +
      `   • Feature B\n\n` +
      `🔵 *Pro* — ₹2499/month\n` +
      `   • Everything in Basic\n` +
      `   • Feature C\n` +
      `   • Feature D\n\n` +
      `🟣 *Enterprise* — Custom pricing\n` +
      `   • Unlimited everything\n\n` +
      `Reply *contact* to speak with our sales team!`,
  },
  {
    keywords: ['about', 'who are you', 'what is this', 'company'],
    reply: () =>
      `🏢 *About ${CONFIG.BRAND_NAME}*\n\n` +
      `We are a leading provider of [your product/service].\n\n` +
      `🎯 Our mission: [your mission here]\n` +
      `📍 Location: [your city, country]\n` +
      `🌐 Website: www.yourbusiness.com\n\n` +
      `Type *menu* to explore more options!`,
  },
  {
    keywords: ['contact', 'reach', 'call', 'email', 'phone'],
    reply: () =>
      `📞 *Contact Us*\n\n` +
      `📱 Phone: +91-XXXXXXXXXX\n` +
      `📧 Email: support@yourbusiness.com\n` +
      `🌐 Website: www.yourbusiness.com\n` +
      `📍 Address: [Your Address]\n\n` +
      `Our team typically responds within 24 hours! ⏰`,
  },
  {
    keywords: ['hours', 'timing', 'open', 'working hours', 'business hours'],
    reply: () =>
      `🕐 *Business Hours*\n\n` +
      `Monday - Friday: 9:00 AM - 6:00 PM\n` +
      `Saturday: 10:00 AM - 4:00 PM\n` +
      `Sunday: Closed 🔒\n\n` +
      `*Current status:* ${isBusinessHours() ? '🟢 We are OPEN!' : '🔴 We are CLOSED'}\n\n` +
      `Outside hours? Leave a message and we'll get back to you!`,
  },
  {
    keywords: ['support', 'issue', 'problem', 'help me', 'not working', 'error'],
    reply: () =>
      `🛠️ *Support Center*\n\n` +
      `I'm sorry you're facing an issue! Let me help.\n\n` +
      `Please describe your problem in detail and I'll either:\n` +
      `✅ Solve it right here\n` +
      `📋 Raise a support ticket for you\n\n` +
      `What's the issue you're facing?`,
  },
];

// Number-based menu selections (when user replies with just a number)
const MENU_SELECTIONS = {
  '1': 'pricing',
  '2': 'about',
  '3': 'contact',
  '4': 'hours',
  '5': 'support',
};

// =============================================
//   SETUP
// =============================================

const openai = new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY, });
const conversationHistory = {};
const userSessions = {}; // tracks last activity time per user

// =============================================
//   HELPER FUNCTIONS
// =============================================

function getHistory(sender) {
  if (!conversationHistory[sender]) conversationHistory[sender] = [];
  return conversationHistory[sender];
}

function addToHistory(sender, role, content) {
  const history = getHistory(sender);
  history.push({ role, content });
  if (history.length > CONFIG.MAX_HISTORY) {
    conversationHistory[sender] = history.slice(-CONFIG.MAX_HISTORY);
  }
}

function clearHistory(sender) {
  conversationHistory[sender] = [];
  userSessions[sender] = Date.now();
}

function isAllowed(sender) {
  if (!CONFIG.USE_WHITELIST) return true;
  return CONFIG.ALLOWED_NUMBERS.includes(sender);
}

// Check if current time is within business hours
function isBusinessHours() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();
  if (day === 0) return false; // Sunday closed
  if (day === 6) return hour >= 10 && hour < 16; // Saturday
  return hour >= 9 && hour < 18; // Mon-Fri
}

// Check if user session timed out (reset history if inactive too long)
function checkSessionTimeout(sender) {
  const lastActivity = userSessions[sender];
  if (lastActivity && Date.now() - lastActivity > CONFIG.SESSION_TIMEOUT) {
    clearHistory(sender);
    return true; // session was reset
  }
  userSessions[sender] = Date.now();
  return false;
}

// Match message against keyword flows
function matchKeywordFlow(message) {
  const lower = message.toLowerCase().trim();
  for (const flow of KEYWORD_FLOWS) {
    if (flow.keywords.some((kw) => lower === kw || lower.startsWith(kw))) {
      return flow;
    }
  }
  return null;
}

// =============================================
//   WHATSAPP CLIENT EVENTS
// =============================================

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  },
  webVersionCache: {
    type: 'remote',
    remotePath:
      'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
  },
});

client.on('qr', (qr) => {
  console.log('\n📱 Scan this QR code with WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('🔐 Authenticated successfully!');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
});

client.on('ready', () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ ${CONFIG.BOT_NAME} is ready!`);
  console.log(`📋 Whitelist  : ${CONFIG.USE_WHITELIST ? 'ON' : 'OFF'}`);
  console.log(`👥 Groups     : ${CONFIG.REPLY_TO_GROUPS ? 'ON' : 'OFF'}`);
  console.log(`🕐 Open now   : ${isBusinessHours() ? 'YES' : 'NO'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

client.on('disconnected', (reason) => {
  console.log('⚠️  Disconnected:', reason);
});

// =============================================
//   MESSAGE HANDLER
// =============================================

client.on('message', async (msg) => {

  // --- FILTERS ---
  if (msg.fromMe) return;
  if (msg.from === 'status@broadcast') return;
  if (!msg.body || msg.body.trim() === '') return;
  if (!CONFIG.REPLY_TO_GROUPS && msg.from.includes('@g.us')) return;

  const sender = msg.from;
  const userMessage = msg.body.trim();

  if (!isAllowed(sender)) {
    console.log(`⛔ Ignored: ${sender}`);
    return;
  }

  console.log(`\n📩 From ${sender}: ${userMessage}`);

  // Check session timeout
  const wasReset = checkSessionTimeout(sender);

  // --- BUILT-IN COMMANDS ---

  if (userMessage.toLowerCase() === '!clear') {
    clearHistory(sender);
    await msg.reply('🧹 Conversation history cleared!');
    return;
  }

  if (userMessage.toLowerCase() === '!help') {
    await msg.reply(
      `Commands:\n` +
      `!clear - reset conversation memory\n` +
      `!help  - show this message\n\n` +
      `Type *menu* to see all options.`
    );
    return;
  }

  // --- SHOW TYPING ---
  try {
    const chat = await msg.getChat();
    await chat.sendStateTyping();
  } catch (e) {
    // typing indicator is optional, ignore errors
  }

  // --- NUMBER MENU SELECTION ---
  if (MENU_SELECTIONS[userMessage]) {
    const keyword = MENU_SELECTIONS[userMessage];
    const flow = KEYWORD_FLOWS.find((f) => f.keywords.includes(keyword));
    if (flow) {
      const reply = flow.reply();
      await msg.reply(reply);
      console.log(`📋 Menu selection ${userMessage} → ${keyword}`);
      return;
    }
  }

  // --- KEYWORD FLOW MATCH ---
  const matchedFlow = matchKeywordFlow(userMessage);
  if (matchedFlow) {
    // Try to get contact name for greeting
    let contactName = '';
    try {
      const contact = await msg.getContact();
      contactName = contact.pushname || '';
    } catch (e) { }

    const reply = matchedFlow.reply(contactName);
    await msg.reply(reply);
    console.log(`✅ Keyword match: "${userMessage}"`);
    return;
  }

  // --- AI FALLBACK ---
  try {
    addToHistory(sender, 'user', userMessage);

    const response = await openai.chat.completions.create({
      model: CONFIG.MODEL,
      messages: [
        { role: 'system', content: CONFIG.SYSTEM_PROMPT },
        ...getHistory(sender),
      ],
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: 0.7,
    });

    const botReply = response.choices[0].message.content.trim();
    addToHistory(sender, 'assistant', botReply);

    console.log(`🤖 AI reply: ${botReply}`);
    await msg.reply(botReply);

  } catch (error) {
    console.error('❌ Error:', error.message);
    // await msg.reply('Sorry, I ran into an error. Please try again in a moment.');
    if (error.status === 429) {
      await msg.reply(
        '⚠️ AI service is temporarily unavailable due to API quota limits.'
      );
    } else {
      await msg.reply(
        'Sorry, I ran into an error. Please try again later.'
      );
    }
  }
});

// =============================================
//   START
// =============================================

console.log('🚀 Starting bot...');
client.initialize();