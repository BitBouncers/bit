import supertest from "supertest";
import { app } from "../helper";

describe("root route", () => {
  test("/", async () => {
    const response = await supertest(app.server).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toBe("You've reached RadiologyArchive's DEV API!");
  });
});
