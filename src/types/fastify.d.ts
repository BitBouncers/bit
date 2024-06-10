import "fastify";
import { RequestGenericInterface } from "fastify";

declare module "fastify" {
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

  interface NotificationReadBody extends RequestGenericInterface {
    Body: {
      read: string[];
    };
  }

  interface UserUIDParams extends RequestGenericInterface {
    Params: {
      uid: string;
    };
  }
}
