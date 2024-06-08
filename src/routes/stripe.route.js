import express from "express";
import sql from "../config/db.js";
import stripe, { stripeEventStore } from "../config/stripe.js";
import { notify } from "../services/notification.service.js";
import { STRIPE_WEBHOOK_SECRET_KEY } from "../utils/environment.js";

const router = express.Router();

router.post(express.raw({ type: "application/json" }), (req, res) => {
  let event;

  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET_KEY);
    if (stripeEventStore.has(event.id)) {
      return res.status(400).send(`Event ${event.id} already processed`);
    }
  } catch (err) {
    console.log(`❌ Error message: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
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
      // createdAt is in GMT
      sql`
        INSERT INTO "Invoice" (uid, url, image_uid, patient_uid, radiologist_uid, amount, paid, "createdAt")
        VALUES(
          ${event.data.object.id},
          ${event.data.object.hosted_invoice_url},
          ${event.data.object.metadata.image},
          ${event.data.object.metadata.patient},
          ${event.data.object.metadata.radiologist},
          ${event.data.object.total / 100},
          ${event.data.object.paid},
          ${new Date(event.data.object.created * 1000)}
        )
        ON CONFLICT (uid) DO NOTHING
        `.catch((error) => console.log("Error inserting invoice: ", error));
      break;
    case "invoice.payment_succeeded":
      break;
    case "invoice.paid":
      try {
        sql`UPDATE Invoice SET paid = true WHERE uid = ${event.data.object.id}`;
        notify(
          event.data.object.metadata.radiologist,
          event.data.object.metadata.patient,
          `${event.data.object.customer_name} has paid for an analysis.`,
          "/patients"
        );
        stripeEventStore.add(event.id);
      } catch (error) {
        console.log("Error updating invoice: ", error);
      }
      break;
    case "invoice.sent":
      break;
    case "invoice.updated":
      break;
    case "invoice.voided":
      sql`UPDATE Invoice SET paid = 1 WHERE uid = ${event.data.object.id}`;
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
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
});

export default router;
