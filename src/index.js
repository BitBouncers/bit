import app from "./app.js";
import { PORT } from "./utils/environment.js";

app.listen(PORT ?? 3000, () => console.log(`bit listening on port ${PORT}!`));
