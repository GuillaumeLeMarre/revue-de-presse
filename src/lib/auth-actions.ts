"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import argon2 from "argon2";
import { getSession } from "@/lib/session";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

export interface LoginState {
  error?: string;
}

async function getClientKey(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for") ?? "unknown";
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = formData.get("password");
  const clientKey = await getClientKey();

  if (isRateLimited(clientKey)) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Mot de passe requis." };
  }

  const passwordHash = process.env.APP_PASSWORD_HASH;
  if (!passwordHash) {
    throw new Error("APP_PASSWORD_HASH is not configured");
  }

  const valid = await argon2.verify(passwordHash, password);
  if (!valid) {
    recordFailedAttempt(clientKey);
    return { error: "Mot de passe incorrect." };
  }

  clearAttempts(clientKey);

  const session = await getSession();
  session.authenticated = true;
  await session.save();

  redirect("/");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
