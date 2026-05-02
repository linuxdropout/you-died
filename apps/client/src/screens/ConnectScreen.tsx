import { useState } from 'react'
import type { AudioContextGuard } from '@you-died/renderer'
import { TitleScreen } from '@you-died/ui'
import { useUiSounds } from '../hooks/use-ui-sounds'

interface Props {
  onCreateRoom: () => void
  onJoinRoom: (code: string) => void
  error: string | null
  audioGuard: AudioContextGuard
}

export function ConnectScreen({ onCreateRoom, onJoinRoom, error, audioGuard }: Props) {
  const [roomCode, setRoomCode] = useState('')
  const { playClick } = useUiSounds(audioGuard)

  return (
    <>
      <TitleScreen
        onCreateRoom={() => {
          playClick()
          onCreateRoom()
        }}
        onJoinRoom={(code) => {
          playClick()
          onJoinRoom(code)
        }}
        roomCode={roomCode}
        onRoomCodeChange={setRoomCode}
      />
      {error && <div className="titleScreenError">{error}</div>}
    </>
  )
}
