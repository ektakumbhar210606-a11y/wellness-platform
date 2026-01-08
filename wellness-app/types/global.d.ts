// Global type declarations to help TypeScript resolve module paths

declare module '../../../lib/db' {
  export function connectToDatabase(): Promise<any>;
  export function disconnectFromDatabase(): Promise<void>;
}

declare module '../../../models/User' {
  import { Document, Model } from 'mongoose';
  
  export enum UserRole {
    Customer = 'Customer',
    Business = 'Business',
    Therapist = 'Therapist'
  }
  
  export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  const UserModel: Model<IUser>;
  export default UserModel;
}