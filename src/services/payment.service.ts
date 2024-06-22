import {
  FastifyReply,
  FastifyRequest,
  PaymentInvoiceProcess,
  PaymentInvoiceVoid,
  PaymentInvoices,
} from "fastify";
import stripe from "../config/stripe";

interface IPaymentService {
  invoice: (
    request: FastifyRequest<PaymentInvoiceProcess>,
    reply: FastifyReply
  ) => Promise<void>;

  invoices: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

  invoicesOfUser: (
    request: FastifyRequest<PaymentInvoices>,
    reply: FastifyReply
  ) => Promise<void>;

  voidInvoice: (
    request: FastifyRequest<PaymentInvoiceVoid>,
    reply: FastifyReply
  ) => Promise<void>;
}

export default class PaymentService implements IPaymentService {
  invoice = async (
    request: FastifyRequest<PaymentInvoiceProcess>,
    reply: FastifyReply
  ) => {
    try {
      if (
        !request.stripeID ||
        typeof request.stripeID !== "string" ||
        !request.userUID ||
        typeof request.userUID !== "string"
      ) {
        return reply
          .code(422)
          .send({ success: false, msg: "Error creating invoice." });
      }
      await stripe.invoiceItems
        .create({
          customer: request.stripeID,
          amount: (Math.floor(Math.random() * 201) + 100) * 100,
          currency: "usd",
          description: "Professional opinion from a radiologist",
        })
        .then((invoiceItems) => {
          return stripe.invoices.create({
            customer: invoiceItems.customer as string,
            collection_method: "send_invoice",
            days_until_due: 30,
            payment_settings: {
              payment_method_types: ["card", "ach_debit"],
            },
            pending_invoice_items_behavior: "include",
            metadata: {
              image: request.body.image,
              patient: request.userUID as string,
              radiologist: request.params.uid,
            },
          });
        })
        .then(async (invoice) => {
          await stripe.invoices.sendInvoice(invoice.id).then(() => {
            request.server.pg
              .query(
                `
              INSERT INTO "PatientRelation" (patient_uid, staff_uid)
              VALUES ('${request.userUID}', '${request.params.uid}')
              ON CONFLICT(patient_uid, staff_uid) DO NOTHING
          `
              )
              .catch((error) =>
                console.log(
                  "payment.service.invoice: ",
                  error.code,
                  error.message
                )
              );
            reply.code(200).send({
              success: true,
              msg: "Successfully created invoice.",
            });
          });
        });
    } catch (error: unknown) {
      console.log("Error creating invoice: ", error);
      reply.code(500).send({ success: false, msg: "Error creating invoice." });
    }
  };

  invoices = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await request.server.pg.query(
        `
        SELECT uid, url, radiologist_uid, amount, paid, "createdAt"
        FROM "Invoice"
        WHERE patient_uid = '${request.userUID}'
        ORDER BY "createdAt" DESC
        `
      );

      if (!result.rowCount) {
        return reply.code(200).send({ data: [] });
      }

      reply.code(200).send({ data: result.rows });
    } catch (error: unknown) {
      console.log("Error retrieving invoices: ", error);
      reply
        .code(500)
        .send({ success: false, msg: "Error retrieving invoices." });
    }
  };

  invoicesOfUser = async (
    request: FastifyRequest<PaymentInvoices>,
    reply: FastifyReply
  ) => {
    try {
      const result = await request.server.pg.query(
        `SELECT uid, url, radiologist_uid, amount, paid, "createdAt"
      FROM "Invoice"
      WHERE patient_uid = '${request.params.userId}'
      ORDER BY "createdAt" DESC
      `
      );

      if (!result.rowCount) {
        return reply.code(200).send({ data: [] });
      }

      reply.code(200).send({ data: result.rows });
    } catch (error: unknown) {
      console.log("Error fetching invoices o f user: ", error);
      reply.code(409).send({
        msg: "Unable to fetch invoices of user",
        path: request.originalUrl,
      });
    }
  };

  voidInvoice = async (
    request: FastifyRequest<PaymentInvoiceVoid>,
    reply: FastifyReply
  ) => {
    try {
      const result = await request.server.pg.query(`
        UPDATE "Invoice" SET paid = true WHERE uid = '${request.params.invoiceId}' AND paid = false;
      `);

      if (result.rowCount === 0) {
        return reply.code(200).send({
          success: true,
          msg: "Invoice has already been paid or does not exist",
        });
      }

      reply
        .code(200)
        .send({ success: true, msg: "Successfully voided invoice" });
    } catch (error: unknown) {
      console.log("Error voiding invoice: ", error);
      reply.code(409).send({
        msg: "Unable to void invoice",
        path: request.originalUrl,
      });
    }
  };
}
