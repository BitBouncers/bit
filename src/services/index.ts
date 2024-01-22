import AuthService from "./auth.service";
import * as hospitalService from "./hospital.service";
import * as imageService from "./image.service";
import * as notificationService from "./notification.service";
import * as paymentService from "./payment.service";
import UserService from "./user.service";

const authService = new AuthService();
const userService = new UserService();

export {
  authService,
  hospitalService,
  imageService,
  notificationService,
  paymentService,
  userService,
};
