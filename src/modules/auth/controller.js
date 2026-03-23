import { getUsers, registerUser, loginUser } from "./service.js";
import { registerSchema, loginSchema } from "./validation.js";
import { refreshAccessToken, logoutUser } from "./service.js";

export const register = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const user = await registerUser(data);

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const { accessToken, refreshToken, user } = await loginUser(data);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/auth",
    });

    res.json({
      accessToken,
      user,
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    const accessToken = await refreshAccessToken(refreshToken);

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token provided" });
    }

    await logoutUser(refreshToken);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/auth",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const me = async (req, res) => {
  res.json({
    user: req.user,
  });
};

export const listUsers = async (req, res) => {
  const users = await getUsers();
  res.json(users);
};
