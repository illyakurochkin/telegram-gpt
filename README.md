# Telegram-GPT

## Introduction

Telegram-GPT is a versatile chatbot integration for Telegram, utilizing OpenAI's GPT models. Developed with NestJS, it provides an intelligent chatbot experience on Telegram. The bot can operate in two modes: long polling and webhook, determined by the `TELEGRAM_WEBHOOK_URL` environment variable.

## Features

- **Dual Operating Modes**: Runs as a long polling bot or a webhook bot based on configuration.
- **GPT-Powered Conversations**: Leverages OpenAI's GPT models for engaging interactions.
- **NestJS Framework**: Delivers a robust, scalable architecture.
- **TypeORM for Data Management**: Efficient user and interaction data handling.
- **Modular Structure**: Organized for maintainability and scalability.
- **Unit Testing Framework**: Ensures the reliability of the application.

## Installation

Requires Node.js and npm.

```bash
git clone [Repository URL]
cd telegram-gpt
npm install
```

## Configuration

Set up the necessary environment variables:

```dotenv
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"

# For webhook mode
PORT="http-server-port"
TELEGRAM_WEBHOOK_URL="your-webhook-url" # Optional
```

## Running the Application

The application can run in two modes based on the TELEGRAM_WEBHOOK_URL:

- **Long Polling Mode**: Default mode if `TELEGRAM_WEBHOOK_URL` is not set.
- **Webhook Mode**: Set `TELEGRAM_WEBHOOK_URL` to enable.

```bash
npm start
```

## Usage

Interact with the ChatbBot on Telegram. The bot uses AI to provide relevant responses.

## Contributing
To contribute to the project:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/YourFeature`).
3. Commit changes (`git commit -am 'Add YourFeature'`).
4. Push to the branch (`git push origin feat/YourFeature`).
5. Create a Pull Request.

## Testing
Ensure functionality with:

```bash
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
