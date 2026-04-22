import { UserRole } from '../user-role.enum';

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}
