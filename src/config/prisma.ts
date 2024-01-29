import { PrismaClient } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

export interface PrismaPluginOptions {
  url: string;
}

const prismaPlugin: FastifyPluginAsync<PrismaPluginOptions> = async (
  fastify,
  opts
) => {
  if (!opts.url) {
    fastify.log.error("Database url is required. Please pass a database url.");
    fastify.close();
  }

  const prisma = new PrismaClient();
  await prisma.$connect();

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
  fastify.decorate("prisma", prisma);

  fastify.log.info("Prisma plugin registered.");
};

export default fp(prismaPlugin);
