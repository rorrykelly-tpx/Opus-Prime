import { z } from "zod";

// Add each new environment variable here and to .env.example.
// Anything exposed to the browser must be prefixed NEXT_PUBLIC_.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
