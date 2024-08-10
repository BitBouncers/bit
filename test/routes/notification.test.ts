import { PostgresDb } from "@fastify/postgres";
import {
  FastifyReply,
  FastifyRequest,
  NotificationReadBody,
  UserUIDParams,
} from "fastify";
import * as Pg from "pg";
import NotificationService from "src/services/notification.service";
import { buildFastifyReply, buildFastifyRequest } from "../helper";

describe("notification routes", () => {
  const notificationService: NotificationService = new NotificationService();

  describe("polling", () => {
    let request: FastifyRequest<UserUIDParams>;
    let reply: FastifyReply;
    let pg: PostgresDb & Record<string, PostgresDb>;

    beforeEach(() => {
      request = buildFastifyRequest({});
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

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("polling should return an array of notifications", async () => {
      const rows = [
        {
          read: 0,
          uid: "",
          timestamp: "",
          message: "",
          createdAt: "",
          to: null,
        },
        {
          read: 0,
          uid: "",
          timestamp: "",
          message: "",
          createdAt: "",
          to: null,
        },
        {
          read: 0,
          uid: "",
          timestamp: "",
          message: "",
          createdAt: "",
          to: null,
        },
      ];

      (pg.query as jest.Mock).mockResolvedValueOnce({ rows });

      await notificationService.polling(request, reply);

      expect(pg.query).toHaveBeenCalledTimes(1);
      expect(reply.send).toHaveBeenCalledWith(rows);
    });

    test("polling returns no rows", async () => {
      (pg.query as jest.Mock).mockResolvedValueOnce({});

      await notificationService.polling(request, reply);

      expect(pg.query).toHaveBeenCalledTimes(1);
      expect(reply.code).toHaveBeenCalledWith(204);
    });

    test("polling encounters an error", async () => {
      (pg.query as jest.Mock).mockRejectedValueOnce(
        new Error("Polling encountered an error.")
      );

      await notificationService.polling(request, reply);
      expect(pg.query).toHaveBeenCalledTimes(1);
      expect(reply.code).toHaveBeenCalledWith(204);
    });
  });

  describe("mark notifications as read", () => {
    let request: FastifyRequest<NotificationReadBody>;
    let reply: FastifyReply;
    let pg: PostgresDb & Record<string, PostgresDb>;

    beforeEach(() => {
      request = buildFastifyRequest({});
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

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("mark notification as read", async () => {
      request.body.read = ["853a7855-19fd-4d89-a2b7-df542e240a56"];
      (pg.query as jest.Mock).mockResolvedValueOnce({
        rowCount: request.body.read.length,
        success: true,
        read: request.body.read,
      });

      await notificationService.read(request, reply);
      expect(pg.query).toHaveBeenCalledTimes(1);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        read: request.body.read,
      });
    });

    test("mark notifications as read", async () => {
      request.body.read = [
        "853a7855-19fd-4d89-a2b7-df542e240a56",
        "853a7855-19fd-4d89-a2b7-df542e240a55",
      ];
      (pg.query as jest.Mock).mockResolvedValueOnce({
        rowCount: request.body.read.length,
        success: true,
        read: request.body.read,
      });

      await notificationService.read(request, reply);
      expect(pg.query).toHaveBeenCalledTimes(1);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        read: request.body.read,
      });
    });

    test("passing an empty read array", async () => {
      request.body.read = [];

      await notificationService.read(request, reply);
      expect(pg.query).toHaveBeenCalledTimes(0);
      expect(reply.code).toHaveBeenCalledWith(204);
    });

    test("encountering an error while marking notification as read", async () => {
      request.body.read = [""];
      (pg.query as jest.Mock).mockRejectedValueOnce(
        new Error("Mark read encountered an error.")
      );

      await notificationService.read(request, reply);
      expect(pg.query).toHaveBeenCalledTimes(1);
      expect(reply.code).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });
});
