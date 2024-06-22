import AuthService from "./auth.service";
import HospitalService from "./hospital.service";
import ImageService from "./image.service";
import NotificationService from "./notification.service";
import PaymentService from "./payment.service";
import UserService from "./user.service";

const authService = new AuthService();
const hospitalService = new HospitalService();
const imageService = new ImageService();
const notificationService = new NotificationService();
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
