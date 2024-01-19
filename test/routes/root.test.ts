import { app } from "../helper";

describe("root route", () => {
  test("/", async () => {
    const response = await app.inject({ url: "/" });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("You've reached RadiologyArchive's DEV API!");
  });
});
