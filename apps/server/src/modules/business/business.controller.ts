import type { Request, Response } from 'express';
import * as business from './business.service';

// --- Circle-scoped ---
export async function list(req: Request, res: Response): Promise<void> {
  const businesses = await business.listBusinesses(req.params.circleId);
  res.status(200).json({ businesses });
}

export async function create(req: Request, res: Response): Promise<void> {
  const item = await business.createBusiness(req.params.circleId, req.user!.id, req.body);
  res.status(201).json({ business: item });
}

// --- Single business ---
export async function get(req: Request, res: Response): Promise<void> {
  const item = await business.getBusiness(req.params.businessId, req.user!.id);
  res.status(200).json({ business: item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await business.updateBusiness(req.params.businessId, req.user!.id, req.body);
  res.status(200).json({ business: item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await business.deleteBusiness(req.params.businessId, req.user!.id);
  res.status(204).send();
}

export async function dashboard(req: Request, res: Response): Promise<void> {
  const data = await business.getDashboard(req.params.businessId, req.user!.id);
  res.status(200).json({ dashboard: data });
}

export async function listTransactions(req: Request, res: Response): Promise<void> {
  const transactions = await business.listTransactions(req.params.businessId, req.user!.id);
  res.status(200).json({ transactions });
}

export async function recordSale(req: Request, res: Response): Promise<void> {
  const transaction = await business.recordSale(req.params.businessId, req.user!.id, req.body);
  res.status(201).json({ transaction });
}

export async function recordExpense(req: Request, res: Response): Promise<void> {
  const transaction = await business.recordExpense(req.params.businessId, req.user!.id, req.body);
  res.status(201).json({ transaction });
}

// --- Calculator ---
export async function calculate(req: Request, res: Response): Promise<void> {
  const breakdown = business.computeQuote(req.body);
  res.status(200).json({ breakdown });
}

// --- Products ---
export async function listProducts(req: Request, res: Response): Promise<void> {
  const products = await business.listProducts(req.params.businessId, req.user!.id);
  res.status(200).json({ products });
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const product = await business.createProduct(req.params.businessId, req.user!.id, req.body);
  res.status(201).json({ product });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const product = await business.updateProduct(
    req.params.businessId,
    req.params.productId,
    req.user!.id,
    req.body
  );
  res.status(200).json({ product });
}

export async function removeProduct(req: Request, res: Response): Promise<void> {
  await business.deleteProduct(req.params.businessId, req.params.productId, req.user!.id);
  res.status(204).send();
}
