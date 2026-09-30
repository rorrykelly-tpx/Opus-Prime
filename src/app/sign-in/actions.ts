"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/server/auth";

const signInSchema = z.object({ option: z.string().min(1) });

export async function signInAction(formData: FormData) {
  const { option } = signInSchema.parse({ option: formData.get("option") });
  await signIn(option);
  redirect("/pathways");
}

export async function signOutAction() {
  await signOut();
  redirect("/sign-in");
}
