"use server"

import { z } from "zod/v4"
import { eq } from "drizzle-orm"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { requireOwner } from "@/lib/auth"
import { db } from "@/lib/db"
import { staffUsers } from "@/lib/db/schema"

const roleSchema = z.enum(["assessor", "estagiario"])
export async function registerStaff(_state: { message: string }, form: FormData) {
  const owner = await requireOwner()
  const parsed = z
    .object({
      email: z
        .email()
        .max(255)
        .transform((value) => value.toLowerCase()),
      role: roleSchema,
      password: z.string().min(12).max(128),
    })
    .safeParse(Object.fromEntries(form))
  if (!parsed.success)
    return { message: "Informe e-mail válido, perfil e senha inicial com ao menos 12 caracteres." }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key)
    return {
      message:
        "Cadastro indisponível: a administração de contas do Supabase ainda não foi configurada neste ambiente.",
    }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  let userId: string | undefined
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
    })
    if (error || !data.user)
      return {
        message:
          "Não foi possível criar a conta. Verifique se o e-mail já está cadastrado e tente novamente.",
      }
    userId = data.user.id
    await db
      .insert(staffUsers)
      .values({ id: userId, email: parsed.data.email, role: parsed.data.role, updatedBy: owner.id })
  } catch {
    // An identity without a staff record has no access. Never log credentials.
    if (userId) console.error("[staff] account_created_without_access")
    return {
      message:
        "Não foi possível concluir o cadastro. Se a conta foi criada, ela permanece sem acesso; use Vincular conta existente após verificar o UUID no Supabase.",
    }
  }
  revalidatePath("/admin/usuarios")
  return { message: "Usuário cadastrado. Entregue a senha inicial por um canal seguro." }
}

export async function linkStaff(_state: { message: string }, form: FormData) {
  const owner = await requireOwner()
  const parsed = z.object({ id: z.uuid(), role: roleSchema }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { message: "Informe UUID e perfil válidos." }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { message: "Administração de contas não configurada neste ambiente." }
  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await supabase.auth.admin.getUserById(parsed.data.id)
    if (error || !data.user?.email)
      return { message: "Conta não localizada no Supabase deste ambiente." }
    // Bootstrap owners cannot be downgraded through this interface.
    if (
      process.env.ADMIN_USER_IDS?.split(",").some(
        (id) => id.trim().toLowerCase() === parsed.data.id.toLowerCase(),
      )
    )
      return { message: "A conta responsável é gerenciada separadamente." }
    await db
      .insert(staffUsers)
      .values({
        id: data.user.id,
        email: data.user.email.toLowerCase(),
        role: parsed.data.role,
        updatedBy: owner.id,
      })
      .onConflictDoNothing()
  } catch {
    return { message: "Não foi possível vincular a conta." }
  }
  revalidatePath("/admin/usuarios")
  return { message: "Vínculo verificado. Confira a lista de usuários." }
}

export async function updateStaff(_state: { message: string }, form: FormData) {
  const owner = await requireOwner()
  const parsed = z
    .object({ id: z.uuid(), role: roleSchema, active: z.enum(["true", "false"]) })
    .safeParse(Object.fromEntries(form))
  if (!parsed.success) return { message: "Dados inválidos." }
  if (
    process.env.ADMIN_USER_IDS?.split(",").some(
      (id) => id.trim().toLowerCase() === parsed.data.id.toLowerCase(),
    )
  )
    return { message: "A conta responsável é gerenciada separadamente." }
  try {
    await db
      .update(staffUsers)
      .set({
        role: parsed.data.role,
        active: parsed.data.active === "true",
        updatedAt: new Date(),
        updatedBy: owner.id,
      })
      .where(eq(staffUsers.id, parsed.data.id))
  } catch {
    return { message: "Não foi possível alterar o acesso." }
  }
  revalidatePath("/admin/usuarios")
  return { message: "Permissões atualizadas. Valem para as próximas requisições." }
}
