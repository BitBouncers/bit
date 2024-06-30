import { PostgresDb } from "@fastify/postgres";
import { FastifyReply, FastifyRequest, ImageNoteUpdate } from "fastify";
import * as Pg from "pg";
import { PostgresError } from "postgres";
import ImageService from "src/services/image.service";
import * as notify from "src/utils/notify";
import { buildFastifyReply, buildFastifyRequest } from "test/helper";

describe("image route", () => {
  const imageService = new ImageService();
  let request: FastifyRequest<ImageNoteUpdate>;
  let reply: FastifyReply;
  let pg: PostgresDb & Record<string, PostgresDb>;

  beforeEach(() => {
    request = buildFastifyRequest<ImageNoteUpdate>({
      body: { note: "update note" },
      params: { image_uid: "7abe0a4e-c38f-4d0c-840b-535d6ece27a2" },
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

  test("a new image note should be created", async () => {
    (pg.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
    (pg.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ patient_uid: "9", physician_uid: "9" }],
      rowCount: 1,
    });
    (pg.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
    jest.spyOn(notify, "notify").mockResolvedValue();

    await imageService.updateImageNote(request, reply);

    expect(pg.query).toHaveBeenCalledTimes(3);
    expect(reply.send).toHaveBeenCalledWith({ success: true });
  });

  test("an existing image note is updated", async () => {
    const pe = new PostgresError("Image note exists");
    pe.code = "23505";

    (pg.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
    (pg.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ patient_uid: "9", physician_uid: "9" }],
      rowCount: 1,
    });
    (pg.query as jest.Mock).mockResolvedValueOnce(pe);
    jest.spyOn(notify, "notify").mockResolvedValue();

    await imageService.updateImageNote(request, reply);

    expect(pg.query).toHaveBeenCalledTimes(3);
    expect(reply.send).toHaveBeenCalledWith({ success: true });
  });

  test("an invoice has still not been paid for", async () => {
    (pg.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

    await imageService.updateImageNote(request, reply);

    expect(pg.query).toHaveBeenCalledTimes(1);
    expect(reply.code).toHaveBeenCalledWith(409);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      msg: "The patient has not paid for this image yet. Please wait for the patient to pay before updating the note.",
    });
  });

  test("a patient relation somehow does not exist", async () => {
    (pg.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
    (pg.query as jest.Mock).mockResolvedValueOnce(undefined);

    await imageService.updateImageNote(request, reply);

    expect(pg.query).toHaveBeenCalledTimes(2);
    expect(reply.code).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      msg: "Error updating image note.",
    });
  });
});
