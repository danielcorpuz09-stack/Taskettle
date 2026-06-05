import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import type { Role } from '../../types/domain';

export interface CircleSummaryDto {
  id: string;
  name: string;
  icon: string;
  role: Role;
  memberCount: number;
}

export interface MemberDto {
  userId: string;
  name: string;
  email: string;
  avatarColor: string;
  role: Role;
}

export async function listCircles(userId: string): Promise<CircleSummaryDto[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { circle: { include: { _count: { select: { memberships: true } } } } },
    orderBy: { joinedAt: 'asc' },
  });

  return memberships.map((m) => ({
    id: m.circle.id,
    name: m.circle.name,
    icon: m.circle.icon,
    role: m.role as Role,
    memberCount: m.circle._count.memberships,
  }));
}

export async function createCircle(
  userId: string,
  input: { name: string; icon?: string }
): Promise<CircleSummaryDto> {
  const circle = await prisma.circle.create({
    data: {
      name: input.name,
      icon: input.icon ?? 'family_history',
      memberships: { create: { userId, role: 'OWNER' } },
    },
  });

  return { id: circle.id, name: circle.name, icon: circle.icon, role: 'OWNER', memberCount: 1 };
}

export async function getCircle(
  userId: string,
  circleId: string
): Promise<CircleSummaryDto & { members: MemberDto[] }> {
  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    include: {
      memberships: { include: { user: true }, orderBy: { joinedAt: 'asc' } },
    },
  });
  if (!circle) throw new HttpError(404, 'Circle not found', 'NOT_FOUND');

  const callerMembership = circle.memberships.find((m) => m.userId === userId);
  if (!callerMembership) throw new HttpError(403, 'You are not a member of this circle', 'NOT_A_MEMBER');

  return {
    id: circle.id,
    name: circle.name,
    icon: circle.icon,
    role: callerMembership.role as Role,
    memberCount: circle.memberships.length,
    members: circle.memberships.map(toMemberDto),
  };
}

export async function listMembers(circleId: string): Promise<MemberDto[]> {
  const memberships = await prisma.membership.findMany({
    where: { circleId },
    include: { user: true },
    orderBy: { joinedAt: 'asc' },
  });
  return memberships.map(toMemberDto);
}

/** Ensures the given user is a member of the circle (used to validate assignees). */
export async function assertMember(userId: string, circleId: string): Promise<void> {
  const membership = await prisma.membership.findUnique({
    where: { userId_circleId: { userId, circleId } },
    select: { id: true },
  });
  if (!membership) {
    throw new HttpError(400, 'Assignee must be a member of this circle', 'ASSIGNEE_NOT_MEMBER');
  }
}

function toMemberDto(m: {
  role: string;
  user: { id: string; name: string; email: string; avatarColor: string };
}): MemberDto {
  return {
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    avatarColor: m.user.avatarColor,
    role: m.role as Role,
  };
}
