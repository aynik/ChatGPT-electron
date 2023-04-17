# ChatGPT Desktop App

This is a desktop app for [ChatGPT](https://chat.openai.com/), a chatbot that uses GPT-3 to have conversations with you.

Is also a fork of [ChatGPT-electron](https://github.com/mantreshkhurana/ChatGPT-electron) to include a custom websockets bridge to expose chat functionality to the outside.

![Screenshot](https://raw.githubusercontent.com/aynik/ChatGPT-electron/stable/screenshots/screenshot-1.png)

## Installation

```bash
git clone https://github.com/mantreshkhurana/ChatGPT-electron.git
cd ChatGPT-electron
npm install
```

## Run

```bash
npm start
```

## Build

Binary files for Windows, Linux and Mac are available in the `release-builds/` folder.

### For Windows

```bash
npm run package-win
```

### For Linux

```bash
npm run package-linux
```

### For Mac

```bash
npm run package-mac
```

## Using the bridge

You can communicate with the bridge this way:

- Using gpt-3.5-turbo:

```
curl -X POST -d 'What is the capital city of South Africa?' http://localhost:5678/chat
curl -X POST -d 'And Ghana?' http://localhost:5678/chat-continue
```

- Using gpt-4:

```
curl -X POST -d 'What is the capital city of South Africa?' http://localhost:5678/chat-4
curl -X POST -d 'And Ghana?' http://localhost:5678/chat-continue-4
```

## Credits

- [OpenAI](https://openai.com/)
- [mantreshkhurana](https://github.com/mantreshkhurana)
