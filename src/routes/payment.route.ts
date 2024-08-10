import { isAuthenticated } from "src/middlewares/firebase-auth";
import { paymentService } from "../services/index";

import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";
import checkExistingImages from "src/middlewares/check-existing-images";
import checkImageHasInvoice from "src/middlewares/check-image-has-invoice";
import checkUnpaidInvoices from "src/middlewares/check-unpaid-invoices";
import createStripeCustomer from "src/middlewares/create-stripe-customer";
import { isAuthorizedOrStaff } from "src/middlewares/isAuthorizedOrStaff";
import { invoiceSchema, invoicesSchema } from "src/middlewares/validators";

const paymentRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  /* User information routes */
  fastify.get("/invoices", {
    preHandler: [isAuthenticated, isAuthorizedOrStaff],
    handler: paymentService.invoices,
  });

  fastify.get("/invoices/:userId", {
    ...invoicesSchema,
    preHandler: [isAuthenticated, isAuthorizedOrStaff],
    handler: paymentService.invoicesOfUser,
  });

  /* Transaction routes */
  fastify.post("/:uid/invoice", {
    ...invoiceSchema,
    preHandler: [
      isAuthenticated,
      checkExistingImages,
      checkUnpaidInvoices,
      createStripeCustomer,
      checkUnpaidInvoices,
      checkImageHasInvoice,
    ],
    handler: paymentService.invoice,
  });

  fastify.delete("/:invoiceId/invoice", {
    preHandler: [isAuthenticated],
    handler: paymentService.voidInvoice,
  });

  done();
};

export const autoPrefix = "/payment";

export default paymentRoutes;
