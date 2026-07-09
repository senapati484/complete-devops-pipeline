import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production")
    }
    return "dev-secret-do-not-use-in-production"
  }
  return secret
}

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" })
}

export function verifyToken(
  token: string
): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string; role: string }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
