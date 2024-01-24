import { PlanetScaleDatabase } from "drizzle-orm/planetscale-serverless";
import "fastify";
import { RequestGenericInterface } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    db: PlanetScaleDatabase<typeof schema>;
  }

  interface FastifyRequest {
    stripeID?: string;
    userUID?: string;
    body?: { image: string };
    params?: { uid: string };
  }

  interface AuthLoginBody extends RequestGenericInterface {
    Body: {
      email: string;
      password: string;
    };
  }

  interface UserUIDParams extends RequestGenericInterface {
    Params: {
      uid: string;
    };
  }
}
