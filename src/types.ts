export const ORDER_STATUSES = ['queued', 'cutting', 'sewing', 'fitting', 'done'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type MeasurementValues = Record<string, string>;

export type FabricPhoto = {
  id: string;
  imageData: string;
  note?: string;
  createdAt: string;
};

export type StatusEvent = {
  id: string;
  status: OrderStatus;
  changedAt: string;
};

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  garmentType: string;
  notes?: string;
  status: OrderStatus;
  fittingDate?: string;
  pickupDate: string;
  measurements: MeasurementValues;
  fabricPhotos: FabricPhoto[];
  statusHistory: StatusEvent[];
  createdAt: string;
  updatedAt: string;
};

export type MeasurementTemplate = {
  customerName: string;
  phone: string;
  updatedAt: string;
  measurements: MeasurementValues;
};

export const MEASUREMENT_FIELDS = [
  'Neck',
  'Chest/Bust',
  'Waist',
  'Hips',
  'Shoulder',
  'Shoulder-to-Waist',
  'Sleeve Length',
  'Inseam',
  'Outseam',
  'Armhole',
  'Cuff',
  'Across Back',
  'Bicep',
  'Thigh',
  'Knee'
] as const;
