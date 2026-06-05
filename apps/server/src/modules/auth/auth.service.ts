import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { signAccessToken } from '../../lib/jwt';
import { HttpError } from '../../utils/httpError';
import type { LoginInput, RegisterInput, UpdateProfileInput } from './auth.schema';

// Friendly pastel avatar colours from the cozy palette.
const AVATAR_COLORS = ['#8fa998', '#ecbbba', '#cec2d9', '#b2cdbb', '#fdcbcb', '#aa9eb5'];

function pickAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export function toUserDto(user: User): UserDto {
  return { id: user.id, name: user.name, email: user.email, avatarColor: user.avatarColor };
}

export async function register(input: RegisterInput): Promise<{ user: UserDto; accessToken: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      avatarColor: pickAvatarColor(),
    },
  });

  return { user: toUserDto(user), accessToken: issueToken(user) };
}

export async function login(input: LoginInput): Promise<{ user: UserDto; accessToken: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new HttpError(401, 'Incorrect email or password', 'INVALID_CREDENTIALS');

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Incorrect email or password', 'INVALID_CREDENTIALS');

  return { user: toUserDto(user), accessToken: issueToken(user) };
}

export async function getCurrentUser(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'User not found', 'NOT_FOUND');
  return toUserDto(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<UserDto> {
  if (input.email) {
    const existing = await prisma.user.findFirst({ where: { email: input.email, NOT: { id: userId } } });
    if (existing) throw new HttpError(409, 'Email is already in use', 'EMAIL_TAKEN');
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.avatarColor !== undefined && { avatarColor: input.avatarColor }),
    },
  });
  return toUserDto(user);
}

function issueToken(user: User): string {
  return signAccessToken({ sub: user.id, email: user.email });
}
