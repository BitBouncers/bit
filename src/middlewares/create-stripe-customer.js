import stripe from "../config/stripe.js";
import sql from "../config/db.js";

async function createStripeCustomer(req, res, next) {
  await sql`SELECT stripe_id FROM "StripeUser" WHERE patient_uid = ${req.userUID}`.then((result) => {
    if (result.count > 0) {
      req.stripeID = result[0].stripe_id;
      next();
    } else {
      try {
        sql`SELECT email, first_name, last_name FROM "User" WHERE uid = ${req.userUID}`.then((result) => {
          const { email, first_name, last_name } = result[0];
          req.patientEmail = email;
          req.patientName = first_name + " " + last_name;

          stripe.customers
            .create({
              email: req.patientEmail,
              name: req.patientName,
              metadata: {
                patientUID: req.userUID,
                radiologistUID: req.params.uid,
              },
            })
            .then((customer) => {
              if (customer.id) {
                sql`
                        INSERT IGNORE INTO StripeUser(patient_uid, stripe_id) VALUES(${req.userUID}, ${customer.id})
                      `
                  .then((result) => {
                    if (result.count > 0) {
                      req.stripeID = customer.id;
                      console.log("Stripe user created");
                      next();
                    }
                  })
                  .catch((error) => {
                    console.log(error);
                    res.status(500).json({ msg: "Error creating customer" });
                  });
              } else {
                res.status(500).json({ msg: "Error creating customer" });
              }
            });
        });
      } catch (error) {
        console.log("createStripeCustomer: ", error);
      }
    }
  });
}

export default createStripeCustomer;
