import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const settings = await prisma.mascotSettings.findUnique({
      where: { id: 'main' },
    })

    if (!settings || !settings.gatewayUrl || !settings.authToken) {
      return new Response(
        JSON.stringify({ error: 'OpenClaw not configured. Set Gateway URL and Auth Token in Mascot Settings.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build the request with system prompt
    const chatMessages = [
      { role: 'system', content: settings.systemPrompt },
      ...messages,
    ]

    const url = `${settings.gatewayUrl.replace(/\/$/, '')}/v1/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.authToken}`,
        ...(settings.agentId ? { 'x-openclaw-agent-id': settings.agentId } : {}),
      },
      body: JSON.stringify({
        model: settings.agentId ? `openclaw/${settings.agentId}` : 'openclaw',
        messages: chatMessages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMsg = `OpenClaw error: ${response.status}`
      try {
        const parsed = JSON.parse(errorText)
        errorMsg = parsed?.error?.message || errorMsg
      } catch { /* use raw status */ }
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream SSE response back to client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in mascot chat:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to connect to OpenClaw gateway' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
