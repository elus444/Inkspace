import { Request, Response } from "express";
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
      token: generateToken(user._id.toString()),
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
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
