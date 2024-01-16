import { FastifyReply, FastifyRequest } from "fastify";

/* interface PaymentRequest extends FastifyRequest {
  stripeID: string;
  userUID: string;
  body: { image: string };
  params: { uid: string };
} */

declare module "fastify" {
  interface FastifyRequest {
    stripeID: string;
    userUID: string;
  }
}

export async function invoice(
  _request: FastifyRequest<{
    Body: { image: string };
    Params: { uid: string };
  }>,
  _reply: FastifyReply
) {
  /* await stripe.invoiceItems
    .create({
      customer: request.stripeID,
      amount: (Math.floor(Math.random() * 201) + 100) * 100,
      currency: "usd",
      description: "Professional opinion from a radiologist",
    })

    .then((invoiceItems) => {
      return stripe.invoices.create({
        customer: invoiceItems.customer.toString(),
        collection_method: "send_invoice",
        days_until_due: 30,
        payment_settings: {
          payment_method_types: ["card", "ach_debit"],
        },
        pending_invoice_items_behavior: "include",
        metadata: {
          image: request.body.image,
          patient: request.userUID,
          radiologist: request.params.uid,
        },
      });
    })
    .then((invoice) => {
      stripe.invoices.sendInvoice(invoice.id).then(() => {
        db.execute(
          "INSERT IGNORE INTO PatientRelation(patient_uid, staff_uid) VALUES(?, ?)",
          [request.userUID, request.params.uid]
        ).catch((error) =>
          console.log("payment.service.invoice: ", error.code, error.message)
        );
        reply.status(200).send({
          success: true,
          msg: "Successfully created invoice.",
        });
      });
    })
    .catch((error) => {
      console.log("Error creating invoice: ", error);
      reply
        .status(500)
        .send({ success: false, msg: "Error creating invoice." });
    }); */
}

export async function invoices(_request: FastifyRequest, _reply: FastifyReply) {
  /* await db
    .execute(
      "SELECT uid, url, radiologist_uid, amount, paid, createdAt FROM Invoice WHERE patient_uid = ? \
         ORDER BY createdAt DESC",
      [request.userUID]
    )
    .then((result) => {
      reply.status(200).send({ data: result.rows });
    })
    .catch((error) => {
      console.log("Error fetching invoices: ", error);
      reply.status(409).send({
        msg: "Unable to fetch invoices",
        path: request.originalUrl,
      });
    }); */
}

export async function invoicesOfUser(
  _request: FastifyRequest<{ Params: { userId: string } }>,
  _reply: FastifyReply
) {
  /* await await db
    .execute(
      "SELECT uid, url, radiologist_uid, amount, paid, createdAt FROM Invoice WHERE patient_uid = ? \
         ORDER BY createdAt DESC",
      [request.params.userId]
    )
    .then((result) => {
      reply.status(200).send({ data: result.rows });
    })
    .catch((error) => {
      console.log("Error fetching invoices: ", error);
      reply.status(409).send({
        msg: "Unable to fetch invoices",
        path: request.originalUrl,
      });
    }); */
}

export async function voidInvoice(
  _request: FastifyRequest<{ Params: { invoiceId: string } }>,
  _reply: FastifyReply
) {
  /* await db
    .execute("UPDATE Invoice SET paid = true WHERE uid = ? AND paid = false", [
      request.params.invoiceId,
    ])
    .then((result) => {
      if (result.rows.length === 0) {
        return reply.status(200).send({
          success: true,
          msg: "Invoice has already been paid or does not exist",
        });
      }
      reply
        .status(200)
        .send({ success: true, msg: "Successfully voided invoice" });
    })
    .catch((error) => {
      console.log("Error voiding invoice: ", error);
      reply.status(409).send({
        msg: "Unable to void invoice",
        path: request.originalUrl,
      });
    }); */
}
