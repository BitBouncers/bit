import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../utils/environment";

if (!STRIPE_SECRET_KEY) {
  console.error(
    "STRIPE_SECRET_KEY is not defined in the environment variables"
  );
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

const stripeEventStore = new Set();

export { stripeEventStore };

export default stripe;
