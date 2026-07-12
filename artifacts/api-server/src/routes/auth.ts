import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable, sanLuongTable, congDoanTable } from "@workspace/db/schema";
import { eq, isNull } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { rateLimit } from "express-rate-limit";

const router = Router();
const client = new OAuth2Client();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

router.post("/google", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400).json({ error: "Missing credential" });
    return;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID, 
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google payload" });
      return;
    }

    const { sub: google_id, email, name, picture: avatar } = payload;

    let [user] = await db.select().from(usersTable).where(eq(usersTable.google_id, google_id));

    if (!user) {
      const allUsers = await db.select().from(usersTable).limit(1);
      const isFirstUser = allUsers.length === 0;

      const [newUser] = await db
        .insert(usersTable)
        .values({
          google_id,
          email,
          name: name || "Unknown",
          avatar,
          is_admin: isFirstUser,
        })
        .returning();
      user = newUser;

      if (isFirstUser) {
        await db.update(sanLuongTable).set({ user_id: user.id }).where(isNull(sanLuongTable.user_id));
        await db.update(congDoanTable).set({ user_id: user.id }).where(isNull(congDoanTable.user_id));
      }
    }

    const tokenPayload = {
      id: user.id,
      google_id: user.google_id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      is_admin: user.is_admin,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: tokenPayload });
  } catch (err) {
    logger.error({ err }, "Google Auth Error");
    res.status(401).json({ error: "Authentication failed" });
  }
});

router.get("/me", requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ success: true });
});

export default router;
