/* import dbConn from "../config/db.js";

async function checkUnpaidInvoices(req, res, next) {
  try {
    const unpaidInvoice =
      await sql`SELECT COUNT(*)::int as count FROM "Invoice" WHERE patient_uid = ${req.userUID} AND paid = false`;

    if (unpaidInvoice[0].count > 0) {
      return res.status(409).json({
        success: false,
        msg: "You have unpaid invoices. Please pay or cancel them before requesting another opinion.",
      });
    }

    next();
  } catch (error) {
    console.log("checkUnpaidInvoices: ", error);
  }
}

export default checkUnpaidInvoices; */
