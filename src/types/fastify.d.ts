import { PlanetScaleDatabase } from "drizzle-orm/planetscale-serverless";
import "fastify";

declare module "fastify" {
  export interface FastifyInstance {
    db: PlanetScaleDatabase<typeof schema>;
  }

  export interface FastifyRequest {
    stripeID?: string | null;
    userUID?: string | null;
    body?: { image: string };
    params?: { uid: string };
  }
}
