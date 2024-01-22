import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import * as schema from "drizzle/schema";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

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
  const db = drizzle(dbConn, { schema });

  fastify.decorate("db", db);

  fastify.log.info("Drizzle plugin registered.");
};

export default fp(drizzlePlugin);
