import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { generateToken } from "../utils/generateToken.js";
import { IUser } from "../models/user.model.js";

/** Rejects anything that isn't a plain string -- without this, a body like
 *  {"email": {"$ne": null}} would be passed straight into a Mongoose
 *  `findOne` filter as an object instead of the string the API expects,
 *  matching an arbitrary existing user rather than failing to find one. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body ?? {};
    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }

    const userExists: IUser | null = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user: IUser = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(String(user._id)),
    });
  } catch (error) {
    console.error("Failed to register user:", error);
    res.status(500).json({ message: "Failed to register" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user: IUser | null = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(String(user._id)),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Failed to log in user:", error);
    res.status(500).json({ message: "Failed to log in" });
  }
};

const MAX_USER_IDS = 100;

/**
 * Batch name lookup, e.g. GET /api/auth/users?ids=a,b,c -> [{_id, name}].
 * Public on purpose (a display name isn't sensitive) -- this is the only
 * way anywhere in the app to turn a userId/authorId into something
 * displayable, so it's deliberately cheap to call from any service or page.
 */
export const getUsersByIds = async (req: Request, res: Response) => {
  const raw = req.query.ids;
  if (typeof raw !== "string" || !raw.trim()) {
    return res.status(400).json({ message: "ids query param is required" });
  }
  const ids = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .slice(0, MAX_USER_IDS);

  if (ids.length === 0) return res.json([]);

  try {
    const users = await User.find({ _id: { $in: ids } }).select("name");
    res.json(users.map((u) => ({ _id: u._id, name: u.name })));
  } catch (error) {
    console.error("Failed to look up users:", error);
    res.status(500).json({ message: "Failed to look up users" });
  }
};
