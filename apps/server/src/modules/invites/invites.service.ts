import type { Invite } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import type { InviteStatus, Role } from '../../types/domain';

const INVITE_TTL_DAYS = 7;

export interface InviteDto {
  id: string;
  email: string;
  token: string;
  status: InviteStatus;
  expiresAt: string;
}

export async function createInvite(
  circleId: string,
  invitedById: string,
  email: string
): Promise<InviteDto> {
  // If the user already exists and is already a member, short-circuit.
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    const member = await prisma.membership.findUnique({
      where: { userId_circleId: { userId: existingUser.id, circleId } },
      select: { id: true },
    });
    if (member) throw new HttpError(409, 'That person is already in this circle', 'ALREADY_MEMBER');
  }

  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  const invite = await prisma.invite.create({
    data: { circleId, invitedById, email, expiresAt, status: 'PENDING' },
  });

  return toInviteDto(invite);
}

export async function acceptInvite(
  token: string,
  user: { id: string; email: string }
): Promise<{ id: string; name: string; role: Role }> {
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) throw new HttpError(404, 'Invitation not found', 'NOT_FOUND');
  if (invite.status !== 'PENDING') throw new HttpError(409, 'This invitation is no longer valid', 'INVITE_USED');
  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.invite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
    throw new HttpError(410, 'This invitation has expired', 'INVITE_EXPIRED');
  }

  // Create membership (idempotent) and mark invite accepted in one transaction.
  const [, circle] = await prisma.$transaction([
    prisma.membership.upsert({
      where: { userId_circleId: { userId: user.id, circleId: invite.circleId } },
      create: { userId: user.id, circleId: invite.circleId, role: 'MEMBER' },
      update: {},
    }),
    prisma.circle.findUniqueOrThrow({ where: { id: invite.circleId } }),
    prisma.invite.update({ where: { id: invite.id }, data: { status: 'ACCEPTED' } }),
  ]);

  return { id: circle.id, name: circle.name, role: 'MEMBER' };
}

function toInviteDto(invite: Invite): InviteDto {
  return {
    id: invite.id,
    email: invite.email,
    token: invite.token,
    status: invite.status as InviteStatus,
    expiresAt: invite.expiresAt.toISOString(),
  };
}
