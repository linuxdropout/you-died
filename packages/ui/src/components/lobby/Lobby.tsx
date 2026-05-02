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
}

export function Lobby({
  roomCode,
  players,
  localPlayerId,
  isReady,
  maxPlayers,
  onReady,
  onLeave,
}: LobbyProps): ReactNode {
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  return (
    <div className="lobby">
      <div className="lobbyPanel">
        <div className="lobbyHeader">
          <h1 className="lobbyTitle">LOBBY</h1>
          <span className="lobbyCode">{roomCode}</span>
        </div>

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
          >
            {isReady ? "UNREADY" : "READY UP"}
          </button>
          <button
            type="button"
            className="lobbyBtn lobbyBtnLeave"
            onClick={onLeave}
          >
            BAIL
          </button>
        </div>

        {allReady && (
          <div className="lobbyStarting">
            STARTING...
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
