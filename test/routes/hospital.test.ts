import { app } from "../helper";

describe("hospital route", () => {
  test("retrieve list of hospitals", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/hospital/hospitals",
    });

    expect(Object.keys(response.json())).toEqual(
      expect.arrayContaining(["hospitals"])
    );
  });
});
