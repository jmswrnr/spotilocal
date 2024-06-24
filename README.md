[![GitHub package.json version](https://img.shields.io/github/v/release/jmswrnr/spotilocal)](https://github.com/jmswrnr/spotilocal/releases/latest)
[![Static Badge](https://img.shields.io/badge/Download-8aff80?logo=windows&logoColor=000)](https://github.com/jmswrnr/spotilocal/releases/latest)
[![Static Badge](https://img.shields.io/badge/Made_by_James_Warner-000000?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjBweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyMHB4IiBmaWxsPSIjZThlYWVkIj48cGF0aCBkPSJNNDgwLTQ4MHEtNjAgMC0xMDItNDJ0LTQyLTEwMnEwLTYwIDQyLTEwMnQxMDItNDJxNjAgMCAxMDIgNDJ0NDIgMTAycTAgNjAtNDIgMTAydC0xMDIgNDJaTTE5Mi0xOTJ2LTk2cTAtMjMgMTIuNS00My41VDIzOS0zNjZxNTUtMzIgMTE2LjUtNDlUNDgwLTQzMnE2MyAwIDEyNC41IDE3VDcyMS0zNjZxMjIgMTMgMzQuNSAzNHQxMi41IDQ0djk2SDE5MloiLz48L3N2Zz4%3D)
](https://jmswrnr.com/)
[![Static Badge](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?logo=buymeacoffee&logoColor=000)](https://buymeacoffee.com/jmswrnr)

# Spotilocal

A simple Windows application that updates a text file with your current Spotify track!

Inspired by [Snip](https://github.com/dlrudie/Snip), but using a new approach for real-time updates.

# Development

## How it technically works

It loads the Spotify web player in a hidden window to detect track changes and saves them to text files. 

It doesn't need to send a single API request on top of the default player!

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
