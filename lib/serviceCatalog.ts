export type VehicleType = 'motorcycle' | 'sedan' | 'suv' | 'truck';
export type VehicleSize = 'small' | 'medium' | 'large' | 'xl' | 'xxl';

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  prices?: Partial<Record<VehicleSize, number>>;
  motorcyclePrice?: number;
  description?: string;
}

const carWash = (id: string, name: string, prices: [number, number, number, number, number]): CatalogItem => ({
  id,
  name,
  category: 'Car Wash Packages',
  prices: { small: prices[0], medium: prices[1], large: prices[2], xl: prices[3], xxl: prices[4] },
});

export const CAR_WASH_PACKAGES: CatalogItem[] = [
  carWash('cw-1', 'Bodywash + Tire Black', [160, 180, 200, 220, 240]),
  carWash('cw-2', 'Bodywash + Tire Black + Vacuum', [200, 230, 250, 290, 320]),
  carWash('cw-3', 'Bodywash + Vacuum + Interior Dressing + Tire Black', [250, 270, 290, 350, 790]),
  carWash('cw-4', 'Bodywash + Vacuum + Tire Black + Wax', [330, 380, 410, 450, 500]),
  carWash('cw-5', 'Bodywash + Vacuum + Tire Black + Engine Wash', [380, 410, 450, 500, 550]),
  carWash('cw-6', 'Bodywash + Vacuum + Tire Black + Wax', [480, 500, 530, 560, 590]),
  carWash('cw-7', 'Bodywash + Vacuum + Interior Dressing + Engine Wash + Tire Black', [580, 600, 630, 650, 700]),
  carWash('cw-8', 'Bodywash + Vacuum + Interior Dressing + Engine Wash + Wax + Tire Black', [680, 700, 730, 750, 800]),
];

export const PREMIUM_PACKAGES: CatalogItem[] = [
  { id: 'premium-1', name: 'Premium Wash Package 1', category: 'Premium Wash', prices: { small: 1100, medium: 1300, large: 1500, xl: 1500 }, description: 'Body Wash, Vacuum, Tire Black, Acidrain Removal' },
  { id: 'premium-2', name: 'Premium Wash Package 2', category: 'Premium Wash', prices: { small: 1300, medium: 1500, large: 1700, xl: 2200 }, description: 'Body Wash, Vacuum, Interior Dressing, Tire Black, Acidrain Removal, Wax' },
  { id: 'premium-3', name: 'Premium Wash Package 3', category: 'Premium Wash', prices: { small: 1500, medium: 1800, large: 2100, xl: 2500 }, description: 'Body Wash, Vacuum, Interior Dressing, Tire Black, Acidrain Removal, Engine Wash' },
];

export const INDIVIDUAL_SERVICES: CatalogItem[] = [
  { id: 'svc-vacuum', name: 'Vacuum', category: 'Additional Individual Services', prices: { small: 120, medium: 130, large: 150, xl: 170, xxl: 190 } },
  { id: 'svc-tire-black', name: 'Tire Black', category: 'Additional Individual Services', prices: { small: 60, medium: 60, large: 80, xl: 90, xxl: 100 } },
  { id: 'svc-interior-dressing', name: 'Interior Dressing', category: 'Additional Individual Services', prices: { small: 120, medium: 140, large: 160, xl: 180, xxl: 200 } },
  { id: 'svc-engine-wash', name: 'Engine Wash', category: 'Additional Individual Services', prices: { small: 250, medium: 250, large: 250, xl: 270, xxl: 370 } },
  { id: 'svc-asphalt-removal', name: 'Asphalt Removal', category: 'Additional Individual Services', prices: { small: 150, medium: 170, large: 180, xl: 200, xxl: 250 } },
  { id: 'svc-wax-labor', name: 'Wax (Labor Only)', category: 'Additional Individual Services', prices: { small: 150, medium: 170, large: 190, xl: 210, xxl: 230 } },
  { id: 'svc-wax', name: 'Wax', category: 'Additional Individual Services', prices: { small: 220, medium: 240, large: 260, xl: 280, xxl: 300 } },
  { id: 'svc-underwash', name: 'Underwash', category: 'Additional Individual Services', prices: { small: 200, medium: 200, large: 220, xl: 270, xxl: 300 } },
  { id: 'svc-buff-wax', name: 'Buff Wax (Labor Only)', category: 'Additional Individual Services', prices: { small: 180, medium: 200, large: 220, xl: 250, xxl: 280 } },
  { id: 'svc-pull-seat', name: 'Pull Out / Install Seat Cover', category: 'Additional Individual Services', prices: { small: 160, medium: 170, large: 190, xl: 220, xxl: 290 } },
  { id: 'svc-underwash-dressing', name: 'Underwash + Dressing', category: 'Additional Individual Services', prices: { small: 250, medium: 250, large: 280, xl: 290, xxl: 320 } },
  { id: 'svc-bac', name: 'Bac To Zero', category: 'Additional Individual Services', prices: { small: 500, medium: 550, large: 600, xl: 600, xxl: 700 } },
  { id: 'svc-acidrain', name: 'Acidrain Removal', category: 'Additional Individual Services', prices: { small: 600, medium: 700, large: 800, xl: 900, xxl: 1000 } },
  { id: 'svc-engine-detailing', name: 'Engine Detailing', category: 'Additional Individual Services', prices: { small: 1500 } },
];

export const MOTORCYCLE_SERVICES: CatalogItem[] = [
  { id: 'mc-wash', name: 'Wash', category: 'Motorcycle', motorcyclePrice: 100 },
  { id: 'mc-dressing', name: 'Dressing', category: 'Motorcycle', motorcyclePrice: 90 },
  { id: 'mc-wax', name: 'Wax', category: 'Motorcycle', motorcyclePrice: 100 },
  { id: 'mc-tire-black', name: 'Tire Black', category: 'Motorcycle', motorcyclePrice: 60 },
  { id: 'mc-wash-dressing', name: 'Wash + Dressing', category: 'Motorcycle', motorcyclePrice: 160 },
  { id: 'mc-wash-dressing-tire', name: 'Wash + Dressing + Tire Black', category: 'Motorcycle', motorcyclePrice: 200 },
  { id: 'mc-wash-dressing-wax', name: 'Wash + Dressing + Wax', category: 'Motorcycle', motorcyclePrice: 220 },
  { id: 'mc-wash-dressing-tire-wax', name: 'Wash + Dressing + Tire Black + Wax', category: 'Motorcycle', motorcyclePrice: 240 },
];

export const DETAILING_SERVICES: CatalogItem[] = [
  { id: 'detail-ext', name: 'Exterior Detailing Without Ceramic Coating', category: 'Detailing', prices: { small: 5500, medium: 6500, large: 8000, xl: 8500, xxl: 10500 }, description: 'Decontamination, claybar treatment, acid rain removal, paint correction, free wax' },
  { id: 'detail-int-basic', name: 'Interior Detailing Without Carpet/Seat Removal', category: 'Detailing', prices: { small: 4500, medium: 5000, large: 5500, xl: 7000, xxl: 8000 }, description: 'Deep upholstery shampooing, seat shampooing, steam sterilization, interior detailing, BAC To Zero' },
  { id: 'detail-int-full', name: 'Interior Detailing With Carpet/Seat Removal', category: 'Detailing', prices: { small: 6000, medium: 7500, large: 8000, xl: 10000, xxl: 12000 }, description: 'Remove seats/carpet, shampooing, steam sterilization, interior detailing, BAC To Zero' },
  { id: 'headlight-basic', name: 'Headlight Restoration Without Ceramic Coating (each light)', category: 'Headlight Restoration', prices: { small: 1000 }, description: 'Sanding and buffing; 3–4 hours' },
  { id: 'headlight-ceramic', name: 'Headlight Restoration With Ceramic Coating (each light)', category: 'Headlight Restoration', prices: { small: 1500 }, description: 'Sanding, buffing and ceramic coating; 3–4 hours' },
];

export const SERVICE_CATALOG: CatalogItem[] = [
  ...CAR_WASH_PACKAGES,
  ...PREMIUM_PACKAGES,
  ...INDIVIDUAL_SERVICES,
  ...DETAILING_SERVICES,
  ...MOTORCYCLE_SERVICES,
];

export const VEHICLE_SIZES: { id: VehicleSize; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
  { id: 'xl', label: 'XL' },
  { id: 'xxl', label: 'XXL' },
];

export function getPrice(item: CatalogItem, vehicleType: VehicleType, vehicleSize: VehicleSize): number {
  if (vehicleType === 'motorcycle') return item.motorcyclePrice ?? 0;
  return item.prices?.[vehicleSize] ?? 0;
}
