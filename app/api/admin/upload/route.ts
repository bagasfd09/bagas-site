import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

function sanitizeSvg(svgContent: string): string {
  let clean = svgContent.replace(/<script[\s\S]*?<\/script>/gi, '')
  clean = clean.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
  clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
  return clean
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF, SVG' },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const safeName = file.name
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase()
    const filename = `${timestamp}-${safeName}${ext}`
    const filepath = path.join(uploadDir, filename)

    const bytes = await file.arrayBuffer()

    if (file.type === 'image/svg+xml') {
      const svgText = Buffer.from(bytes).toString('utf-8')
      const sanitized = sanitizeSvg(svgText)
      await writeFile(filepath, sanitized, 'utf-8')
    } else {
      await writeFile(filepath, Buffer.from(bytes))
    }

    const publicPath = `/uploads/${folder}/${filename}`

    return NextResponse.json({
      success: true,
      path: publicPath,
      filename,
      size: file.size,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
