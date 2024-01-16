import { FastifyReply, FastifyRequest } from "fastify";

export async function updateImageNote(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  /* let patientResult;
  const invoiceResult = await dbConn
    .execute(
      "\
      SELECT \
        i.uid AS image_uid, i.uploaded_by AS uploaded_by, i.url AS image_url, \
        iv.uid AS invoice_uid, iv.patient_uid AS patient_uid, iv.radiologist_uid AS radiologist_uid, iv.paid \
      FROM Image i \
      LEFT JOIN Invoice iv ON i.uploaded_for = iv.patient_uid \
      WHERE i.uid = ? AND iv.paid = 0",
      [request.params.image_uid]
    )
    .catch((error) => {
      console.log("image.service.invoiceResult: ", error);
    });

  if (invoiceResult.size > 0) {
    return reply.status(409).json({
      msg: "The patient has not paid for this image yet. Please wait for the patient to pay before updating the note.",
    });
  }

  try {
    patientResult = await dbConn.execute(
      "\
      SELECT \
        U.uid AS physician_uid, PR.patient_uid \
      FROM User U \
      JOIN \
        PatientRelation PR ON U.uid = PR.staff_uid \
      JOIN \
        Image I ON I.uploaded_for = PR.patient_uid \
      WHERE I.uid = ? AND U.role = 'PHYSICIAN'",
      [request.params.image_uid]
    );
  } catch (error) {
    console.log("image.service.uploadImageNote.patientResult: ", error);
  }

  const patientUID = patientResult[0].patient_uid;
  const physicianUID = patientResult[0].physician_uid;

  try {
    await dbConn.execute(
      "INSERT INTO ImageNote (image_uid, author_uid, note) VALUES (?, ?, ?)",
      [request.params.image_uid, req.userUID, req.body.note]
    );
    notify(
      patientUID,
      request.userUID,
      "Your image has a new note.",
      "/imagelibrary"
    );
    notify(
      patientUID,
      request.userUID,
      "Don't forget to rate your radiologist.",
      "/imagelibrary"
    );
    notify(
      physicianUID,
      request.userUID,
      "A radiologist has added a note to your patient's image.",
      "/patients"
    );
  } catch (error) {
    if (error.body.message.includes("AlreadyExists")) {
      await dbConn
        .execute(
          "UPDATE ImageNote SET note = ? WHERE image_uid = ? AND author_uid = ?",
          [request.body.note, req.params.image_uid, req.userUID]
        )
        .catch((error) => {
          console.log("image.service.uploadImageNote: ", error);
          reply.json({ success: false });
        });
      notify(
        patientUID,
        request.userUID,
        "Your image note has been updated.",
        "/imagelibrary"
      );
      notify(patientUID, req.userUID, "Your image note has been updated.", "/imagelibrary");
    }
  } */

  reply.send({ success: true });
}
