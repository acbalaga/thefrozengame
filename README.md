# Snow Sparkle Match

A small winter match-3 game starring Princess Lumi. Plain HTML/CSS/JS, no build step. Audio is synthesized with Web Audio, so there are no sound files.

## Run and deploy

```sh
npm install
npm run dev      # local preview
npm run deploy   # Cloudflare Workers (static assets from ./public)
```

On iOS: open the deployed URL in Safari, Share, Add to Home Screen.

## Tweaking

- Levels: `LEVELS` at the top of `public/game.js` (moves, number of tile types, goal).
- Character art: `lumiSVG()` in `public/game.js` and `public/icon.svg`.
- Music: `SONG` in the `audio` block of `public/game.js`.
