import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

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
    const compress = formData.get('compress') as string // "logo" | "thumb" | falsy

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF, SVG, PDF' },
        { status: 400 }
      )
    }

    const maxSize = compress ? 2 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${compress ? '2MB' : '10MB'}` },
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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // SVG: sanitize and save as-is (no compression needed)
    if (file.type === 'image/svg+xml') {
      const filename = `${timestamp}-${safeName}${ext}`
      const filepath = path.join(uploadDir, filename)
      const svgText = buffer.toString('utf-8')
      const sanitized = sanitizeSvg(svgText)
      await writeFile(filepath, sanitized, 'utf-8')

      return NextResponse.json({
        success: true,
        path: `/uploads/${folder}/${filename}`,
        filename,
        size: file.size,
      })
    }

    // Raster images: optionally compress with sharp
    if (compress && file.type !== 'application/pdf') {
      const size = compress === 'logo' ? 128 : 256
      const filename = `${timestamp}-${safeName}.webp`
      const filepath = path.join(uploadDir, filename)

      const compressed = await sharp(buffer)
        .resize(size, size, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()

      await writeFile(filepath, compressed)

      return NextResponse.json({
        success: true,
        path: `/uploads/${folder}/${filename}`,
        filename,
        size: compressed.length,
        originalSize: file.size,
        compressed: true,
      })
    }

    // Default: save as-is
    const filename = `${timestamp}-${safeName}${ext}`
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    return NextResponse.json({
      success: true,
      path: `/uploads/${folder}/${filename}`,
      filename,
      size: file.size,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
