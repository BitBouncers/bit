import { FastifyListenOptions } from "fastify";
import buildFastify from "./app";
import { PORT } from "./utils/environment";

const options: FastifyListenOptions = {
  port: PORT,
  host: "0.0.0.0",
};

const app = buildFastify();

app.listen(options, (error: Error | null) => {
  if (error) throw error;
  console.log(`bit listening on port ${PORT}`);
});
