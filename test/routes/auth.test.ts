import { app } from "../helper";
import { USER_EMAIL_PATIENT, USER_PW, USER_WRONG_PW } from "../variables";

describe("auth routes", () => {
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
});
