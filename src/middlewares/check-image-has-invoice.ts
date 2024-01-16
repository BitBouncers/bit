/* import dbConn from "../config/db.js";

async function checkImageHasInvoice(req, res, next) {
  try {
    const result = await sql`
        SELECT
          COALESCE(inv.uid, 'No Invoice') as invoice_uid
        FROM
          "Image" i
        LEFT JOIN
          "Invoice" inv ON i.uid = inv.image_uid AND inv.radiologist_uid = ${req.params.uid}
        WHERE i.uid = ${req.body.image}`.catch((error) => {
      console.log("checkImageHasInvoice: ", error);
      res.json({ success: false });
    });

    if (result.count > 0 && result[0].invoice_uid === "No Invoice") {
      next();
    } else {
      return res.status(409).json({
        success: false,
        msg: "Image already has an invoice for this radiologist.",
      });
    }
  } catch (error) {
    console.log("checkImageHasInvoice: ", error);
  }
}

export default checkImageHasInvoice; */
