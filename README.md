# Spotilocal

A simple Windows application that updates a text file with your current Spotify track!

Inspired by [Snip](https://github.com/dlrudie/Snip), but using a new approach for real-time updates.

## How it technically works

It loads the Spotify web player in a hidden window to detect track changes and saves them to text files. 

It doesn't need to send a single API request on top of the default player!

# Development

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

#### Install

```bash
npm install
```

#### Development

```bash
npm run dev
```

#### Build

```bash
npm run build:win
```
