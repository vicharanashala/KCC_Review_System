  // import dotenv from 'dotenv';

  // dotenv.config();
  // if (!process.env.JWT_SECRET) {
  //   throw new Error('JWT_SECRET is not defined in environment variables');
  // }
  // export const config = {
  //   mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/kcc_review_system',
  //   jwtSecret: process.env.JWT_SECRET as string ,
  //   jwtExpire: process.env.JWT_EXPIRE || '1d',
  //   port: parseInt(process.env.PORT || '8000', 10),
  // };

  import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

if (!process.env.JWT_EXPIRE) {
  throw new Error('JWT_EXPIRE is not defined in environment variables');
}

// Validate JWT_EXPIRE format (optional, but recommended)
const jwtExpire = process.env.JWT_EXPIRE;
const validTimeUnits = ['s', 'm', 'h', 'd', 'w', 'y']; // Common time units for jsonwebtoken
const isValidJwtExpire = /^[0-9]+[smhdwy]$/.test(jwtExpire) || !isNaN(Number(jwtExpire));
if (!isValidJwtExpire) {
  throw new Error('JWT_EXPIRE must be a number or a string with a valid time unit (e.g., "1h", "1d", "3600")');
}

export const config = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/kcc_review_system',
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpire: jwtExpire, // Keep as string since environment variables are strings
  port: parseInt(process.env.PORT || '8000', 10),
};