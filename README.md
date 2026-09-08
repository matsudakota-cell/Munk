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

Phase 1 has been played by the children and approved for moving on.

## Phase 2: the fisherman’s hat

Find the fisherman beside the little pond to the right of Munks HQ, near the bottom of the island. His straw hat rests on a low stool. Walk up and press `E` or `Enter` to wear it. If he is looking toward shore, he makes a slow double-take. If he is watching the water, he only notices on his next glance at the stool.

Use interact near the stool to put it back, or elsewhere to set it down for either monkey to pick up. Existing mission interactions keep priority. The hat follows the monkey through jumps, bonks, and ooks. There is no reward or extra checklist entry. Restart resets the fisherman and any hat that has not been brought home to the nest.

Phase 2 has been approved for moving on.

## Phase 3: increasingly suspicious

Ook, jump, or take the hat where the fisherman can see you. Each monkey has their own attention: he starts oblivious, becomes suspicious with squints and muttering, then throws both hands up in exasperation. Repeat witnessed antics to get the bigger performance. Quiet time gradually calms him down.

Attention drives his acting and, with Phase 4, a short chase after an exasperated performance. Unseen theft can make him discover an empty stool, but he does not blame a monkey he never saw. Passing the hat never transfers attention. Restart clears both monkeys’ attention.

Phase 3 has been approved for moving on. More islanders are a later addition.

## Phase 4: a very short pursuit

After a full exasperated performance, the fisherman leaves his rod and chair to jog after the monkey he saw. He is slower than the monkeys, stays on foot, and gives up when they reach elevated ground or escape. Ordinary jumps keep the pursuit going, but he can only catch a monkey after they land. After a short pursuit he stops to catch his breath, then walks his route back to the pond, muttering.

Jumps can be noticed at any point in their visible flight, once per jump, so hopping while he turns toward you counts even if he missed takeoff.

If he catches that monkey, he gently picks them up, carries them a few steps, and puts them down. Movement and interaction resume on release; ooks still work during the lift. Only their held object returns to its original spot, and their attention resets to zero. Their partner stays free, keeps their own belongings, and cannot become the chase target. Completed missions and deposited nest treasures remain intact. No respawn screen, score penalty, or game over.

Pause freezes the chase and carry. Restart returns everyone to the starting state while keeping the nest collection. The chase fix has been played and Phase 4 approved for moving on.

## Phase 5: a home for your finds

The open tree nest is left of Munks HQ. Look for the house symbol on the map and the ladder. Either monkey can press `E` / `Enter` at the ladder to climb in or out; both can explore the nest together.

Pick up a cushion, feather, pearly shell, or shiny spoon with interact. Carry a find up the ladder and it automatically becomes a permanent, visible decoration. The fisherman’s hat can become a souvenir too: once deposited, it stays in the nest instead of returning to his stool. He still reacts to ooks and jumps.

Two pictures suggest something soft and something shiny. The cushion or feather fits the soft picture; the shell or spoon fits the shiny picture. Matching pictures turn green, but collecting is optional and has no deadline, score, or checklist. Every find has a physical place in the den.

The collection saves in this browser and profile using localStorage. Refreshing the page or starting a fresh adventure keeps it. Other browsers, devices, the local preview, and the downloadable game have separate collections. Clearing site data clears the collection. If storage is unavailable, the current adventure stays playable and a message explains that the nest could not be saved for next time.

Only deposited object IDs are persisted, under `munks.nest.v1`; transient missions, positions, held items, and attention start fresh. Invalid saves are handled safely. There is no collection reset button, so restarting cannot accidentally erase the nest.

The owner authorized continuing into Phase 6 ahead of the weekend family playtest. The nest still awaits the children’s verdict: do they want to show someone their collection? More dramatic mischief reactions remain a later polish pass.

## Phase 6: monkey see, monkey do

The fisherman occasionally waves, stretches, or salutes when he turns toward shore. Stand nearby and press the existing ook button (`Q` for Pip, `/` for Momo) while the **Copy** hint appears. The monkey copies him, and he answers the gesture after a short beat. This friendly exchange adds no attention, goal, or reward.

The monkeys can copy each other’s stretches, salutes, waves, and imitations too. Pip adds a wobble, a bigger wave, or an overambitious stretch; Momo is gentler. Every copy needs a player’s button press, so the exchange never starts an endless automatic loop. Existing reactions finish before another imitation starts.

Outside a matching gesture, the ook button keeps its normal behavior. Movement, jumping, collecting, and mission interactions still work during imitations. Pause freezes the exchange; restart clears the transient gestures while keeping the nest collection. No new buttons or dependencies were added.

Mimicry and the nest are ready for the weekend playtest. More NPCs and Easter eggs remain future additions; Phase 7 in the original brief adds anchor and relay mission shapes.

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
- `public/fisherman.mjs` — the single fisherman’s routine, sight checks, and hat ownership.
- `public/fisherman-personality.mjs` — pure acting poses for idle and discovery beats.
- `public/fisherman-movement.mjs` — bounded foot chases, gentle carries, safe release, and return routes.
- `public/nest.mjs` — nest entry, collectible ownership, permanent deposits, and pictorial wants.
- `public/nest-storage.mjs` — validated collection saves and graceful storage failure handling.
- `public/mimicry.mjs` — gesture matching, deliberate imitations, and character-specific gesture poses.
- `public/vendor/` — locally served Three.js runtime and its license.
- `tests/` — gameplay and reaction checks using Node's built-in test runner.

Ook response selection and bird reaction timing live in `game-core.mjs`; `pose()` in `monkey-personality.mjs` supplies acting values; `game.js` applies them to the existing models and plays sound. Proximity is checked when a player ooks, not every rendered frame. Reaction selection uses its own seeded sequence, independent of decoration randomness.

The fisherman follows the same rules/acting/render split. His routine and discovery decisions tick at 8 Hz; taking the hat checks range and facing once at interaction time. Rendering interpolates the acting, with no raycasts, new dependencies, or loaded assets. Tests cover immediate versus delayed discovery, single hat ownership, returning and exchanging the hat, input freedom, and scene attachment through pause/restart. Humor still needs a family playtest.

Nest tests cover both players entering and depositing, alternative wants, exchanged and dropped finds, catches, persistence validation, unavailable storage, and restoration of the physical display on a fresh page. The scene test uses real Three.js objects with GPU drawing stubbed; it does not replace a browser visual check or family playtest.

## Design principles

- Cooperation should feel playful rather than demanding.
- Every mission should ask for a different kind of monkey behavior.
- Mistakes should create funny reactions instead of punishment.
- Pip and Momo should remain recognizable through their silhouettes, expressions, and habits.

Munks is an original prototype inspired by the joy of shared mischief games.
