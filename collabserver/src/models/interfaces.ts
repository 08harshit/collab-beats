export interface IBaseEntity {
  createdAt?: Date;
  updatedAt?: Date;
}

export enum Provider {
  GOOGLE = 'google',
  SPOTIFY = 'spotify',
}

// Add these interfaces for better type safety
export interface IUser extends IBaseEntity {
  name: string;
  email: string;
  avatarUrl?: string;
  provider: Provider;
  providerId?: string;
}

export interface IRoom extends IBaseEntity {
  code: string;
  name?: string;
  hostId: number;
  isActive: boolean;
}
