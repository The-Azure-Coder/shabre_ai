import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { appConfig, requireJwtSecret } from "./config.js";
import { prisma } from "./store.js";

export async function issueToken(user) {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + appConfig.jwtExpiresIn)
    .sign(requireJwtSecret());
}

export async function signupUser(input) {
  const email = input.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error("Email already exists");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: input.name,
      passwordHash: await bcrypt.hash(input.password, 10),
    },
  });
  return authPayload(user);
}

export async function loginUser(input) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  const valid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!valid) {
    const error = new Error("Invalid email or password");
    error.code = "UNAUTHORIZED";
    throw error;
  }
  return authPayload(user);
}

async function authPayload(user) {
  return {
    user: publicUser(user),
    accessToken: await issueToken(user),
    expiresIn: appConfig.jwtExpiresIn,
  };
}

export function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

export async function verifyToken(token) {
  if (!token) {
    const error = new Error("Authentication required");
    error.code = "UNAUTHORIZED";
    throw error;
  }
  const { payload } = await jwtVerify(token, requireJwtSecret());
  return { id: payload.sub, email: payload.email, name: payload.name };
}
