import AuthService from "./auth.service";
import HospitalService from "./hospital.service";
import * as imageService from "./image.service";
import * as notificationService from "./notification.service";
import PaymentService from "./payment.service";
import UserService from "./user.service";

const authService = new AuthService();
const hospitalService = new HospitalService();
const paymentService = new PaymentService();
const userService = new UserService();

export {
  authService,
  hospitalService,
  imageService,
  notificationService,
  paymentService,
  userService,
};
