import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAuthToken = ({ userId, email, role }) =>
  jwt.sign(
    {
      sub: userId,
      email,
      role,
    },
    env.JWT_SECRET,
    { expiresIn: `${env.JWT_EXPIRES_IN_HOURS}h` }
  );

export const verifyAuthToken = (token) => jwt.verify(token, env.JWT_SECRET);
