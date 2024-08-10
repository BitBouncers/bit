import { FastifyReply, FastifyRequest, PaymentInvoiceProcess } from "fastify";

/** Middleware that checks if the user has any unpaid invoices */
export const checkUnpaidInvoices = async (
  request: FastifyRequest<PaymentInvoiceProcess>,
  reply: FastifyReply
) => {
  try {
    const unpaidInvoice = await request.server.pg.query(
      `SELECT COUNT(*)::int as count FROM "Invoice" WHERE patient_uid = '${request.userUID}' AND paid = false`
    );

    if (unpaidInvoice.rows[0].count > 0) {
      return reply.code(409).send({
        success: false,
        msg: "You have unpaid invoices. Please pay or cancel them before requesting another opinion.",
      });
    }
  } catch (error) {
    console.log("checkUnpaidInvoices: ", error);
  }
};

export default checkUnpaidInvoices;
