import { connect } from "@planetscale/database";
import {
  PlanetScaleDatabase,
  drizzle,
} from "drizzle-orm/planetscale-serverless";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    db: PlanetScaleDatabase;
  }
}

export interface DrizzlePluginOptions {
  url: string;
}

const drizzlePlugin: FastifyPluginAsync<DrizzlePluginOptions> = async (
  fastify,
  opts
) => {
  if (!opts.url) {
    fastify.log.error(
      "DrizzlePluginOptions.url is required. Please provide a database url."
    );
    fastify.close();
  }

  const dbConn = connect(opts);
  const db = drizzle(dbConn);

  fastify.decorate("db", db);

  fastify.log.info("Drizzle plugin registered.");
};

export default fp(drizzlePlugin);
