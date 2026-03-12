import { registerUser, loginUser } from "./service.js";
import { registerSchema, loginSchema } from "./validation.js";

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
      path: "/auth/refresh",
    });

    res.json({
      accessToken,
      user,
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};
