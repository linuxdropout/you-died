# Previously On: You Fucking Died

## Concept

A deterministic browser-based 2D multiplayer platform fighter where every hit kills.

Players accumulate a **ticks counter** (displayed in seconds) that increases every tick they’re alive. When a player dies, they lose up to 10 seconds of ticks and respawn where they were 10 seconds ago. A past version of the player replays their full life in a loop — it looks like a real player to opponents but a ghost to the owner. Killing a past life severs it into a permanent ghost. If two players have linked unsevered past lives, killing the other’s past life first triggers a **paradox** — a powerful comeback mechanic that grants time and teleports the player.

The goal is to be the **first player to reach 30 seconds** of accumulated ticks with no tie.

## Target Experience

After several minutes, the arena should become a chaotic but readable mess of:

- rewound players
- ghost fighters
- lethal ghost bullets and sword swings
- permanent blood, limbs, and debris
- players hunting rivals to trigger paradoxes

The desired emotional loop is:

> get ruined → survive the timeline mess → find the player who caused it → kill them in the past → paradox forward.

## Core Rules

### Combat

- One hit kills.
- No health bars.
- Controls:
  - move
  - jump
  - dash
  - slash
  - shoot

### Ticks Counter

- Every tick a player is alive, their ticks counter increments by 1.
- Displayed in seconds (ticks / tick rate).
- Starts at 0.

### Timeline Head Death

If a player dies while controlling their current active self:

- they lose up to 10 seconds of ticks (minimum 0)
- they respawn at the position they were 10 seconds ago
- they receive a new `timelineId`
- a past version replays their **full life** (from spawn to death) in a loop
- the past version looks like a normal player to opponents, but a ghost to the owner
- permanent gore/debris is spawned

### Past Death (Severing)

If a looping past version of a player is killed:

- a `timelineSevered` event is created
- the past version becomes a ghost (visible to everyone as a ghost)
- the loop continues but can no longer be re-severed
- ghost bullets/slashes from severed timelines can still kill
- if the past self’s position in its current loop (tick-since-loop-start) is lower than the owner’s ticks counter, the owner loses time equal to the difference and respawns at a random spawn point
- permanent gore/debris is spawned

### Paradox

**Condition:** PlayerA has an unsevered past life that was created when PlayerB killed them. PlayerB also has an unsevered past life — the same timeline during which PlayerB killed PlayerA. These are "linked" past lives.

**Trigger:** If PlayerA kills PlayerB’s linked past life before PlayerB kills PlayerA’s.

**Result:**

- PlayerA’s own past life is severed (becomes a ghost)
- PlayerA **gains** ticks instead of losing them — regaining up to the tick value at the end of that life (minimum +5 seconds)
- PlayerA teleports to the end-position of that past life
- PlayerA receives invulnerability
- this is the main comeback mechanic

### Win Condition

A player wins when they reach **30 seconds** of accumulated ticks and no other player also has 30+ seconds. After the time limit (5 minutes), the player with the best KDA wins.

---

# Tech Stack

## Language

- TypeScript

## Client

- Vite
- PixiJS
- Web Audio API
- Custom deterministic simulation package

## Server

- Node.js
- Colyseus
- Shared simulation package
- WebSocket-based room/lobby system

## Repository Shape

```text
repo/
  apps/
    client/
    server/

  packages/
    sim/
    protocol/
    renderer/
    ui/
    assets/
```

---

# Modules

## 1. `packages/sim`

Owns deterministic game logic.

Responsibilities:

- fixed-tick simulation
- player movement
- jump/dash/slash/shoot
- one-hit death
- timeline head tracking
- rewind logic
- past-death detection
- ghost state
- paradox resolution
- win-condition checking

Public API:

```ts
createInitialState(config): GameState
step(state, inputs): GameState
getRenderableState(state): RenderFrame
```

## 2. `packages/protocol`

Owns shared client/server message types.

Responsibilities:

- input packet types
- server/client message schemas
- player IDs
- timeline IDs
- event IDs
- shared constants

Example messages:

```ts
type ClientMessage = { type: 'ready' } | { type: 'input'; tick: number; input: PlayerInput }

type ServerMessage =
  | { type: 'roomState'; players: LobbyPlayer[] }
  | { type: 'startMatch'; seed: number; playerId: string }
  | { type: 'inputs'; tick: number; inputs: Record<PlayerId, PlayerInput> }
```

## 3. `packages/renderer`

Owns PixiJS rendering.

Responsibilities:

- player sprites
- ghost rendering
- projectiles
- sword slashes
- gore/debris
- camera
- screen shake
- visual timeline effects

Consumes only `RenderFrame`.

## 4. `frontend`

Owns browser game shell.

Responsibilities:

- input capture
- local game loop
- PixiJS canvas setup
- server connection
- lobby screens
- HUD integration
- sim-to-renderer bridge

## 5. `backend`

Owns multiplayer rooms.

Responsibilities:

- lobby creation
- joining/leaving rooms
- ready checks
- match start
- player assignment
- authoritative tick loop
- input collection
- input broadcast
- match end

## 6. `packages/assets`

Owns game assets.

Responsibilities:

- spritesheets
- animation metadata
- sound effects
- visual effects
- asset manifests
- maps and content

---

# Determinism Rules

The simulation must follow these constraints:

- fixed tick rate
- no variable-delta gameplay logic
- no `Math.random()` inside simulation
- no `Date.now()` inside simulation
- no renderer-driven gameplay state
- no physics-engine authority over kills
- all gameplay state must be reproducible from seed + input log
- clients and server must use the same sim package

---

# Acceptance Criteria

## Core Gameplay

The game is done when:

- 2–4 players can join the same browser lobby
- players can move, jump, dash, slash, and shoot
- one hit kills
- head death loses up to 10 seconds of ticks and respawns at past position
- head death creates a looping past life (full life replay)
- past lives look normal to opponents, ghost to owner
- killing a past life severs it into a permanent ghost
- severed ghost attacks can still kill
- sever causes time loss if loop-tick < owner's ticks
- paradox triggers when linked past lives exist and one is killed first
- paradox grants ticks, teleports, and severs own past life
- a player wins by reaching 30 seconds of ticks with no tie, OR after a time limit (5mins) with best KDA.

## Multiplayer

The game is done when:

- players can create and join a lobby
- all players can ready up
- the server starts the match
- clients send inputs to the server
- the server broadcasts confirmed tick inputs
- all clients simulate the same match
- disconnects do not crash the room

## Visuals

The game is done when:

- normal players are clearly readable
- ghost players are visually distinct
- lethal ghost attacks are readable
- bullets and slashes are visible
- deaths create permanent gore/debris
- the arena becomes progressively more chaotic over time
- the HUD shows each player’s timeline offset

## Debugging

The game is done when:

- a match can be replayed from recorded inputs
- repeated replay of the same input log produces the same result
- state hashes can detect desyncs
- timeline events can be logged clearly:
  - death
  - rewind
  - timeline severed
  - paradox
  - future launch
  - win
