"use client";

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (isConnected && isMounted) {
    return (
      <div>
        <p>Connected as {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        <Button onClick={() => disconnect()}>Disconnect</Button>
      </div>
    )
  }

  if (!isMounted) {
    // Render nothing during SSR/hydration
    return <div></div>
  }

  return (
    <div>
      {connectors.map((connector) => (
        <Button
          key={connector.id}
          onClick={() => connect({ connector })}
        >
          {connector.name}
        </Button>
      ))}
    </div>
  )
}
