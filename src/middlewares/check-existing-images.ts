import { FastifyReply, FastifyRequest, PaymentInvoiceProcess } from "fastify";

/** Middleware that checks if the image requested for an invoice exists */
export const checkExistingImages = async (
  request: FastifyRequest<PaymentInvoiceProcess>,
  reply: FastifyReply
) => {
  try {
    const existingImages = await request.server.pg.query(
      `SELECT COUNT(*)::int AS count FROM "Image" WHERE uploaded_for = '${request.userUID}'`
    );

    if (!existingImages.rowCount) {
      reply.code(409).send({
        success: false,
        msg: "Your account has no existing images. Contact your physician for more information.",
      });
    }
  } catch (error) {
    console.log("checkExistingImages: ", error);
  }
};

export default checkExistingImages;
