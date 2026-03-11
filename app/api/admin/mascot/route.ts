import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let settings = await prisma.mascotSettings.findUnique({
      where: { id: 'main' },
    })

    if (!settings) {
      settings = await prisma.mascotSettings.create({
        data: { id: 'main' },
      })
    }

    // Don't expose auth token in full
    const masked = {
      ...settings,
      authToken: settings.authToken
        ? `${settings.authToken.slice(0, 6)}****${settings.authToken.slice(-4)}`
        : '',
    }

    return NextResponse.json(masked)
  } catch (error) {
    console.error('Error fetching mascot settings:', error)
    return NextResponse.json({ error: 'Failed to fetch mascot settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      mascotType, displayName, greeting, systemPrompt,
      gatewayUrl, authToken, agentId,
      weightIdle, weightWalking, weightCoding, weightWriting, weightKarate,
      weightPhone, weightPresenting, weightCoffee, weightCalling,
      moveSpeed, primaryColor, showOn, background,
    } = data

    // Build update object — only include fields that are provided
    const updateData: Record<string, unknown> = {}
    if (mascotType !== undefined) updateData.mascotType = mascotType
    if (displayName !== undefined) updateData.displayName = displayName
    if (greeting !== undefined) updateData.greeting = greeting
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt
    if (gatewayUrl !== undefined) updateData.gatewayUrl = gatewayUrl
    if (authToken !== undefined && !authToken.includes('****')) updateData.authToken = authToken
    if (agentId !== undefined) updateData.agentId = agentId
    if (weightIdle !== undefined) updateData.weightIdle = weightIdle
    if (weightWalking !== undefined) updateData.weightWalking = weightWalking
    if (weightCoding !== undefined) updateData.weightCoding = weightCoding
    if (weightWriting !== undefined) updateData.weightWriting = weightWriting
    if (weightKarate !== undefined) updateData.weightKarate = weightKarate
    if (weightPhone !== undefined) updateData.weightPhone = weightPhone
    if (weightPresenting !== undefined) updateData.weightPresenting = weightPresenting
    if (weightCoffee !== undefined) updateData.weightCoffee = weightCoffee
    if (weightCalling !== undefined) updateData.weightCalling = weightCalling
    if (moveSpeed !== undefined) updateData.moveSpeed = moveSpeed
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (showOn !== undefined) updateData.showOn = showOn
    if (background !== undefined) updateData.background = background

    const settings = await prisma.mascotSettings.upsert({
      where: { id: 'main' },
      update: updateData,
      create: { id: 'main', ...updateData },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating mascot settings:', error)
    return NextResponse.json({ error: 'Failed to update mascot settings' }, { status: 500 })
  }
}
