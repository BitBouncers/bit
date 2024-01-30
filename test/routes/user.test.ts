import { app, compareArrayOfObjects } from "../helper";
import { AUTH_TOKEN, MEET_OUR_RADIOLOGISTS } from "../variables";

describe("user route", () => {
  test("error with expired bearer token", async () => {
    const response = await app.inject({
      url: "/api/user/me",
      headers: { Authorization: "Bearer test" },
    });

    expect(response.json().error).toBe(
      "Your session has expired. Please login again."
    );
  });

  test("error with malformed authorization headers", async () => {
    const response = await app.inject({
      url: "/api/user/me",
      headers: { Authorization: "Bea" },
    });

    expect(response.json().error).toBe("Malformed authorization header.");
  });

  test("second opinion radiologists", async () => {
    const response = await app.inject({
      url: "/api/user/radiologists",
      headers: { Authorization: `Bearer ${AUTH_TOKEN.get("PATIENT")}` },
    });

    expect(response.json().radiologists?.length).toBeGreaterThan(0);
    expect(Object.keys(response.json().radiologists[0])).toEqual(
      expect.arrayContaining([
        "uid",
        "title",
        "first_name",
        "last_name",
        "email",
        "profile_image_url",
        "bio",
        "expertise",
        "years_of_exp",
        "average_rating",
      ])
    );
  });

  test("meet our radiologists", async () => {
    const response = await app.inject({
      url: "/api/user/meet-our-radiologists",
    });

    expect(
      compareArrayOfObjects(response.json().radiologists, MEET_OUR_RADIOLOGISTS)
    ).toBe(true);
  });

  test("get user patient role", async () => {
    const response = await app.inject({
      url: "/api/user/me",
      headers: { Authorization: `Bearer ${AUTH_TOKEN.get("PATIENT")}` },
    });

    expect(response.json().role).toBe("Patient");
  });

  test("get user physician role", async () => {
    const response = await app.inject({
      url: "/api/user/me",
      headers: { Authorization: `Bearer ${AUTH_TOKEN.get("PHYSICIAN")}` },
    });

    expect(response.json().role).toBe("Physician");
  });

  test("get user radiologist role", async () => {
    const response = await app.inject({
      url: "/api/user/me",
      headers: { Authorization: `Bearer ${AUTH_TOKEN.get("RADIOLOGIST")}` },
    });

    expect(response.json().role).toBe("Radiologist");
  });

  test("get patients as physician", async () => {
    const response = await app.inject({
      url: "/api/user/patients",
      headers: { Authorization: `Bearer ${AUTH_TOKEN.get("PATIENT")}` },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe(
      "You are not authorized to make this request."
    );
  });

  test("get patients as physician", async () => {
    const response = await app.inject({
      url: "/api/user/patients",
      headers: { Authorization: `Bearer ${AUTH_TOKEN.get("PHYSICIAN")}` },
    });

    expect(response.json().patients.length).toBeGreaterThan(0);
    expect(Object.keys(response.json().patients[0])).toEqual(
      expect.arrayContaining([
        "uid",
        "dob",
        "first_name",
        "last_name",
        "email",
        "profile_image_url",
        "images",
      ])
    );
  });

  test("get patients as radiologist", async () => {
    const response = await app.inject({
      url: "/api/user/patients",
      headers: { Authorization: `Bearer ${AUTH_TOKEN.get("RADIOLOGIST")}` },
    });

    expect(response.json().patients.length).toBeGreaterThan(0);
    expect(Object.keys(response.json().patients[0])).toEqual(
      expect.arrayContaining([
        "uid",
        "dob",
        "first_name",
        "last_name",
        "email",
        "profile_image_url",
        "images",
      ])
    );
  });
});
