"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "./auth-provider"
import { API_URL } from "@/lib/config"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // 1. Only connect if user is logged in
    if (!user || !token) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    // 2. Initialize Socket Connection
    // We pass userId in query so backend knows who this is
    const socketInstance = io(`${API_URL}`, {
      query: { userId: user.id },
      transports: ["websocket"], 
    })

    socketInstance.on("connect", () => {
      console.log("🟢 Socket Connected:", socketInstance.id)
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("🔴 Socket Disconnected")
      setIsConnected(false)
    })

    setSocket(socketInstance)

    // Cleanup on unmount or logout
    return () => {
      socketInstance.disconnect()
    }
  }, [user?.id, token]) 

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
