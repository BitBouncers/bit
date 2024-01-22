import { app, compareArrayOfObjects } from "../helper";
import { USER_EMAIL, USER_EMAIL_PHYSICIAN, USER_PW } from "../variables";

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
    const radiologists = [
      {
        uid: "464xIBql69bqrg8F1BhzHDHtHsw1",
        title: "Dr.",
        first_name: "Emily",
        last_name: "Johnson",
        profile_image_url: null,
        expertise: "Diagnostic",
      },
      {
        uid: "oNgXBgPnbAZymU51OyJ0CQ9GcFD2",
        title: "Dr.",
        first_name: "David",
        last_name: "Smith",
        profile_image_url: null,
        expertise: "Neuroradiology",
      },
      {
        uid: "xc3CMA0sMZNLRp5qDVH6UU3FQO83",
        title: "Dr.",
        first_name: "Robert",
        last_name: "Rivera",
        profile_image_url: null,
        expertise: "Abdominal",
      },
      {
        uid: "T3e7wxi3khgwiZGp7fXejUJe2Qg2",
        title: "Dr.",
        first_name: "John",
        last_name: "Radiologist",
        profile_image_url: null,
        expertise: "Neuroradiology",
      },
      {
        uid: "kMBvFu9pG2T36w8zqHf99rDiq992",
        title: "Dr.",
        first_name: "Laura",
        last_name: "Davis",
        profile_image_url: null,
        expertise: "Musculoskeletal",
      },
      {
        uid: "6npcE5FQFweAYGAxDlxSARwz1qn2",
        title: "Dr.",
        first_name: "Monica",
        last_name: "Kirk",
        profile_image_url: null,
        expertise: "Pediatric",
      },
    ];

    const response = await app.inject({
      url: "/api/user/meet-our-radiologists",
    });
    expect(compareArrayOfObjects(response.json(), radiologists)).toBe(true);
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
