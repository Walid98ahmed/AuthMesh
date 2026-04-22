import { UserRole } from '../user-role.enum';

export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
