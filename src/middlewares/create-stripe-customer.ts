import { FastifyReply, FastifyRequest, PaymentInvoiceProcess } from "fastify";
import stripe from "../config/stripe";

/** Middleware that checks if the image requested for an invoice exists */
export const createStripeCustomer = async (
  request: FastifyRequest<PaymentInvoiceProcess>,
  reply: FastifyReply
) => {
  await request.server.pg
    .query(
      `SELECT stripe_id FROM "StripeUser" WHERE patient_uid = '${request.userUID}'`
    )
    .then((result) => {
      if (result.rowCount && result.rowCount > 0) {
        request.stripeID = result.rows[0].stripe_id;
      } else {
        try {
          request.server.pg
            .query(
              `SELECT email, first_name, last_name FROM "User" WHERE uid = '${request.userUID}'`
            )
            .then((result) => {
              const { email, first_name, last_name } = result.rows[0];
              request.patientEmail = email;
              request.patientName = first_name + " " + last_name;

              if (
                (typeof request.patientEmail !== "string" &&
                  request.patientEmail === undefined) ||
                (typeof request.patientName !== "string" &&
                  request.patientName === undefined) ||
                (typeof request.userUID !== "string" &&
                  request.userUID === undefined)
              ) {
                return reply
                  .code(500)
                  .send({ success: false, msg: "Error creating customer" });
              }

              stripe.customers
                .create({
                  email: request.patientEmail,
                  name: request.patientName,
                  metadata: {
                    patientUID: request.userUID,
                    radiologistUID: request.params.uid,
                  },
                })
                .then((customer) => {
                  if (customer.id) {
                    request.server.pg
                      .query(
                        `INSERT IGNORE INTO "StripeUser" (patient_uid, stripe_id) VALUES('${request.userUID}', '${customer.id}')`
                      )
                      .then((result) => {
                        if (result.rowCount) {
                          request.stripeID = customer.id;
                          console.log("Stripe user created");
                        }
                      })
                      .catch((error) => {
                        console.log(error);
                        reply
                          .code(500)
                          .send({ msg: "Error creating customer" });
                      });
                  } else {
                    reply
                      .code(500)
                      .send({ success: false, msg: "Error creating customer" });
                  }
                });
            });
        } catch (error) {
          console.log("createStripeCustomer: ", error);
        }
      }
    });
};

export default createStripeCustomer;
