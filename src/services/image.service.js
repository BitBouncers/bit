import sql from "../config/db.js";
import { notify } from "../services/notification.service.js";

export async function updateImageNote(req, res) {
  let patientResult;
  const invoiceResult = await sql`
      SELECT
        i.uid AS image_uid, i.uploaded_by AS uploaded_by, i.url AS image_url,
        iv.uid AS invoice_uid, iv.patient_uid AS patient_uid, iv.radiologist_uid AS radiologist_uid, iv.paid
      FROM "Image" i
      LEFT JOIN "Invoice" iv ON i.uploaded_for = iv.patient_uid
      WHERE i.uid = ${req.params.image_uid} AND iv.paid = false`.catch((error) => {
    console.log("image.service.invoiceResult: ", error);
  });

  if (invoiceResult.count > 0) {
    return res.status(409).json({
      msg: "The patient has not paid for this image yet. Please wait for the patient to pay before updating the note.",
    });
  }

  try {
    patientResult = await sql`
      SELECT
        U.uid AS physician_uid, PR.patient_uid
      FROM "User" U
      JOIN
        "PatientRelation" PR ON U.uid = PR.staff_uid
      JOIN
        "Image" I ON I.uploaded_for = PR.patient_uid
      WHERE I.uid = ${req.params.image_uid} AND U.role = 'PHYSICIAN'`;
  } catch (error) {
    console.log("image.service.uploadImageNote.patientResult: ", error);
  }

  const patientUID = patientResult[0].patient_uid;
  const physicianUID = patientResult[0].physician_uid;

  try {
    await sql`INSERT INTO "ImageNote" (image_uid, author_uid, note) VALUES(${req.params.image_uid}, ${req.userUID}, ${req.body.note})`;
    notify(patientUID, req.userUID, "Your image has a new note.", "/imagelibrary");
    notify(patientUID, req.userUID, "Don't forget to rate your radiologist.", "/imagelibrary");
    notify(physicianUID, req.userUID, "A radiologist has added a note to your patient's image.", "/patients");
  } catch (error) {
    if (error.detail.includes("already exists")) {
      await sql`UPDATE "ImageNote" SET note = ${req.body.note} WHERE image_uid = ${req.params.image_uid} AND author_uid = ${req.userUID}`.catch(
        (error) => {
          console.log("image.service.uploadImageNote: ", error);
          res.json({ success: false });
        }
      );
      notify(patientUID, req.userUID, "Your image note has been updated.", "/imagelibrary");
    }
  }

  res.json({ success: true });
}
