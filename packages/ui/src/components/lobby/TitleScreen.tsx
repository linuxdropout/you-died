import type { ReactNode } from "react";

interface TitleScreenProps {
  readonly onCreateRoom: () => void;
  readonly onJoinRoom: (code: string) => void;
  readonly roomCode: string;
  readonly onRoomCodeChange: (code: string) => void;
}

export function TitleScreen({
  onCreateRoom,
  onJoinRoom,
  roomCode,
  onRoomCodeChange,
}: TitleScreenProps): ReactNode {
  return (
    <div className="titleScreen">
      <div className="titleScreenBg" />

      <div className="titleScreenContent">
        <div className="titleScreenLogo">
          <span className="titleScreenPre">PREVIOUSLY ON:</span>
          <h1 className="titleScreenTitle">
            YOU<br />
            <span className="titleScreenTitleAccent">FUCKING</span><br />
            DIED
          </h1>
        </div>

        <div className="titleScreenMenu">
          <button
            type="button"
            className="titleScreenBtn titleScreenBtnPrimary"
            onClick={onCreateRoom}
          >
            CREATE ROOM
          </button>

          <div className="titleScreenJoin">
            <input
              type="text"
              className="titleScreenInput"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => { onRoomCodeChange(e.target.value.toUpperCase()); }}
              maxLength={6}
            />
            <button
              type="button"
              className="titleScreenBtn titleScreenBtnJoin"
              onClick={() => { onJoinRoom(roomCode); }}
              disabled={roomCode.length === 0}
            >
              JOIN
            </button>
          </div>
        </div>

        <p className="titleScreenTagline">
          EVERY HIT KILLS. DEATH REWINDS. PARADOX LAUNCHES.
        </p>
      </div>

      <div className="titleScreenGibDecor">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="titleScreenGib"
            style={{
              left: `${8 + (i * 7.5) % 85}%`,
              top: `${60 + (i * 13) % 35}%`,
              opacity: 0.1 + (i % 4) * 0.05,
              transform: `rotate(${i * 37}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
