const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = async (req, res) => {
  try {
    const { username, email, phone, password, role } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Username is Required" });
    }

    if (!phone || phone.trim() === "") {
      return res.status(400).json({ message: "phone number is required." });
    }

    const cleanedPhone = phone.trim();

    if (!/^\d{10}$/.test(cleanedPhone)) {
      return res.status(400).json({
        message: "Phone number must be exactly 10 digits.",
      });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is Required" });
    }
    if (!role) {
      return res.status(400).json({ message: "role is Required" });
    }
    if (!password || password.length < 4) {
      return res
        .status(400)
        .json({ message: "Password is Required/must be at least 4 char" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      username,
      phone: cleanedPhone,
      email,
      password,
      role,
    });
    res.status(201).json({
      token: generateToken(user._id),
      user: {
        username: user.username,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration error", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is Required" });
    }
    if (!password || password.length < 4) {
      return res
        .status(400)
        .json({ message: "Password is Required/must be at least 4 char" });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    res.status(200).json({
      token: generateToken(user._id),
      message: "Login successful",
      user: { username: user.username, email: user.email, role: user.role,userId:user._id },
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

exports.getAllData = async (req, res) => {
  try {
    // Fetch only users where role is 'admin'
    const admins = await User.find({ role: "user" });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (err) {
    console.error("❌ Error fetching admin data:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const { username, email, phone } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username,
        email,
        phone,
      },
      { new: true, runValidators: true } // return updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ message: "Failed to update user.", error });
  }
};


exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      message: 'User deleted successfully.',
      data: deletedUser,
    });
  } catch (error) {
    console.error('Delete failed:', error);
    res.status(500).json({ message: 'Failed to delete user.', error });
  }
};
