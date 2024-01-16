import { paymentService } from "../services/index";

import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";

const paymentRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  /* User information routes */
  fastify.get(
    "/invoices",
    // [isAuthenticated, isAuthorized],
    paymentService.invoices
  );

  fastify.get(
    "/invoices/:userId",
    // [isAuthenticated, invoicesSchema, isStaff],
    paymentService.invoicesOfUser
  );

  /* Transaction routes */
  fastify.post(
    "/:uid/invoice",
    paymentService.invoice
    /* [
      isAuthenticated,
      invoiceSchema,
      errors,
      checkExistingImages,
      createStripeCustomer,
      checkUnpaidInvoices,
      checkImageHasInvoice,
    ],
    paymentService.invoice */
  );

  fastify.delete(
    "/:invoiceId/invoice",
    // [isAuthenticated], paymentService.voidInvoice
    paymentService.voidInvoice
  );

  fastify.log.info("routes/payment registered");

  done();
};

export const autoPrefix = "/payment";

export default paymentRoutes;
