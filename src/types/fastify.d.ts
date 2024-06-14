import "fastify";
import { RequestGenericInterface } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    stripeID?: string;
    userUID?: string;
    body?: { image: string };
    params?: { uid: string };
  }

  interface AuthAddPatient extends RequestGenericInterface {
    Body: {
      email: string;
      dob: string;
      first_name: string;
      last_name: string;
      title: string;
    };
  }

  interface AuthLoginBody extends RequestGenericInterface {
    Body: {
      email: string;
      password: string;
    };
  }

  interface AuthLoginPortal extends RequestGenericInterface {
    Body: {
      email: string;
    };
    Params: {
      role: string;
    };
  }

  interface AuthPasswordReset extends RequestGenericInterface {
    Body: {
      email: string;
    };
  }

  interface AuthSignupBody extends RequestGenericInterface {
    Body: {
      email: string;
      password: string;
      dob: string;
      first_name: string;
      last_name: string;
      role: string;
      title: string;
    };
  }

  interface AuthSignupPhysician extends RequestGenericInterface {
    Body: AuthSignupBody["Body"] & {
      hospital: string | null;
    };
  }

  interface NotificationReadBody extends RequestGenericInterface {
    Body: {
      read: string[];
    };
  }

  interface PaymentInvoiceProcess extends RequestGenericInterface {
    Body: {
      image: string;
    };
    Params: {
      uid: string;
    };
  }

  interface PaymentInvoices extends RequestGenericInterface {
    Params: {
      userId: string;
    };
  }

  interface PaymentInvoiceVoid extends RequestGenericInterface {
    Params: {
      invoiceId: string;
    };
  }

  interface UserUIDParams extends RequestGenericInterface {
    Params: {
      uid: string;
    };
  }
}
