import autoLoad from "@fastify/autoload";
import cors from "@fastify/cors";
import middie from "@fastify/middie";
import postgres from "@fastify/postgres";
import ajvKeywords from "ajv-keywords";
import Fastify from "fastify";
import { join } from "path";
import { API_VERSION, DATABASE_URL, NODE_ENV } from "./utils/environment";

const dirname = process.cwd() + "/src";

const WHICH_API = NODE_ENV === "production" ? "PROD" : "DEV";

const corsOptions = {
  origin:
    WHICH_API === "PROD"
      ? ["https://radiologyarchive.com", /\.radiologyarchive\.com$/]
      : ["https://dev.radiologyarchive.com", "http://localhost:5173"],
  preflightContinue: true,
};

const buildFastify = (opts?: { log?: boolean }) => {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const fastifyApp = Fastify({
    ajv: {
      plugins: [ajvKeywords],
    },
    logger: opts?.log ?? NODE_ENV !== "production",
  });

  fastifyApp.addHook("onRoute", async (route) => {
    fastifyApp.log.info(route.method + " " + route.url);
  });

  fastifyApp.register(postgres, { connectionString: DATABASE_URL });
  fastifyApp.register(cors, corsOptions);
  fastifyApp.register(middie);

  fastifyApp.get("/", (_request, reply) => {
    if (API_VERSION) reply.header("Api-Version", API_VERSION);
    reply.send(`You've reached RadiologyArchive's ${WHICH_API} API!`);
  });

  fastifyApp.register(autoLoad, {
    dir: join(dirname, "routes"),
    options: { prefix: "/api" },
  });

  return fastifyApp;
};

export default buildFastify;
