import { NextRequest, NextResponse } from 'next/server'

const AGENT_API_KEY = process.env.AGENT_API_KEY || ''

export function verifyAgentKey(request: NextRequest): boolean {
  if (!AGENT_API_KEY) return false
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  return token === AGENT_API_KEY
}

export function unauthorized() {
  return NextResponse.json({ ok: false, error: 'Unauthorized — invalid or missing AGENT_API_KEY' }, { status: 401 })
}

export function success(data: unknown) {
  return NextResponse.json({ ok: true, data })
}

export function error(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status })
}
