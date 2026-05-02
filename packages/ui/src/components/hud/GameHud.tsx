import type { ReactNode } from "react";
import { TimelineBar } from "./TimelineBar";
import type { TimelinePlayer } from "./TimelineBar";
import { KillFeed } from "./KillFeed";
import type { KillEvent } from "./KillFeed";
import { MatchTimer } from "./MatchTimer";
import { PlayerStatus } from "./PlayerStatus";
import type { PlayerStatusData } from "./PlayerStatus";

interface GameHudProps {
  readonly players: readonly TimelinePlayer[];
  readonly playerStatuses: readonly PlayerStatusData[];
  readonly killEvents: readonly KillEvent[];
  readonly localPlayerId: string;
  readonly elapsedSeconds: number;
  readonly matchLimitSeconds: number;
  readonly winThreshold: number;
  readonly children?: ReactNode;
}

export function GameHud({
  players,
  playerStatuses,
  killEvents,
  localPlayerId,
  elapsedSeconds,
  matchLimitSeconds,
  winThreshold,
  children,
}: GameHudProps): ReactNode {
  return (
    <div className="gameHud">
      <PlayerStatus
        players={playerStatuses}
        localPlayerId={localPlayerId}
      />

      <MatchTimer
        elapsedSeconds={elapsedSeconds}
        limitSeconds={matchLimitSeconds}
      />

      <KillFeed events={killEvents} />

      <TimelineBar
        players={players}
        winThreshold={winThreshold}
        localPlayerId={localPlayerId}
      />

      {children}
    </div>
  );
}
