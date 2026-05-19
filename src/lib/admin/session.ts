import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET no está configurado");
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createToken(): string {
  const payload = b64url(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }),
  );
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD no está configurado");
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
