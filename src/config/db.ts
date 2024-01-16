import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { DATABASE_URL } from "../utils/environment";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const connection = {
  url: DATABASE_URL,
};

const dbConn = connect(connection);

const db = drizzle(dbConn);

export default db;
