import { FastifyReply, FastifyRequest, PaymentInvoiceProcess } from "fastify";

/** Middleware that checks if the image requested for an opinion  has any x invoices */
export const checkImageHasInvoice = async (
  request: FastifyRequest<PaymentInvoiceProcess>,
  reply: FastifyReply
) => {
  try {
    const result = await request.server.pg.query(
      `
        SELECT
          COALESCE(inv.uid, 'No Invoice') as invoice_uid
        FROM
          "Image" i
        LEFT JOIN
          "Invoice" inv ON i.uid = inv.image_uid AND inv.radiologist_uid = '${request.params.uid}'
        WHERE i.uid = '${request.body.image}'`
    );

    if (result.rowCount && result.rows[0].invoice_uid === "No invoice") {
      return reply.code(409).send({
        success: false,
        msg: "Image already has an invoice for this radiologist.",
      });
    }
  } catch (error) {
    console.log("checkImageHasInvoice: ", error);
  }
};

export default checkImageHasInvoice;
