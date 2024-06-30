import { app, compareArrayOfObjects } from "../helper";
import {
  AUTH_TOKEN,
  MEET_OUR_RADIOLOGISTS,
  USER_IMAGES_API_KEYS,
  USER_PATIENTS_API_KEYS,
  USER_UID_PATIENT,
} from "../variables";

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

  test("error with jwt string passed", async () => {
    const response = await app.inject({
      url: "/api/user/me",
      headers: { Authorization: "Bea" },
    });

    expect(response.json().error).toBe("There was an error with your request.");
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

  // isAuthorizedOrStaff middleware
  describe("get images api", () => {
    test("get images as patient owner", async () => {
      const response = await app.inject({
        url: `/api/user/${USER_UID_PATIENT}/images`,
        headers: { Authorization: `Bearer ${AUTH_TOKEN.get("PATIENT")}` },
      });

      expect(response.json().images.length).toBeGreaterThan(0);
      expect(Object.keys(response.json().images[0])).toEqual(
        expect.arrayContaining(USER_IMAGES_API_KEYS)
      );
    });

    test("get patient images as physician", async () => {
      const response = await app.inject({
        url: `/api/user/${USER_UID_PATIENT}/images`,
        headers: { Authorization: `Bearer ${AUTH_TOKEN.get("PHYSICIAN")}` },
      });

      expect(response.json().images.length).toBeGreaterThan(0);
      expect(Object.keys(response.json().images[0])).toEqual(
        expect.arrayContaining(USER_IMAGES_API_KEYS)
      );
    });

    test("get patient images as radiologist", async () => {
      const response = await app.inject({
        url: `/api/user/${USER_UID_PATIENT}/images`,
        headers: { Authorization: `Bearer ${AUTH_TOKEN.get("RADIOLOGIST")}` },
      });

      expect(response.json().images.length).toBeGreaterThan(0);
      expect(Object.keys(response.json().images[0])).toEqual(
        expect.arrayContaining(USER_IMAGES_API_KEYS)
      );
    });
  });

  // isStaff middleware
  describe("get patients api", () => {
    test("get patients as patient", async () => {
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
        expect.arrayContaining(USER_PATIENTS_API_KEYS)
      );
    });

    test("get patients as radiologist", async () => {
      const response = await app.inject({
        url: "/api/user/patients",
        headers: { Authorization: `Bearer ${AUTH_TOKEN.get("RADIOLOGIST")}` },
      });

      expect(response.json().patients.length).toBeGreaterThan(0);
      expect(Object.keys(response.json().patients[0])).toEqual(
        expect.arrayContaining(USER_PATIENTS_API_KEYS)
      );
    });
  });
});
