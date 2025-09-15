// import jwt from 'jsonwebtoken';
// import { config } from '../config/env';

// export const generateToken = (payload: object): string => {
//   return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpire as string | number });
// };

// export const verifyToken = (token: string): any => {
//   return jwt.verify(token, config.jwtSecret);
// };



import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { SignOptions } from 'jsonwebtoken';

export const generateToken = (payload: object): string => {
  const options: SignOptions = { expiresIn: config.jwtExpire };
  return jwt.sign(payload, config.jwtSecret, options);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.jwtSecret);
};
