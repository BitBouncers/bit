import sql from "../config/db.js";

export async function hospitals(_req, res) {
  const result =
    await sql`SELECT uid, name from "Hospital" ORDER BY name`.catch(
      (error) => {
        console.log("hospital.service.hospitals: ", error);
        res.json({ hospitals: [] });
      }
    );

  res.json({ hospitals: result });
}
