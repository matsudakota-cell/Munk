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

## Phase 1: a conversation in ooks

Try `Q` and `/` while the monkeys are near each other. Pip might take a bow, salute, or do a little dance. Momo startles, then giggles, waves, or claps. Occasionally Pip gives a much bigger reply, or Momo stays lost in a daydream. All controls keep working during every reaction.

Nearby birds take off and drift back to their usual wandering. Repeated calls let an ongoing reaction finish; the replies never trigger endless automatic exchanges. Sound is optional—the acting works with it turned off.

This is Phase 1 of the additive brief. Its playtest is still pending: let two children try the ook keys for five minutes and see whether the exchanges remain funny. Phase 2 (the first islander) waits for that playtest and the owner's approval.

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

Run the dependency-free gameplay tests:

```bash
npm test
```

The tests cover response variety and rarity, repeatable reaction selection, input freedom, bird recovery, sustained repeated input, and the five existing missions. They check behavior, not whether children find it funny.

## Project layout

- `app/` — the small site wrapper and page metadata.
- `public/game.html` — game interface and menus.
- `public/game.css` — responsive game presentation.
- `public/game.js` — Three.js scene, characters, animation, audio, camera, and input.
- `public/game-core.mjs` — mission rules and gameplay simulation.
- `public/monkey-personality.mjs` — Pip and Momo's expression and acting system.
- `public/vendor/` — locally served Three.js runtime and its license.
- `tests/` — gameplay and reaction checks using Node's built-in test runner.

Ook response selection and bird reaction timing live in `game-core.mjs`; `pose()` in `monkey-personality.mjs` supplies acting values; `game.js` applies them to the existing models and plays sound. Proximity is checked when a player ooks, not every rendered frame. Reaction selection uses its own seeded sequence, independent of decoration randomness.

## Design principles

- Cooperation should feel playful rather than demanding.
- Every mission should ask for a different kind of monkey behavior.
- Mistakes should create funny reactions instead of punishment.
- Pip and Momo should remain recognizable through their silhouettes, expressions, and habits.

Munks is an original prototype inspired by the joy of shared mischief games.
