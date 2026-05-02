interface Props {
  onConnect: () => void
  error: string | null
}

export function ConnectScreen({ onConnect, error }: Props) {
  return (
    <main>
      <h1>You Died</h1>
      <button onClick={onConnect}>Connect</button>
      {error && <p>{error}</p>}
    </main>
  )
}
