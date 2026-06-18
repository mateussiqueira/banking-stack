import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface User {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  createdAt: Date;
}

const users: Map<string, User> = new Map();

class AuthService {
  createUser(name: string, email: string): User {
    const existing = Array.from(users.values()).find(
      (u) => u.email === email
    );
    if (existing) {
      throw new Error(`User with email ${email} already exists`);
    }

    const user: User = {
      id: uuidv4(),
      name,
      email,
      apiKey: `banking_${uuidv4().replace(/-/g, '')}`,
      createdAt: new Date(),
    };

    users.set(user.id, user);
    return user;
  }

  generateToken(userId: string): string {
    const user = users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    return jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );
  }

  validateToken(token: string): { userId: string; name: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        name: string;
        email: string;
      };
      return decoded;
    } catch {
      return null;
    }
  }

  validateApiKey(apiKey: string): User | undefined {
    return Array.from(users.values()).find((u) => u.apiKey === apiKey);
  }

  getUser(userId: string): User | undefined {
    return users.get(userId);
  }

  listUsers(): User[] {
    return Array.from(users.values());
  }
}

export const authService = new AuthService();
