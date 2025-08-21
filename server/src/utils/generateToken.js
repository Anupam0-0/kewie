const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "abc";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "abcd";
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "1500000s";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
	throw new Error("JWT secrets must be set in env");
}

function signAccess(payload) {
	return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

// function signRefresh(payload) {
// 	return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
// }

function verifyAccess(token) {
	return jwt.verify(token, ACCESS_SECRET);
}

// function verifyRefresh(token) {
// 	return jwt.verify(token, REFRESH_SECRET);
// }

module.exports = {
	signAccess,
	// signRefresh,
	verifyAccess,
	// verifyRefresh,
	// hashToken,
};
