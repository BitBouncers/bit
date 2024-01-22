import { app, compareArrayOfObjects } from "../helper";
import {
  MEET_OUR_RADIOLOGISTS,
  USER_EMAIL,
  USER_EMAIL_PHYSICIAN,
  USER_PW,
} from "../variables";

describe("user route", () => {
  let token: string, physicianToken: string;

  beforeAll(async () => {
    const response = await app.inject({
      url: "/api/auth/login",
      method: "POST",
      payload: { email: USER_EMAIL, password: USER_PW },
    });

    const response2 = await app.inject({
      url: "/api/auth/login",
      method: "POST",
      payload: { email: USER_EMAIL_PHYSICIAN, password: USER_PW },
    });

    token = response.json().idToken;
    physicianToken = response2.json().idToken;
  });

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
      headers: { Authorization: `Bearer ${token}` },
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

    expect(compareArrayOfObjects(response.json(), MEET_OUR_RADIOLOGISTS)).toBe(
      true
    );
  });

  test("get user patient role", async () => {
    const response = await app.inject({
      url: "/api/user/me",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.json().role).toBe("Patient");
  });

  test("get user physician role", async () => {
    const response = await app.inject({
      url: "/api/user/me",
      headers: { Authorization: `Bearer ${physicianToken}` },
    });

    expect(response.json().role).toBe("Physician");
  });
});
