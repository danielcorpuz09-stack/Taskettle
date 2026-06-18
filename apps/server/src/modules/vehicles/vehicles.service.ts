import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { CreateVehicleInput, UpdateVehicleInput, ListVehiclesInput } from './vehicles.schema';

export class VehiclesService {
  static async createVehicle(data: CreateVehicleInput, userId: string) {
    // Verify circle membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: data.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    return await prisma.vehicle.create({
      data: {
        circleId: data.circleId,
        name: data.name,
        model: data.model,
        plateNumber: data.plateNumber,
        registrationExpiry: data.registrationExpiry,
        insuranceExpiry: data.insuranceExpiry,
        notes: data.notes,
        createdById: userId,
      },
    });
  }

  static async getVehicle(vehicleId: string, userId: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new HttpError(404, 'Vehicle not found', 'NOT_FOUND');
    }

    // Verify membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: vehicle.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    return vehicle;
  }

  static async listVehicles(data: ListVehiclesInput, userId: string) {
    // Verify membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: data.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    return await prisma.vehicle.findMany({
      where: { circleId: data.circleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateVehicle(vehicleId: string, data: UpdateVehicleInput, userId: string) {
    await this.getVehicle(vehicleId, userId);

    return await prisma.vehicle.update({
      where: { id: vehicleId },
      data,
    });
  }

  static async deleteVehicle(vehicleId: string, userId: string) {
    await this.getVehicle(vehicleId, userId);

    return await prisma.vehicle.delete({
      where: { id: vehicleId },
    });
  }
}
