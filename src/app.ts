import autoLoad from "@fastify/autoload";
import cors from "@fastify/cors";
import middie from "@fastify/middie";
import Fastify from "fastify";
import { join } from "path";
import { NODE_ENV } from "./utils/environment";

const dirname = process.cwd() + "/src";

const WHICH_API = NODE_ENV === "production" ? "PROD" : "DEV";

const corsOptions = {
  origin:
    WHICH_API === "PROD"
      ? ["https://radiologyarchive.com", /\.radiologyarchive\.com$/]
      : ["https://dev.radiologyarchive.com", "http://localhost:5173"],
  preflightContinue: true,
};

const fastifyApp = Fastify({ logger: NODE_ENV !== "production" });

fastifyApp.register(middie);
fastifyApp.register(cors, corsOptions);

fastifyApp.get("/", (_req, res) => {
  res.send(`You've reached RadiologyArchive's ${WHICH_API} API!`);
});

fastifyApp.register(autoLoad, {
  dir: join(dirname, "routes"),
  options: { prefix: "/api" },
});

export default fastifyApp;
