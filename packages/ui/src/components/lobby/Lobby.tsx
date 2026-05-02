import type { ReactNode } from "react";

export interface LobbyPlayer {
  readonly playerId: string;
  readonly name: string;
  readonly ready: boolean;
  readonly color: string;
}

interface LobbyProps {
  readonly roomCode: string;
  readonly players: readonly LobbyPlayer[];
  readonly localPlayerId: string;
  readonly isReady: boolean;
  readonly maxPlayers: number;
  readonly onReady: () => void;
  readonly onLeave: () => void;
  readonly hostId?: string;
  readonly countdownSeconds?: number | null;
  readonly onStart?: () => void;
  readonly onCancel?: () => void;
  readonly children?: ReactNode;
}

export function Lobby({
  roomCode,
  players,
  localPlayerId,
  isReady,
  maxPlayers,
  onReady,
  onLeave,
  hostId,
  countdownSeconds,
  onStart,
  onCancel,
  children,
}: LobbyProps): ReactNode {
  const allReady = players.length >= 1 && players.every((p) => p.ready);
  const isHost = localPlayerId === hostId;
  const counting = countdownSeconds != null && countdownSeconds > 0;

  return (
    <div className="lobby">
      <div className="lobbyPanel">
        <div className="lobbyHeader">
          <h1 className="lobbyTitle">LOBBY</h1>
          <span className="lobbyCode">{roomCode}</span>
        </div>

        {children}

        <div className="lobbySlots">
          {Array.from({ length: maxPlayers }, (_, i) => {
            const player = players[i];
            if (player == null) {
              return (
                <div key={i} className="lobbySlot lobbySlotEmpty">
                  <span className="lobbySlotLabel">WAITING...</span>
                </div>
              );
            }

            const isLocal = player.playerId === localPlayerId;
            const isPlayerHost = player.playerId === hostId;

            return (
              <div
                key={player.playerId}
                className={[
                  "lobbySlot",
                  player.ready ? "lobbySlotReady" : "",
                  isLocal ? "lobbySlotLocal" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className="lobbySlotSwatch"
                  style={{ backgroundColor: player.color }}
                />
                <span className="lobbySlotName">
                  {isLocal ? `${player.name} (YOU)` : player.name}
                  {isPlayerHost && <span className="lobbySlotHost">HOST</span>}
                </span>
                <span className="lobbySlotStatus">
                  {player.ready ? "READY" : "..."}
                </span>
              </div>
            );
          })}
        </div>

        <div className="lobbyActions">
          <button
            type="button"
            className={`lobbyBtn ${isReady ? "lobbyBtnUnready" : "lobbyBtnReady"}`}
            onClick={onReady}
            disabled={counting}
          >
            {isReady ? "UNREADY" : "READY UP"}
          </button>
          {isHost && counting && onCancel && (
            <button
              type="button"
              className="lobbyBtn lobbyBtnCancel"
              onClick={onCancel}
            >
              CANCEL ({countdownSeconds})
            </button>
          )}
          {isHost && !counting && onStart && (
            <button
              type="button"
              className="lobbyBtn lobbyBtnStart"
              onClick={onStart}
              disabled={!allReady}
            >
              START
            </button>
          )}
          <button
            type="button"
            className="lobbyBtn lobbyBtnLeave"
            onClick={onLeave}
          >
            BAIL
          </button>
        </div>

        {counting && (
          <div className="lobbyStarting">
            STARTING IN {countdownSeconds}...
          </div>
        )}
      </div>

      <div className="lobbyDecoration">
        <span className="lobbyDecoSlash">/</span>
        <span className="lobbyDecoBullet">*</span>
      </div>
    </div>
  );
}
