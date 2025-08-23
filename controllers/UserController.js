import User from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Function to generate JWT token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      university: user.university,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "5h" } // Token expires in 5 hours
  );
};

// User Signup Controller
export const signupUser = async (req, res) => {
  const { name, email, studentId, password, confirmPassword, university } =
    req.body;

  try {
    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if student ID already exists
    const existingUserById = await User.findOne({ studentId });
    if (existingUserById) {
      return res.status(400).json({ message: "Student ID already exists" });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      studentId,
      password,
      university,
      role: "user", // Default role
    });

    await newUser.save();

    const accessToken = generateAccessToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        studentId: newUser.studentId,
        university: newUser.university,
        role: newUser.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// User Login Controller
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        university: user.university,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Search users by name
export const searchUsers = async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res
      .status(400)
      .json({ message: "Name query parameter is required" });
  }

  try {
    const users = await User.find({
      name: { $regex: name, $options: "i" },
    })
      .select("name email studentId university")
      .limit(10); // Limit results to 10 users

    res.status(200).json(users);
  } catch (error) {
    console.error("Search Users Error:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get another user's profile by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// NEW: Find student by ID and university
export const findStudentByIdAndClub = async (req, res) => {
  const { studentId, clubId } = req.params; // Changed from req.body to req.params

  if (!studentId || !clubId) {
    return res.status(400).json({
      message: "Student ID and Club ID are required",
    });
  }

  try {
    const student = await User.findOne({
      studentId,
      club: clubId, // Changed from 'university' to 'club'
    }).select("-password");

    if (!student) {
      return res.status(404).json({
        message: "Student not found with the provided ID in this club",
      });
    }

    res.status(200).json({
      message: "Student found successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        club: student.club, // Changed from 'university' to 'club'
        role: student.role,
      },
    });
  } catch (error) {
    console.error("Find Student In Club Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// NEW: Get all students from a specific university
export const getStudentsByClub = async (req, res) => {
  const { clubId } = req.params; // Changed parameter name from 'university' to 'clubId'

  if (!clubId) {
    return res.status(400).json({ message: "Club ID parameter is required" });
  }

  try {
    const students = await User.find({
      club: clubId, // Changed from 'university' to 'club'
      role: "user", // Only get regular users, not admins
    }).select("name email studentId club"); // Added 'club' to select if needed

    res.status(200).json({
      message: "Club members retrieved successfully",
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get Club Members Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// NEW: Verify student ID availability
export const verifyStudentId = async (req, res) => {
  const { studentId } = req.params;

  try {
    const existingUser = await User.findOne({ studentId });

    res.status(200).json({
      available: !existingUser,
      message: existingUser
        ? "Student ID already taken"
        : "Student ID available",
    });
  } catch (error) {
    console.error("Verify Student ID Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// NEW: Update user profile
export const updateProfile = async (req, res) => {
  const { name, university } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (university) user.university = university;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        university: user.university,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
