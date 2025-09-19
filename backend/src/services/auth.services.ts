import bcryptUtil from '../utils/bcrypt.utils';
import {generateToken} from '../utils/jwt.utils';
import UserRepository from '../repositories/user.repository';
import { UserCreateDto, LoginDto } from '../interfaces/dto';
import logger from '../utils/logger.utils';
import { v4 as uuidv4 } from 'uuid';

const userRepo = new UserRepository();

export default class AuthService {
  async register(userData: UserCreateDto) {
    const existingUser = await userRepo.findByEmail(userData.email);
    if (existingUser) throw new Error('Email already registered');
    // const hashedPassword = bcryptUtil.hashSync(userData.password);
    const user = await userRepo.create({ ...userData, hashed_password: userData.password });
    logger.info(`New user registered: ${userData.name} (${userData.role})`);
    const { hashed_password, ...userResponse } = user.toObject();
    return userResponse as any;
  }

  async login(loginData: LoginDto) {
    const user = await userRepo.findByEmail(loginData.username);
    const userData = {
        user_id: user?.user_id,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        role: user?.role,
        specialization: user?.specialization,
        is_active: user?.is_active,
        is_available: user?.is_available,
        workload_count: user?.workload_count,
        incentive_points:user?.incentive_points
    }
    if (!user || !user.comparePassword(loginData.password)) {
      throw new Error('Incorrect email or password');
    }
    const token = generateToken({ sub: user.email });
    const { hashed_password, ...userResponse } = user.toObject();
    return { access_token: token, token_type: 'bearer', user_role: user.role,user:userData};
  }
}