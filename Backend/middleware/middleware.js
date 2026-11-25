/** @format */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = (req, res, next) => {
  console.log("Auth Middleware: Temporarily bypassed entire middleware.");
  next();
};

module.exports = authMiddleware;
