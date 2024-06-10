import { FastifyPluginCallback, FastifyRequest } from "fastify";
import Stripe from "stripe";
import stripe, { stripeEventStore } from "../config/stripe";
import { STRIPE_WEBHOOK_SECRET_KEY } from "../utils/environment";

interface Event {
  data: {
    object: Stripe.Invoice;
  };
}

const validateEventData = (event: Event) => {
  const { id, hosted_invoice_url, metadata, total, paid, created } =
    event.data.object;

  if (!id) return false;
  if (!hosted_invoice_url) return false;
  if (!metadata?.image) return false;
  if (!metadata?.patient) return false;
  if (!metadata?.radiologist) return false;
  if (typeof total !== "number") return false;
  if (typeof paid !== "boolean") return false;
  if (!created) return false;

  return true;
};

const stripeRoutes: FastifyPluginCallback = (fastify, _, done) => {
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    function (_req, body, done) {
      try {
        done(null, body);
      } catch (error: unknown) {
        if (error instanceof Error) {
          done(error, undefined);
        }
      }
    }
  );

  fastify.post("/", (request: FastifyRequest<{ Body: string }>, reply) => {
    let event;

    try {
      if (!STRIPE_WEBHOOK_SECRET_KEY) {
        console.error(
          "STRIPE_WEBHOOK_SECRET_KEY is not defined in the environment variables"
        );
        process.exit(1);
      }
      event = stripe.webhooks.constructEvent(
        request.body,
        request.headers["stripe-signature"]!,
        STRIPE_WEBHOOK_SECRET_KEY
      );
      if (stripeEventStore.has(event.id)) {
        return reply.status(400).send(`Event ${event.id} already processed`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        // console.log(`❌ Error message: ${err.message}`);
        return reply.status(400).send(`Webhook Error: ${err.message}`);
      }
    }

    switch (event?.type) {
      case "charge.succeeded":
        break;
      case "customer.created":
        break;
      case "customer.updated":
        break;
      case "customer.source.created":
        break;
      case "invoiceitem.created":
        break;
      case "invoice.created":
        break;
      case "invoice.finalized":
        if (validateEventData(event)) {
          // createdAt is in GMT
          request.server.pg
            .query(
              `
            INSERT INTO "Invoice" (uid, url, image_uid, patient_uid, radiologist_uid, amount, paid, "createdAt")
            VALUES(
              ${event.data.object.id},
              ${event.data.object.hosted_invoice_url as string},
              ${event.data.object.metadata?.image as string},
              ${event.data.object.metadata?.patient as string},
              ${event.data.object.metadata?.radiologist as string},
              ${event.data.object.total / 100},
              ${event.data.object.paid},
              ${new Date(event.data.object.created * 1000)}
            )
            ON CONFLICT (uid) DO NOTHING
          `
            )
            .catch((error) => console.log("Error inserting invoice: ", error));
        }
        break;
      case "invoice.payment_succeeded":
        break;
      case "invoice.paid":
        try {
          /* sql`UPDATE Invoice SET paid = true WHERE uid = ${event.data.object.id}`;
        notify(
          event.data.object.metadata.radiologist,
          event.data.object.metadata.patient,
          `${event.data.object.customer_name} has paid for an analysis.`,
          "/patients"
        );
        stripeEventStore.add(event.id); */
        } catch (error) {
          console.log("Error updating invoice: ", error);
        }
        break;
      case "invoice.sent":
        break;
      case "invoice.updated":
        break;
      case "invoice.voided":
        // sql`UPDATE Invoice SET paid = true WHERE uid = ${event.data.object.id}`;
        break;
      case "payment_method.attached":
        break;
      case "payment_intent.created":
        break;
      case "payment_intent.succeeded":
        break;
      case "payment_intent.canceled":
        break;
      case "source.chargeable":
        break;

      default:
        console.log(`Unhandled event type ${event?.type}`);
    }

    reply.send();
  });

  done();
};

export const prefixOverride = "/webhook";

export default stripeRoutes;
