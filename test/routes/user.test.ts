import supertest from "supertest";
import { app, compareArrayOfObjects } from "../helper";

describe("user route", () => {
  test("meet our radiologists", async () => {
    await app.ready();
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

    const response = await supertest(app.server).get(
      "/api/user/meet-our-radiologists"
    );
    expect(compareArrayOfObjects(response.body, radiologists)).toBe(true);
  });
});
