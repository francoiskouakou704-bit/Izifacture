import { z } from 'zod'

// Messages = clés de traduction (validation.*), traduites côté client.

const email = z.string().trim().toLowerCase().email('validation.invalidEmail').max(254, 'validation.tooLong')
/** 8 caractères minimum, au moins une lettre et un chiffre. */
const newPassword = z
  .string()
  .min(8, 'validation.passwordMin')
  .max(72, 'validation.tooLong')
  .regex(/[A-Za-zÀ-ɏ]/, 'validation.passwordMin')
  .regex(/\d/, 'validation.passwordMin')

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'validation.passwordRequired').max(72, 'validation.tooLong'),
})

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'validation.nameMin').max(120, 'validation.tooLong'),
  email,
  password: newPassword,
})

export const forgotPasswordSchema = z.object({ email })
export const resetPasswordSchema = z.object({ password: newPassword })

/** Chemin interne sûr pour une redirection après connexion (« /x », jamais « //hôte »). */
export function safeNextPath(next: unknown, fallback = '/dashboard') {
  return typeof next === 'string' && /^\/(?![/\\])[^\s\\]*$/.test(next) ? next : fallback
}
