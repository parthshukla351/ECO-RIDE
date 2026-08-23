const jwt = require('jsonwebtoken');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

const generateRefreshToken = (id, rememberMe = false) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : '7d'
  });
};

const sendTokenResponse = (user, statusCode, res, message = 'Success', rememberMe = false) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id, rememberMe);

  const isProduction = process.env.NODE_ENV === 'production';

  const accessCookieOptions = {
    expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  };

  const refreshCookieOptions = {
    expires: new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  };

  res.cookie('token', accessToken, accessCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);

  res.status(statusCode).json({
    success: true,
    message,
    token: accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      profileCompleted: user.profileCompleted,
      ecoPoints: user.ecoPoints,
      ecoLevel: user.ecoLevel,
      totalCO2Saved: user.totalCO2Saved,
      averageRating: user.averageRating
    }
  });
};

module.exports = { generateAccessToken, generateRefreshToken, sendTokenResponse };