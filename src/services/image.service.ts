import { FastifyReply, FastifyRequest, ImageNoteUpdate } from "fastify";
import postgres from "postgres";
import { notify } from "src/utils/notify";

const { PostgresError } = postgres;

interface IImageService {
  updateImageNote: (
    request: FastifyRequest<ImageNoteUpdate>,
    reply: FastifyReply
  ) => Promise<void>;
}

export default class ImageService implements IImageService {
  updateImageNote = async (
    request: FastifyRequest<ImageNoteUpdate>,
    reply: FastifyReply
  ) => {
    let patientResult;
    const invoiceResult = await request.server.pg.query(`
      SELECT
        i.uid AS "image_uid", i.uploaded_by AS "uploaded_by", i.url AS "image_url",
        iv.uid AS "invoice_uid", iv.patient_uid AS "patient_uid", iv.radiologist_uid AS "radiologist_uid", iv.paid
      FROM "Image" i
      LEFT JOIN "Invoice" iv ON i.uploaded_for = iv.patient_uid
      WHERE i.uid = '${request.params.image_uid}' AND iv.paid = false`);

    if (invoiceResult.rowCount && invoiceResult.rowCount > 0) {
      return reply.code(409).send({
        success: false,
        msg: "The patient has not paid for this image yet. Please wait for the patient to pay before updating the note.",
      });
    }

    try {
      patientResult = await request.server.pg.query(`
      SELECT
        U.uid AS "physician_uid", PR.patient_uid
      FROM "User" U
      JOIN
        "PatientRelation" PR ON U.uid = PR.staff_uid
      JOIN
        "Image" I ON I.uploaded_for = PR.patient_uid
      WHERE I.uid = '${request.params.image_uid}' AND U.role = 'PHYSICIAN'`);
    } catch (error) {
      console.log("image.service.uploadImageNote.patientResult: ", error);
    }

    if (!patientResult) {
      return reply
        .code(500)
        .send({ success: false, msg: "Error updating image note." });
    }

    const patientUID = patientResult.rows[0].patient_uid as string;
    const physicianUID = patientResult.rows[0].physician_uid as string;

    try {
      await request.server.pg.query(
        `INSERT INTO "ImageNote" (image_uid, author_uid, note) VALUES('${request.params.image_uid}', '${request.userUID}', '${request.body.note}')`
      );
      notify(request.server.pg.pool, {
        recipient: patientUID,
        sender: physicianUID,
        message: "Your image has a new note.",
        to: "/imagelibrary",
      });
      notify(request.server.pg.pool, {
        recipient: patientUID,
        sender: physicianUID,
        message: "Don't forget to rate your radiologist.",
        to: "/imagelibrary",
      });
      notify(request.server.pg.pool, {
        recipient: physicianUID,
        sender: patientUID,
        message: "A radiologist has added a note to your patient's image.",
        to: "/patients",
      });
    } catch (error: unknown) {
      if (error instanceof PostgresError) {
        if (error.code === "23505") {
          await request.server.pg
            .query(
              `UPDATE "ImageNote" SET note = '${request.body.note}' WHERE image_uid = '${request.params.image_uid}' AND author_uid = '${request.userUID}'`
            )
            .catch((error) => {
              console.log("image.service.uploadImageNote: ", error);
              return reply
                .code(500)
                .send({ success: false, msg: "Error updating image note." });
            });
          notify(request.server.pg.pool, {
            recipient: patientUID,
            sender: physicianUID,
            message: "Your image note has been updated.",
            to: "/imagelibrary",
          });
        }
      }
    }

    reply.send({ success: true });
  };
}
