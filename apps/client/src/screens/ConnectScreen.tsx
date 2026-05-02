interface Props {
  onConnect: () => void
  error: string | null
}

export function ConnectScreen({ onConnect, error }: Props) {
  return (
    <div className="connectScreen">
      <div className="connectScreenBg" />

      <div className="connectScreenContent">
        <span className="connectScreenPre">PREVIOUSLY ON:</span>
        <h1 className="connectScreenTitle">
          YOU<br />
          <span className="connectScreenTitleAccent">FUCKING</span><br />
          DIED
        </h1>

        <button
          type="button"
          className="connectScreenBtn"
          onClick={onConnect}
        >
          CONNECT
        </button>

        {error && <p className="connectScreenError">{error}</p>}
      </div>

      <div className="connectScreenGibDecor">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="connectScreenGib"
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
  )
}
