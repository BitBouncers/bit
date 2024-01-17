import { FastifyListenOptions } from "fastify";
import app from "./app";
import { PORT } from "./utils/environment";

const options: FastifyListenOptions = {
  port: PORT,
  host: "0.0.0.0",
};

app.listen(options, (error: Error | null) => {
  if (error) throw error;
  console.log(`bit listening on port ${PORT}`);
});
