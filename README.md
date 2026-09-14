# Bedrock Railway Client

This project uses the official `bedrock-protocol` npm package directly.

## 1. Edit settings.json

Change:

- `server.host` → your Bedrock server address
- `server.port` → your Bedrock server port
- `bot.username` → your Minecraft/Xbox profile name

Do not put a Microsoft password, access token, or device-code secret in this file.

## 2. Deploy on Railway

Upload/push this folder to GitHub, then deploy the repository on Railway.

Railway will run:

`npm install`

and then:

`npm start`

The app listens on Railway's `PORT` environment variable.

## 3. Microsoft login

For an online Bedrock server, the client uses normal Microsoft/Xbox authentication.

When Railway logs show a device-code prompt, complete the normal Microsoft sign-in. Authentication is cached in `.minecraft/`, which is ignored by Git.

## 4. Dashboard

Open the Railway-generated public URL.

- `/` = dashboard
- `/api/status` = JSON status
- `/health` = health check

## Important

This project does not bypass CAPTCHA, server verification, anti-bot systems, or authentication controls. It only uses normal Microsoft authentication.

If the server rejects the client, use the Railway logs to identify the server/protocol/auth error.
