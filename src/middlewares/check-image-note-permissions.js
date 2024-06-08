import sql from "../config/db.js";

async function checkImageNotePermissions(req, res, next) {
  try {
    const result = await sql`
        SELECT PR.staff_uid
          FROM "PatientRelation" PR
          JOIN "Image" I ON PR.patient_uid = I.uploaded_for
          WHERE I.uid = ${req.params.image_uid} AND PR.staff_uid = ${req.userUID}`.catch((error) => {
      console.log("checkImageNotePermissions: ", error);
      res.json({ success: false });
    });

    if (result.count === 0) {
      next();
    } else {
      res.status(403).json({ msg: "You do not have permission to update this image." });
    }
  } catch (error) {
    console.log("checkImageNotePermissions: ", error);
  }
}

export default checkImageNotePermissions;
