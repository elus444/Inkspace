import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { generateToken } from "../utils/generateToken.js";
import { IUser } from "../models/user.model.js";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
