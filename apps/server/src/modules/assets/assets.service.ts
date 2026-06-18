import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { CreateAssetInput, UpdateAssetInput, ListAssetsInput } from './assets.schema';

export class AssetsService {
  static async createAsset(data: CreateAssetInput, userId: string) {
    // Verify circle membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: data.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    const receiptPhotoUrls = data.receiptPhotoUrls ? JSON.stringify(data.receiptPhotoUrls) : null;

    return await prisma.homeAsset.create({
      data: {
        circleId: data.circleId,
        name: data.name,
        category: data.category,
        purchaseDate: data.purchaseDate,
        warrantyExpiration: data.warrantyExpiration,
        serialNumber: data.serialNumber,
        receiptPhotoUrls,
        currentValue: data.currentValue,
        notes: data.notes,
        createdById: userId,
      },
    });
  }

  static async getAsset(assetId: string, userId: string) {
    const asset = await prisma.homeAsset.findUnique({
      where: { id: assetId },
      include: { circle: true },
    });

    if (!asset) {
      throw new HttpError(404, 'Asset not found', 'NOT_FOUND');
    }

    // Verify membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: asset.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    return asset;
  }

  static async listAssets(data: ListAssetsInput, userId: string) {
    // Verify membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: data.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    return await prisma.homeAsset.findMany({
      where: {
        circleId: data.circleId,
        ...(data.category && { category: data.category }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateAsset(assetId: string, data: UpdateAssetInput, userId: string) {
    // Verify asset exists and user has access
    await this.getAsset(assetId, userId);

    const receiptPhotoUrls = data.receiptPhotoUrls ? JSON.stringify(data.receiptPhotoUrls) : undefined;

    return await prisma.homeAsset.update({
      where: { id: assetId },
      data: {
        ...data,
        receiptPhotoUrls,
      },
    });
  }

  static async deleteAsset(assetId: string, userId: string) {
    await this.getAsset(assetId, userId);

    return await prisma.homeAsset.delete({
      where: { id: assetId },
    });
  }
}
