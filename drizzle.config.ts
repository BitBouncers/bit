import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  dbCredentials: {
    uri: process.env.DATABASE_URL as string,
  },
  driver: "mysql2",
  out: "./drizzle",
  schema: "./drizzle/schema.ts",
} satisfies Config;
