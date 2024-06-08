import { DATABASE_URL } from "../utils/environment.js";
import postgres from "postgres";

const connectionString = DATABASE_URL;

const sql = postgres(connectionString);

export default sql;
