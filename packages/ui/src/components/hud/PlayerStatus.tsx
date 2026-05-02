import type { ReactNode } from "react";

export interface PlayerStatusData {
  readonly playerId: string;
  readonly name: string;
  readonly kills: number;
  readonly deaths: number;
  readonly timelineCount: number;
  readonly isGhost: boolean;
  readonly isDead: boolean;
  readonly color: string;
}

interface PlayerStatusProps {
  readonly players: readonly PlayerStatusData[];
  readonly localPlayerId: string;
}

export function PlayerStatus({
  players,
  localPlayerId,
}: PlayerStatusProps): ReactNode {
  return (
    <div className="playerStatus">
      {players.map((player) => {
        const isLocal = player.playerId === localPlayerId;

        return (
          <div
            key={player.playerId}
            className={[
              "playerStatusRow",
              player.isGhost ? "playerStatusRowGhost" : "",
              player.isDead ? "playerStatusRowDead" : "",
              isLocal ? "playerStatusRowLocal" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span
              className="playerStatusSwatch"
              style={{ backgroundColor: player.color }}
            />
            <span className="playerStatusName">
              {isLocal ? "YOU" : player.name}
            </span>
            <span className="playerStatusKd">
              {player.kills}/{player.deaths}
            </span>
            <span className="playerStatusTimelines">
              x{player.timelineCount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
