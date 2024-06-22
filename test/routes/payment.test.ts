import { PostgresDb } from "@fastify/postgres";
import {
  FastifyReply,
  FastifyRequest,
  PaymentInvoiceProcess,
  PaymentInvoiceVoid,
  PaymentInvoices,
} from "fastify";
import * as Pg from "pg";
import stripe from "src/config/stripe";
import PaymentService from "src/services/payment.service";
import Stripe from "stripe";
import { buildFastifyReply, buildFastifyRequest } from "test/helper";
import { USER_UID_PATIENT } from "test/variables";

describe("payment route", () => {
  const paymentService = new PaymentService();
  let request: FastifyRequest<PaymentInvoiceProcess>;
  let reply: FastifyReply;
  let pg: PostgresDb & Record<string, PostgresDb>;

  beforeEach(() => {
    request = buildFastifyRequest<PaymentInvoiceProcess>({
      userUID: USER_UID_PATIENT,
      stripeID: USER_UID_PATIENT,
      body: { image: "" },
      params: { uid: "" },
    });
    reply = buildFastifyReply();
    pg = {
      query: jest.fn(),
      connect: jest.fn(),
      pool: {} as Pg.Pool,
      Client: {} as Pg.Client,
      transact: jest.fn(),
    } as unknown as PostgresDb & Record<string, PostgresDb>;
    request.server = {
      pg: pg,
    } as FastifyRequest["server"];
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("invoice image for payment process", () => {
    test("if stripeID is undefined", async () => {
      request.stripeID = undefined;

      await paymentService.invoice(request, reply);

      expect(reply.code).toHaveBeenCalledWith(422);
      expect(reply.send).toHaveBeenCalledWith({
        success: false,
        msg: "Error creating invoice.",
      });
    });

    test("if userUID is undefined", async () => {
      request.userUID = undefined;

      await paymentService.invoice(request, reply);

      expect(reply.code).toHaveBeenCalledWith(422);
      expect(reply.send).toHaveBeenCalledWith({
        success: false,
        msg: "Error creating invoice.",
      });
    });

    test("stripe successfully processes and invoices the user", async () => {
      jest
        .spyOn(stripe.invoiceItems, "create")
        .mockResolvedValue({} as Stripe.Response<Stripe.InvoiceItem>);
      jest
        .spyOn(stripe.invoices, "create")
        .mockResolvedValue({} as Stripe.Response<Stripe.Invoice>);
      jest
        .spyOn(stripe.invoices, "sendInvoice")
        .mockResolvedValue({} as Stripe.Response<Stripe.Invoice>);
      (pg.query as jest.Mock).mockResolvedValue({});

      await paymentService.invoice(request, reply);

      expect(reply.code).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        msg: "Successfully created invoice.",
      });
    });

    test("stripe process encounters an error", async () => {
      jest
        .spyOn(stripe.invoiceItems, "create")
        .mockRejectedValue(new Error("Stripe encountered an error."));

      await paymentService.invoice(request, reply);

      expect(reply.code).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({
        success: false,
        msg: "Error creating invoice.",
      });
    });
  });

  describe("retrieving a list of invoices", () => {
    test("should return a list of invoices", async () => {
      const data = [
        {
          uid: "",
          url: "",
          radiologist_uid: "",
          amount: 0,
          paid: 0,
          createdAt: "",
        },
        {
          uid: "",
          url: "",
          radiologist_uid: "",
          amount: 0,
          paid: 0,
          createdAt: "",
        },
      ];
      (pg.query as jest.Mock).mockResolvedValue({
        rows: data,
        rowCount: data.length,
      });

      await paymentService.invoices(request, reply);

      expect(reply.code).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({ data });
    });

    test("should return an empty list of invoices", async () => {
      (pg.query as jest.Mock).mockResolvedValue({});

      await paymentService.invoices(request, reply);

      expect(reply.code).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({ data: [] });
    });

    test("should return http code 500 on error retrieving invoices", async () => {
      (pg.query as jest.Mock).mockRejectedValueOnce(
        new Error("Error retrieving invoices.")
      );

      await paymentService.invoices(request, reply);

      expect(reply.code).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({
        success: false,
        msg: "Error retrieving invoices.",
      });
    });
  });

  describe("retrieving a list of invoices of user", () => {
    let request: FastifyRequest<PaymentInvoices>;

    beforeEach(() => {
      request = buildFastifyRequest<PaymentInvoices>({
        userUID: USER_UID_PATIENT,
        stripeID: USER_UID_PATIENT,
        body: { image: "test" },
        params: { userId: "test" },
        originalUrl: "test",
      });
      pg = {
        query: jest.fn(),
        connect: jest.fn(),
        pool: {} as Pg.Pool,
        Client: {} as Pg.Client,
        transact: jest.fn(),
      } as unknown as PostgresDb & Record<string, PostgresDb>;
      request.server = {
        pg: pg,
      } as FastifyRequest["server"];
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("should return a list of invoices", async () => {
      const data = [
        {
          uid: "",
          url: "",
          radiologist_uid: "",
          amount: 0,
          paid: 0,
          createdAt: "",
        },
        {
          uid: "",
          url: "",
          radiologist_uid: "",
          amount: 0,
          paid: 0,
          createdAt: "",
        },
      ];
      (pg.query as jest.Mock).mockResolvedValue({
        rows: data,
        rowCount: data.length,
      });

      await paymentService.invoicesOfUser(request, reply);

      expect(reply.code).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({ data });
    });

    test("should return an empty list of invoices of user", async () => {
      (pg.query as jest.Mock).mockResolvedValue({});

      await paymentService.invoicesOfUser(request, reply);

      expect(reply.code).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({ data: [] });
    });

    test("should return http code 409 on error retrieving invoices of user", async () => {
      (pg.query as jest.Mock).mockRejectedValueOnce(
        new Error("Error retrieving invoices of user.")
      );

      await paymentService.invoicesOfUser(request, reply);

      expect(reply.code).toHaveBeenCalledWith(409);
      expect(reply.send).toHaveBeenCalledWith({
        msg: "Unable to fetch invoices of user",
        path: "test",
      });
    });
  });

  describe("void invoice", () => {
    let request: FastifyRequest<PaymentInvoiceVoid>;

    beforeEach(() => {
      request = buildFastifyRequest<PaymentInvoiceVoid>({
        userUID: USER_UID_PATIENT,
        stripeID: USER_UID_PATIENT,
        body: { image: "test" },
        params: { invoiceId: "test" },
        originalUrl: "test",
      });
      pg = {
        query: jest.fn(),
        connect: jest.fn(),
        pool: {} as Pg.Pool,
        Client: {} as Pg.Client,
        transact: jest.fn(),
      } as unknown as PostgresDb & Record<string, PostgresDb>;
      request.server = {
        pg: pg,
      } as FastifyRequest["server"];
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("should set invoice status to paid", async () => {
      (pg.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 1,
      });

      await paymentService.voidInvoice(request, reply);

      expect(reply.code).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        msg: "Successfully voided invoice",
      });
    });

    test("should say invoice is paid for or does not exist", async () => {
      (pg.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 0,
      });

      await paymentService.voidInvoice(request, reply);

      expect(reply.code).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        msg: "Invoice has already been paid or does not exist",
      });
    });

    test("catches an error occurring during invoice void process", async () => {
      (pg.query as jest.Mock).mockRejectedValueOnce(
        new Error("Error voiding invoice.")
      );

      await paymentService.voidInvoice(request, reply);

      expect(reply.code).toHaveBeenCalledWith(409);
      expect(reply.send).toHaveBeenCalledWith({
        msg: "Unable to void invoice",
        path: "test",
      });
    });
  });
});
