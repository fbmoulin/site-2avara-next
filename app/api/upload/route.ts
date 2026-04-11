import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getUser } from "@/lib/auth"

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
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
    return NextResponse.json(
      { error: "Arquivo muito grande. Máximo 5MB." },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `artigos/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer).slice(0, 4)
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49
  if (!isJpeg && !isPng && !isWebp) {
    return NextResponse.json({ error: "Conteúdo do arquivo não corresponde ao tipo." }, { status: 400 })
  }

  const { error } = await supabase.storage
    .from("images")
    .upload(fileName, buffer, {
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

      const { error: retryError } = await supabase.storage
        .from("images")
        .upload(fileName, buffer, {
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

  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(fileName)

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 })
}
