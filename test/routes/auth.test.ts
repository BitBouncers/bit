import { PostgresDb } from "@fastify/postgres";
import {
  AuthAddPatient,
  AuthLoginPortal,
  AuthPasswordReset,
  AuthSignupBody,
  AuthSignupPhysician,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { UserMetadata, UserRecord } from "firebase-admin/auth";
import * as Pg from "pg";
import * as firebase from "../../src/config/firebase";
import AuthService from "../../src/services/auth.service";
import { app, buildFastifyReply, buildFastifyRequest } from "../helper";
import {
  AUTH_TOKEN,
  USER_EMAIL_PATIENT,
  USER_EMAIL_PHYSICIAN,
  USER_PW,
  USER_WRONG_PW,
} from "../variables";

describe("auth routes", () => {
  const authService: AuthService = new AuthService();
  describe("add patient from existing or as a new user", () => {
    let request: FastifyRequest<AuthAddPatient>;
    let reply: FastifyReply;
    let pg: PostgresDb & Record<string, PostgresDb>;

    beforeEach(() => {
      request = buildFastifyRequest<AuthAddPatient>({
        body: {
          email: "test@example.com",
          dob: "2000-01-01",
          first_name: "John",
          last_name: "Doe",
          title: "Mr.",
        },
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
      } as unknown as FastifyRequest["server"];
    });

    describe("when mocking pg client", () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      test("should return 409 if there is an error", async () => {
        (pg.query as jest.Mock).mockResolvedValueOnce(
          new Error("Email doesn't exist")
        );

        await authService.addPatient(request, reply);

        expect(reply.code).toHaveBeenCalledWith(409);
        expect(reply.send).toHaveBeenCalledWith({
          errors: [
            {
              msg: "Unable to add patient",
              path: "auth/add-patient",
            },
          ],
        });
      });

      test("should add a new patient and return success message", async () => {
        (pg.query as jest.Mock)
          .mockResolvedValueOnce({ rowCount: 0 })
          .mockResolvedValueOnce({ rowCount: 0 })
          .mockResolvedValueOnce({});

        jest.spyOn(firebase.adminAuth, "createUser").mockResolvedValueOnce({
          disabled: false,
          emailVerified: false,
          metadata: {} as UserMetadata,
          providerData: [],
          uid: "123",
          toJSON: {} as object,
        } as UserRecord);

        jest.spyOn(firebase.adminAuth, "updateUser").mockResolvedValueOnce({
          displayName: "Mr. John Doe",
          disabled: false,
          emailVerified: false,
          metadata: {} as UserMetadata,
          providerData: [],
          uid: "123",
          toJSON: {} as object,
        } as UserRecord);

        jest
          .spyOn(firebase, "sendPasswordResetEmail")
          .mockResolvedValueOnce(undefined);

        await authService.addPatient(request, reply);

        expect(pg.query).toHaveBeenCalledTimes(3);
        expect(reply.send).toHaveBeenCalledWith({
          msg: "Successfully added new patient",
        });
      });

      test("should return 409 when a user is already with a physician", async () => {
        (pg.query as jest.Mock)
          .mockResolvedValueOnce({ rowCount: 1, rows: [{ uid: "123" }] })
          .mockResolvedValueOnce({ rowCount: 1, rows: [{ uid: "123" }] });

        await authService.addPatient(request, reply);

        expect(reply.code).toHaveBeenCalledWith(409);
        expect(reply.send).toHaveBeenCalledWith({
          errors: [
            {
              msg: "This patient is already assigned to another physician.",
            },
          ],
        });
      });
    });
  });

  describe("logging in through different portals", () => {
    let authService: AuthService;
    let request: FastifyRequest<AuthLoginPortal>;
    let reply: FastifyReply;
    let pg: PostgresDb & Record<string, PostgresDb>;

    beforeEach(() => {
      authService = new AuthService();
      request = buildFastifyRequest<AuthLoginPortal>({
        body: { email: USER_EMAIL_PATIENT },
        params: { role: "patient" },
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
      } as unknown as FastifyRequest["server"];
    });

    test("login through correct portal associated with the user", async () => {
      (pg.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ role: "PATIENT" }],
      });

      await authService.portal(request, reply);

      expect(pg.query).toHaveBeenCalledTimes(1);
      expect(reply.code).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({ success: true });
    });

    test("login through wrong portal associated with the user", async () => {
      (pg.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });

      await authService.portal(request, reply);

      expect(pg.query).toHaveBeenCalledTimes(1);
      expect(reply.code).toHaveBeenCalledWith(409);
      expect(reply.send).toHaveBeenCalledWith({
        msg: "Unable to access portal",
      });
    });
  });

  describe.only("sign up", () => {
    let request: FastifyRequest<AuthSignupBody | AuthSignupPhysician>;
    let reply: FastifyReply;
    let pg: PostgresDb & Record<string, PostgresDb>;

    beforeEach(() => {
      reply = buildFastifyReply();
      pg = {
        query: jest.fn(),
        connect: jest.fn(),
        pool: {} as Pg.Pool,
        Client: {} as Pg.Client,
        transact: jest.fn(),
      } as unknown as PostgresDb & Record<string, PostgresDb>;
      request = buildFastifyRequest<AuthSignupBody | AuthSignupPhysician>({
        body: {
          email: USER_EMAIL_PHYSICIAN,
          password: USER_PW,
          dob: "1991-01-01",
          first_name: "John",
          last_name: "Doe",
          role: "physician",
          title: "",
        },
      });
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

    test("as a non-physician; patient or radiologist", async () => {
      request.body.role = "patient";
      (pg.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

      jest
        .spyOn(firebase.adminAuth, "createUser")
        .mockResolvedValueOnce({} as UserRecord);
      jest
        .spyOn(firebase.adminAuth, "updateUser")
        .mockResolvedValueOnce({} as UserRecord);

      await authService.signup(request, reply);

      expect(pg.query).toHaveBeenCalledTimes(1);
      expect(reply.send).toHaveBeenCalledWith({
        msg: "Successfully created new user",
      });
    });

    test("as a physician that exists in a hospital", async () => {
      (pg.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

      jest.spyOn(firebase.adminAuth, "updateUser").mockResolvedValue({
        uid: "123",
      } as UserRecord);

      await authService.signup(request, reply);

      expect(pg.query).toHaveBeenCalledTimes(1);
      expect(reply.send).toHaveBeenCalledWith({
        msg: "Successfully created physician account",
      });
    });

    test("error caught within signing up as physician", async () => {
      jest
        .spyOn(firebase.adminAuth, "updateUser")
        .mockRejectedValueOnce(new Error("new physician account failed"));

      await authService.signup(request, reply);

      expect(pg.query).toHaveBeenCalledTimes(0);
      expect(reply.send).toHaveBeenCalledWith({
        errors: [{ msg: "new physician account failed", path: "auth/signup" }],
      });
    });

    test("error caught within signing up as a non-physician", async () => {
      request.body.role = "radiologist";
      jest
        .spyOn(firebase.adminAuth, "createUser")
        .mockRejectedValueOnce(new Error("new patient account failed"));

      await authService.signup(request, reply);

      expect(pg.query).toHaveBeenCalledTimes(0);
      expect(reply.send).toHaveBeenCalledWith({
        errors: [{ msg: "new patient account failed", path: "auth/signup" }],
      });
    });
  });

  test("login using api through firebase with correct credentials", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      body: { email: USER_EMAIL_PATIENT, password: USER_PW },
    });

    expect(Object.keys(response.json())).toEqual(
      expect.arrayContaining([
        "localId",
        "displayName",
        "idToken",
        "refreshToken",
      ])
    );
  });

  test("login using api through firebase with wrong credentials", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      body: { email: USER_EMAIL_PATIENT, password: USER_WRONG_PW },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().errors[0].msg).toBe(
      "The email or password you entered is incorrect."
    );
  });

  test("token is valid", async () => {
    const response = await app.inject({
      url: "/api/auth/token",
      headers: { Authorization: `Bearer ${AUTH_TOKEN.get("RADIOLOGIST")}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().msg).toBe("You are authenticated.");
  });

  describe("send password reset through email", () => {
    let request: FastifyRequest;
    let reply: FastifyReply;

    beforeEach(() => {
      request = buildFastifyRequest<AuthPasswordReset>({
        body: { email: "test@example.com" },
      });
      reply = buildFastifyReply();
    });

    test("should send 'success: true' regardless the validity of the email", async () => {
      await authService.sendPasswordReset(
        request as FastifyRequest<AuthPasswordReset>,
        reply
      );

      expect(reply.send).toHaveBeenCalledWith({ success: true });
    });

    test("should send 'success: false' whenever an error occurs", async () => {
      jest
        .spyOn(firebase, "sendPasswordResetEmail")
        .mockRejectedValueOnce(
          new Error("Error sending password reset by email")
        );

      await authService.sendPasswordReset(
        request as FastifyRequest<AuthPasswordReset>,
        reply
      );

      expect(reply.send).toHaveBeenCalledWith({ success: false });
    });
  });
});
