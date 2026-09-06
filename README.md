# Munks

**Two little monkeys. One big island. Plenty of excellent bad ideas.**

Munks is a cooperative 3D browser game for two players sharing one keyboard. Play as Pip and Momo, explore Monkey Island, and complete five playful experiments together. There is no timer and no game over—just climbing, bouncing, music, bubbles, coconuts, and monkey mayhem.

## Play

[Play the current private build](https://munks-monkey-park.usbman86.chatgpt.site)

The hosted build is private and may require access through the owner's account.

## Controls

| Action | Pip — Player 1 | Momo — Player 2 |
| --- | --- | --- |
| Move | `W` `A` `S` `D` | Arrow keys |
| Interact | `E` | `Enter` |
| Jump | `Space` | `Shift` |
| Ook / greet | `Q` | `/` |
| Pause | `Esc` | `Esc` |

The camera follows both monkeys while they are close and switches to split-screen when they explore different parts of the island.

## Monkey Island missions

- **Treetop bell duet** — climb into the canopy and ring both bells together.
- **Jungle band** — perform `DO · MI · SO · LA · SO · DO`, with both monkeys joining the tune.
- **Bubble fountain** — stand on both pressure pedals long enough to give the island a bubble bath.
- **Coconut bowling** — roll coconuts down the lanes and topple all six pineapple pins.
- **Sky hoops** — use the trampolines to send both monkeys flying through three hoops.

## Meet the Munks

**Pip** is the little show-off: a wonky tuft, one proud tooth, head scratches, and victory spins.

**Momo** is the cuddly daydreamer: rosy cheeks, sleepy blinks, belly rubs, and shy waves.

They squash when they land, wobble when they collide, see stars after a bonk, and greet each other when one ooks nearby.

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. To create a production build:

```bash
npm run build
```

## Project layout

- `app/` — the small site wrapper and page metadata.
- `public/game.html` — game interface and menus.
- `public/game.css` — responsive game presentation.
- `public/game.js` — Three.js scene, characters, animation, audio, camera, and input.
- `public/game-core.mjs` — mission rules and gameplay simulation.
- `public/monkey-personality.mjs` — Pip and Momo's expression and acting system.
- `public/vendor/` — locally served Three.js runtime and its license.

## Design principles

- Cooperation should feel playful rather than demanding.
- Every mission should ask for a different kind of monkey behavior.
- Mistakes should create funny reactions instead of punishment.
- Pip and Momo should remain recognizable through their silhouettes, expressions, and habits.

Munks is an original prototype inspired by the joy of shared mischief games.
