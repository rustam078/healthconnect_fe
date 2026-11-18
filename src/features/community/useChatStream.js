import { useEffect, useRef } from 'react'

// Subscribes to the chat SSE stream using fetch (so we can send the Bearer token, which
// EventSource cannot). Parses SSE frames and calls handlers[eventName](data). Reconnects on drop.
export function useChatStream(handlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined
    const controller = new AbortController()
    let closed = false

    const dispatch = (frame) => {
      let event = 'message'
      let data = ''
      for (const line of frame.split('\n')) {
        if (line.startsWith(':')) return // heartbeat comment
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (!data) return
      let payload
      try {
        payload = JSON.parse(data)
      } catch {
        payload = data
      }
      handlersRef.current?.[event]?.(payload)
    }

    const connect = async () => {
      try {
        const res = await fetch('/api/v1/communities/stream', {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: controller.signal,
        })
        if (!res.ok || !res.body) throw new Error(`stream ${res.status}`)
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (!closed) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let idx = buffer.indexOf('\n\n')
          while (idx >= 0) {
            dispatch(buffer.slice(0, idx))
            buffer = buffer.slice(idx + 2)
            idx = buffer.indexOf('\n\n')
          }
        }
      } catch {
        // falls through to reconnect below
      }
      if (!closed) setTimeout(connect, 3000)
    }

    connect()
    return () => {
      closed = true
      controller.abort()
    }
  }, [])
}
