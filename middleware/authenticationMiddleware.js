import { UnauthenticatedError } from "../errors/customErrors.js";
import { verifyJWT } from "../utils/jwtUtils.js";

export const authenticateUser = async (req, res, next) => {
  //middleware for decoding the token, middleware for checking if the user has valid token or not

  const token = req.headers.authorization?.split(" ")[1]; //for flutter
  // const { token } = req.cookies; //for web-apps
  if (!token) throw new UnauthenticatedError("unable to access");
  try {
    const decoded = verifyJWT(token);
    const { userId, role } = decoded;
    req.user = { userId: userId, role: role };
    next();
  } catch (error) {
    console.log(error);
    throw new UnauthenticatedError("Invalid Authorization");
  }
};
