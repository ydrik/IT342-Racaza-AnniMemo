import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";
const API_URL = `${API_BASE_URL}/api/auth/`;

// Function to register a user
const register = (username, email, password) => {
  return axios.post(API_URL + "register", {
    username,
    email,
    password,
    firstName: "N/A",
    lastName: "N/A"
  });
};

// Function to login a user
const login = (username, password) => {
  return axios.post(API_URL + "login", { username, password }).then((response) => {
    if (response.data.token) {
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  });
};

const logout = () => {
  localStorage.removeItem("user");
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default AuthService;