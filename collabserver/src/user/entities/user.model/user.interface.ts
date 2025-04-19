export interface User {
  id: number;
  username: string;
  email: string;
  avtarUrl: string;
  provider: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
