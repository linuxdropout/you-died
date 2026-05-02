# Previously On: You Fucking Died

## Concept

A deterministic browser-based 2D multiplayer platform fighter where every hit kills.

When a player dies while controlling their current timeline head, they rewind 10 seconds and continue from a new timeline. If a player’s past self is killed, their later actions become untouchable ghost actions that still render and remain lethal. If this creates a paradox, the affected player is launched forward in time.

The goal is to become **30 seconds ahead of every other player**.

## Target Experience

After several minutes, the arena should become a chaotic but readable mess of:

- rewound players
- ghost fighters
- lethal ghost bullets and sword swings
- permanent blood, limbs, and debris
- players hunting rivals to trigger paradox launches

The desired emotional loop is:

> get ruined → survive the timeline mess → find the player who caused it → kill them in the past → launch forward.

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

### Timeline Head Death

If a player dies while controlling their current active self:

- they rewind 10 seconds
- they receive a new `timelineId`
- no ghost is created
- permanent gore/debris is spawned

### Past Death

If a non-head version of a player is killed:

- a `timelineSevered` event is created
- actions from that timeline after the sever point become ghost actions
- ghost players cannot be affected
- ghost bullets/slashes can still kill
- permanent gore/debris is spawned

### Paradox

When a timeline is severed, any later sever event caused by that newly severed timeline is un-severed.

Result:

- the affected player resumes from where they were previously killed
- they are launched forward in time
- this is the main comeback mechanic

### Win Condition

A player wins when they are **30 seconds ahead of every other player’s current timeline head**.

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
- head death rewinds the player 10 seconds
- head death creates no ghost
- past death creates a severed timeline
- severed future actions render as ghosts
- ghost players cannot be affected
- ghost bullets and slashes can kill
- paradox events restore invalidated sever events
- paradox restoration launches players forward
- a player can win by getting 30 seconds ahead of everyone else OR after a time limit (5mins) with best KDA.

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
