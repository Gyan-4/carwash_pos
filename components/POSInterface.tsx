'use client';

import { useState } from 'react';
import { Search, Bike, Car, Award, Sparkles, Check } from 'lucide-react';

type VehicleType = 'motorcycle' | 'sedan' | 'suv' | 'truck';

interface Vehicle {
  plate: string;
  type: VehicleType;
  model: string;
  stamps: number;
}

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  isDeliveryRider: boolean;
  vehicles: Vehicle[];
}

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  prices: Record<VehicleType, number>;
}

const MOCK_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'c1',
    name: 'Juan Dela Cruz',
    phone: '09171234567',
    isDeliveryRider: false,
    vehicles: [
      { plate: 'FAB 7365', type: 'sedan', model: 'Toyota Vios', stamps: 0 },
      { plate: 'MC-8890', type: 'motorcycle', model: 'Yamaha NMAX', stamps: 10 },
    ],
  },
  {
    id: 'c2',
    name: 'Marco Santos (Grab Rider)',
    phone: '09189876543',
    isDeliveryRider: true,
    vehicles: [
      { plate: 'MC-4521', type: 'motorcycle', model: 'Honda Click', stamps: 2 },
    ],
  },
];

const SERVICES: ServiceItem[] = [
  { id: '1', name: 'Package 1: Express Wash', category: 'Packages', prices: { motorcycle: 80, sedan: 150, suv: 200, truck: 250 } },
  { id: '2', name: 'Package 2: Wash & Interior Vacuum', category: 'Packages', prices: { motorcycle: 150, sedan: 300, suv: 380, truck: 450 } },
  { id: '3', name: 'Package 3: Wash, Interior & Hand Wax', category: 'Packages', prices: { motorcycle: 250, sedan: 550, suv: 700, truck: 850 } },
  { id: '4', name: 'Engine Bay Cleaning', category: 'Detailing', prices: { motorcycle: 150, sedan: 450, suv: 550, truck: 650 } },
  { id: '5', name: 'Graphene Coating', category: 'Special', prices: { motorcycle: 10000, sedan: 10000, suv: 10000, truck: 10000 } },
  { id: '6', name: 'Helmet / Cabin Sanitizer', category: 'Add-on', prices: { motorcycle: 50, sedan: 100, suv: 150, truck: 150 } },
];

export default function POSInterface() {
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [manualPlate, setManualPlate] = useState('');
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);

  const searchResults = customerSearch.trim()
    ? MOCK_CUSTOMERS.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.vehicles.some((v) => v.plate.toLowerCase().includes(customerSearch.toLowerCase()))
      )
    : [];

  const handleSelectCustomer = (customer: CustomerProfile, vehicle?: Vehicle) => {
    setSelectedCustomer(customer);
    const targetVehicle = vehicle || customer.vehicles[0];
    setSelectedVehicle(targetVehicle);
    setManualPlate(targetVehicle.plate);
    setCustomerSearch('');
  };

  const toggleService = (service: ServiceItem) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      }
      return [...prev, service];
    });
  };

  const activeVehicleType: VehicleType = selectedVehicle?.type || 'sedan';
  const activeStamps = selectedVehicle?.stamps || 0;
  const isRider = selectedCustomer?.isDeliveryRider || false;

  const subtotal = selectedServices.reduce(
    (acc, service) => acc + service.prices[activeVehicleType],
    0
  );

  let discount = 0;
  let promoTag = '';

  if (isRider) {
    discount = subtotal * 0.20;
    promoTag = 'Delivery Rider Discount (-20%)';
  } else if (activeStamps === 4) {
    const pkgSubtotal = selectedServices
      .filter((s) => s.id === '1' || s.id === '2' || s.id === '3')
      .reduce((acc, s) => acc + s.prices[activeVehicleType], 0);

    if (pkgSubtotal > 0) {
      discount = pkgSubtotal * 0.30;
      promoTag = '5th Stamp Promo (30% Off Package)';
    }
  } else if (activeStamps === 10) {
    const pkg2 = selectedServices.find((s) => s.id === '2');
    if (pkg2) {
      discount = pkg2.prices[activeVehicleType];
      promoTag = '11th Stamp Promo (FREE Package 2)';
    }
  }

  const total = Math.max(0, subtotal - discount);

  return (
    <div className="w-full h-full flex gap-4 p-4 overflow-hidden">
      {/* Catalog & Search Area */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Client Name or Plate Number (e.g. Juan or ABC-1234)..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-11 bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
              {searchResults.map((cust) => (
                <div key={cust.id} className="p-3 hover:bg-slate-50 transition">
                  <div className="font-bold text-xs text-slate-800">{cust.name} ({cust.phone})</div>
                  <div className="flex gap-2 mt-1.5">
                    {cust.vehicles.map((v) => (
                      <button
                        key={v.plate}
                        onClick={() => handleSelectCustomer(cust, v)}
                        className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-blue-200"
                      >
                        {v.type === 'motorcycle' ? <Bike className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                        {v.plate} ({v.stamps} stamps)
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Customer Banner */}
        {selectedCustomer && (
          <div className="bg-blue-600 text-white p-3.5 rounded-xl shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
                  Active Client
                </span>
                <h2 className="text-xs font-extrabold mt-1">{selectedCustomer.name}</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setSelectedVehicle(null);
                  setManualPlate('');
                }}
                className="text-[11px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition font-medium"
              >
                Clear
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              {selectedCustomer.vehicles.map((v) => {
                const active = selectedVehicle?.plate === v.plate;
                return (
                  <button
                    key={v.plate}
                    onClick={() => {
                      setSelectedVehicle(v);
                      setManualPlate(v.plate);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                      active
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {v.type === 'motorcycle' ? <Bike className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                    <span>{v.plate}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Services Catalog */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Available Services ({activeVehicleType.toUpperCase()})
          </div>

          <div className="grid grid-cols-3 gap-3">
            {SERVICES.map((service) => {
              const price = service.prices[activeVehicleType];
              const isSelected = selectedServices.some((s) => s.id === service.id);

              return (
                <div
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`border rounded-xl p-3.5 flex flex-col justify-between h-28 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
                      {service.category}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition ${
                        isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-800 leading-snug">{service.name}</h3>
                    <div className="text-xs font-extrabold text-slate-900 font-mono mt-1">
                      ₱{price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Receipt Panel */}
      <div className="w-80 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden shrink-0 h-full">
        <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Order Receipt</h2>
            {selectedServices.length > 0 && (
              <button 
                onClick={() => setSelectedServices([])} 
                className="text-slate-400 hover:text-rose-500 text-[11px] font-semibold transition"
              >
                Clear
              </button>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
              Vehicle Plate Number
            </label>
            <input
              type="text"
              placeholder="ENTER PLATE NO."
              value={manualPlate}
              onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-mono font-bold tracking-wider uppercase text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                <Award className="w-3 h-3 text-blue-600" /> Plate Stamp Card
              </span>
              <span className="text-xs font-bold text-blue-600 font-mono">{activeStamps} / 11</span>
            </div>

            <div className="flex justify-between gap-1">
              {Array.from({ length: 11 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-1.5 rounded-full transition ${
                    idx < activeStamps
                      ? idx === 4 || idx === 10
                        ? 'bg-amber-400'
                        : 'bg-blue-600'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Selected Services Container */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {selectedServices.length === 0 ? (
            <div className="text-center text-slate-400 text-xs py-12">
              Tap services on the left to select
            </div>
          ) : (
            selectedServices.map((service) => {
              const price = service.prices[activeVehicleType];
              return (
                <div
                  key={service.id}
                  className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{service.name}</div>
                    <div className="text-[9px] text-blue-600 font-semibold uppercase">{service.category}</div>
                  </div>
                  <span className="font-extrabold text-slate-900 font-mono ml-2">
                    ₱{price.toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Calculations Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-2 shrink-0">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span className="font-mono">₱{subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-xs text-amber-600 font-bold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {promoTag}
              </span>
              <span className="font-mono">-₱{discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-extrabold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Payable</span>
            <span className="text-blue-600 font-mono text-sm">₱{total.toFixed(2)}</span>
          </div>

          <button
            disabled={selectedServices.length === 0 || !manualPlate}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 rounded-lg transition text-xs shadow-sm mt-1"
          >
            Complete Order (+1 Stamp for {manualPlate || 'Vehicle'})
          </button>
        </div>
      </div>
    </div>
  );
}