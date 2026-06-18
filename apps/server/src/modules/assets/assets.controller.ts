import { Request, Response } from 'express';
import { AssetsService } from './assets.service';
import { CreateAssetInput, UpdateAssetInput, ListAssetsInput } from './assets.schema';

export class AssetsController {
  static async createAsset(req: Request, res: Response) {
    const data = req.body as CreateAssetInput;
    const asset = await AssetsService.createAsset(data, req.user!.id);
    res.status(201).json(asset);
  }

  static async getAsset(req: Request, res: Response) {
    const { assetId } = req.params;
    const asset = await AssetsService.getAsset(assetId, req.user!.id);
    res.json(asset);
  }

  static async listAssets(req: Request, res: Response) {
    const data = req.body as ListAssetsInput;
    const assets = await AssetsService.listAssets(data, req.user!.id);
    res.json(assets);
  }

  static async updateAsset(req: Request, res: Response) {
    const { assetId } = req.params;
    const data = req.body as UpdateAssetInput;
    const asset = await AssetsService.updateAsset(assetId, data, req.user!.id);
    res.json(asset);
  }

  static async deleteAsset(req: Request, res: Response) {
    const { assetId } = req.params;
    await AssetsService.deleteAsset(assetId, req.user!.id);
    res.status(204).send();
  }
}
