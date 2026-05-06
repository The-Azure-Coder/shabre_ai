import { getBearerToken } from "./http.js";
import { verifyToken } from "./auth-service.js";
import { prisma } from "./store.js";

export async function requireUser(request) {
  const tokenUser = await verifyToken(getBearerToken(request));
  const user = await prisma.user.findUnique({ where: { id: tokenUser.id } });

  if (!user) {
    const error = new Error("Authentication required");
    error.code = "UNAUTHORIZED";
    throw error;
  }

  return { id: user.id, email: user.email, name: user.name };
}
