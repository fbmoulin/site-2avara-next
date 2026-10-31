import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/auth"
import { AdminAccessError } from "@/lib/admin-policy"

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch (error) {
    const denied = error instanceof AdminAccessError ? error : new AdminAccessError(503)
    return NextResponse.json({ error: denied.message }, { status: denied.status })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato não suportado. Use JPG, PNG ou WebP." },
      { status: 400 }
    )
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 5MB." }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `artigos/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  if (!isJpeg && !isPng && !isWebp) {
    return NextResponse.json(
      { error: "Conteúdo do arquivo não corresponde ao tipo." },
      { status: 400 }
    )
  }

  const { error } = await supabase.storage.from("images").upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    // Bucket may not exist — try to create it
    if (error.message.includes("not found") || error.message.includes("Bucket")) {
      await supabase.storage.createBucket("images", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: 5 * 1024 * 1024,
      })

      const { error: retryError } = await supabase.storage.from("images").upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

      if (retryError) {
        console.error("[upload]", retryError)
        return NextResponse.json(
          { error: "Erro interno no upload. Tente novamente." },
          { status: 500 }
        )
      }
    } else {
      console.error("[upload]", error)
      return NextResponse.json(
        { error: "Erro interno no upload. Tente novamente." },
        { status: 500 }
      )
    }
  }

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName)

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 })
}
