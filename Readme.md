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
ALLOWED_NUMBERS=919876543210@c.us,37400642359438@lid
BOT_NAME= MY_BOT_NAME_HERE
BRAND_NAME= MY_BRAND_NAME_HERE
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


# Whitelist Configuration

The bot supports restricting access to specific WhatsApp numbers using a whitelist.

---

## Allow Only Specific Numbers

In `index.js`, locate:

```js id="j3gbvr"
USE_WHITELIST: true,
ALLOWED_NUMBERS: [
  '919876543210@c.us',
],
```

Replace the number with your own WhatsApp number in international format.

Example:

```text id="vpk6yv"
+91 9876543210
```

becomes:

```text id="j7p90m"
919876543210@c.us
```

---

## Multiple Allowed Numbers

You can allow multiple users:

```js id="oqy23j"
ALLOWED_NUMBERS: [
  '919876543210@c.us',
  '919123456789@c.us',
],
```

---

## Allow Everyone (Disable Whitelist)

To allow all users to interact with the bot:

```js id="z5l11f"
USE_WHITELIST: false,
```

When disabled, the bot will reply to every incoming message.

---

## Important Notes

* Include country code without `+`
* Use full WhatsApp mobile number
* Format:

```text id="fb13n2"
countrycode + mobilenumber + @c.us
```

Example:

```text id="ol4cz8"
919876543210@c.us
```

---

## WhatsApp @lid Issue

Some WhatsApp accounts may appear as:

```text id="jprf9w"
37400642359438@lid
```

instead of:

```text id="yrsvaz"
919876543210@c.us
```

This is normal with newer WhatsApp multi-device support.

To allow such users, directly add the `@lid` value to `ALLOWED_NUMBERS`.

Example:

```js id="2u5m0r"
ALLOWED_NUMBERS: [
  '37400642359438@lid',
],
```
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
