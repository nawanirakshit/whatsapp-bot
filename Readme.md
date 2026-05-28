# WhatsApp AI Bot

A simple WhatsApp bot built using `whatsapp-web.js` and OpenAI.

---

# How to Run the Code

Start the project using the following command:

```bash
node index.js
```

---

# Prerequisites

Create a `.env` file in the root directory and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

---

# Install Dependencies

Run the following command to install all required packages:

```bash
npm install
```

---

# Features

* WhatsApp automation
* AI-powered replies using OpenAI
* Keyword-based menu system
* Conversation history support
* Whitelist support
* Group message control

---

# Required Packages

* whatsapp-web.js
* openai
* dotenv
* qrcode-terminal

Install manually if needed:

```bash
npm install whatsapp-web.js openai dotenv qrcode-terminal
```

---

# Start the Bot

Run:

```bash
node index.js
```

Then scan the QR code using WhatsApp:

1. Open WhatsApp
2. Go to Linked Devices
3. Click "Link a Device"
4. Scan the QR shown in terminal

---

# Notes

* Never commit your `.env` file to GitHub.
* Keep your OpenAI API key private.
* Add `.env` to `.gitignore`.

Example:

```gitignore
.env
node_modules
```
