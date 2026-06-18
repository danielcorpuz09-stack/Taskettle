import { Request, Response } from 'express';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleInput, UpdateVehicleInput, ListVehiclesInput } from './vehicles.schema';

export class VehiclesController {
  static async createVehicle(req: Request, res: Response) {
    const data = req.body as CreateVehicleInput;
    const vehicle = await VehiclesService.createVehicle(data, req.user!.id);
    res.status(201).json(vehicle);
  }

  static async getVehicle(req: Request, res: Response) {
    const { vehicleId } = req.params;
    const vehicle = await VehiclesService.getVehicle(vehicleId, req.user!.id);
    res.json(vehicle);
  }

  static async listVehicles(req: Request, res: Response) {
    const data = req.body as ListVehiclesInput;
    const vehicles = await VehiclesService.listVehicles(data, req.user!.id);
    res.json(vehicles);
  }

  static async updateVehicle(req: Request, res: Response) {
    const { vehicleId } = req.params;
    const data = req.body as UpdateVehicleInput;
    const vehicle = await VehiclesService.updateVehicle(vehicleId, data, req.user!.id);
    res.json(vehicle);
  }

  static async deleteVehicle(req: Request, res: Response) {
    const { vehicleId } = req.params;
    await VehiclesService.deleteVehicle(vehicleId, req.user!.id);
    res.status(204).send();
  }
}
