import bcrypt from 'bcrypt';

const saltRounds = 10;

export default {
  hashSync: (password: string): string => bcrypt.hashSync(password, saltRounds),
  compareSync: (password: string, hash: string): boolean => bcrypt.compareSync(password, hash),
};