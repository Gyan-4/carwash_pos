'use client';

import { useState } from 'react';
import { 
  Search, 
  Car, 
  Bike, 
  Sparkles, 
  Plus, 
  Trash2, 
  Award, 
  ShieldCheck, 
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import PaymentModal from './PaymentModal';

type VehicleType = 'sedan' | 'suv' | 'pickup' | 'van' | 'motorcycle';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  prices: Record<VehicleType, number>;
  description: string;
}

const SERVICES: ServiceItem[] = [
  {
    id: 'pkg-1',
    name: 'Package 1: Express Wash',
    category: 'Basic Care',
    prices: { sedan: 150, suv: 180, pickup: 200, van: 220, motorcycle: 80 },
    description: 'Exterior pressure wash, foam soap, micro-fiber dry, tire black.'
  },
  {
    id: 'pkg-2',
    name: 'Package 2: Wash & Interior Vacuum',
    category: 'Standard Care',
    prices: { sedan: 300, suv: 350, pickup: 380, van: 420, motorcycle: 120 },
    description: 'Express wash + interior vacuuming, dashboard wipe down, and air freshener.'
  },
  {
    id: 'pkg-3',
    name: 'Package 3: Wash, Interior & Hand Wax',
    category: 'Full Service',
    prices: { sedan: 550, suv: 650, pickup: 700, van: 750, motorcycle: 250 },
    description: 'Full interior vacuum, hand paste wax application, glass clarity polish.'
  },
  {
    id: 'pkg-4',
    name: 'Graphene Coating Campaign',
    category: 'Premium Detailing',
    prices: { sedan: 10000, suv: 11500, pickup: 12000, van: 12500, motorcycle: 4500 },
    description: '3-year paint protection nano graphene layer with scratch resistance.'
  }
];

const ADDONS = [
  { id: 'add-1', name: 'Helmet Sanitizer & Deodorize', price: 100, target: 'motorcycle' },
  { id: 'add-2', name: 'Engine Bay Wash & Degrease', price: 350, target: 'car' },
  { id: 'add-3', name: 'Underchassis Pressure Scrub', price: 250, target: 'car' },
  { id: 'add-4', name: 'Glass Water Spot Removal', price: 400, target: 'all' },
];

export default function POSInterface() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');
  const [plateInput, setPlateInput] = useState<string>('');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<'none' | 'rider' | 'loyalty'>('none');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Mock Database Match for Plate Search
  const isMatch = plateInput.trim().toUpperCase() === 'FAB 7365' || plateInput.trim().toUpperCase() === 'FAB7365';
  const customerProfile = isMatch ? {
    name: 'Juan Dela Cruz',
    model: 'Toyota Vios • White',
    lastVisit: 'Aug 29, 2026',
    totalVisits: 14,
    stamps: 7,
    maxStamps: 11
  } : null;

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Base Calculation Logic
  const servicePrice = selectedService ? selectedService.prices[vehicleType] : 0;
  const addonsTotal = selectedAddons.reduce((sum, addonId) => {
    const item = ADDONS.find(a => a.id === addonId);
    return sum + (item ? item.price : 0);
  }, 0);

  const subtotal = servicePrice + addonsTotal;

  let discountAmount = 0;
  if (discountType === 'rider') {
    discountAmount = subtotal * 0.20; // 20% Rider Discount
  } else if (discountType === 'loyalty') {
    discountAmount = Math.min(subtotal, 150); // Free Express Wash Credit
  }

  const grandTotal = Math.max(0, subtotal - discountAmount);

  const handleOpenPayment = () => {
    if (!plateInput.trim()) {
      setErrorMessage('Vehicle Plate Number is required before starting transaction.');
      return;
    }
    if (!selectedService) {
      setErrorMessage('Please select a main carwash package.');
      return;
    }
    setErrorMessage('');
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentDetails: any) => {
    setShowPaymentModal(false);
    alert(`Order completed successfully via ${paymentDetails.method.toUpperCase()}! Queue ticket generated.`);
    // Reset state after checkout
    setSelectedService(null);
    setSelectedAddons([]);
    setPlateInput('');
    setDiscountType('none');
  };

  return (
    <div className="flex h-full w-full bg-slate-100 overflow-hidden font-sans select-none">
      {/* Left Main Interface: Service Selection & Lookup */}
      <div className="flex-1 flex flex-col h-full p-5 space-y-4 overflow-y-auto">
        {/* Top Control Bar: Search & Vehicle Type Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Plate Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Enter Vehicle Plate Number (e.g., FAB 7365)..."
              value={plateInput}
              onChange={(e) => {
                setPlateInput(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold font-mono text-slate-800 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm uppercase"
            />
          </div>

          {/* Vehicle Type Dropdown */}
          <div className="relative">
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-2xl py-3 px-4 text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
            >
              <option value="sedan">Vehicle: Sedan / Hatchback</option>
              <option value="suv">Vehicle: SUV / Crossover</option>
              <option value="pickup">Vehicle: Pickup Truck</option>
              <option value="van">Vehicle: Passenger Van</option>
              <option value="motorcycle">Vehicle: Motorcycle / Scooter</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        {/* Validation Warning Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Customer & Vehicle Lookup Panel */}
        {customerProfile ? (
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-blue-600 px-2 py-0.5 rounded">
                    {plateInput.toUpperCase()}
                  </span>
                  <span className="text-xs font-extrabold text-slate-100">{customerProfile.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{customerProfile.model}</p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/20">
                Registered Member
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center">
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Last Service</span>
                <span className="text-xs font-extrabold text-slate-200">{customerProfile.lastVisit}</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Visits</span>
                <span className="text-xs font-extrabold text-slate-200">{customerProfile.totalVisits} Times</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Stamp Status</span>
                <span className="text-xs font-extrabold text-amber-400">{customerProfile.stamps} / {customerProfile.maxStamps} Stamps</span>
              </div>
            </div>
          </div>
        ) : plateInput.trim().length >= 3 && (
          <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-2xl flex justify-between items-center text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-800">New Plate Registration</span>
                <p className="text-[11px] text-slate-500">{plateInput.toUpperCase()} will be assigned a new stamp card upon checkout.</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Service Packages */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Carwash Packages ({vehicleType.toUpperCase()})
            </h2>
            <span className="text-[10px] text-slate-400 font-bold">Select 1 primary package</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICES.map((pkg) => {
              const isSelected = selectedService?.id === pkg.id;
              const price = pkg.prices[vehicleType];

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedService(pkg)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-white border-slate-200/80 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {pkg.category}
                      </span>
                      <h3 className="text-xs font-extrabold mt-1.5">{pkg.name}</h3>
                    </div>
                    <span className={`text-base font-black font-mono ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      ₱{price.toFixed(2)}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {pkg.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add-on Upgrades */}
        <div className="space-y-2 pt-2">
          <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Available Service Add-ons
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {ADDONS.map((addon) => {
              const isChecked = selectedAddons.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                    isChecked
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[11px] font-bold leading-tight">{addon.name}</span>
                  <span className={`text-xs font-black font-mono ${isChecked ? 'text-emerald-400' : 'text-slate-900'}`}>
                    +₱{addon.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Order Summary Drawer */}
      <div className="w-96 bg-white border-l border-slate-200/80 flex flex-col justify-between shrink-0 h-full">
        {/* Terminal Order Header */}
        <div className="p-4 border-b border-slate-100 space-y-1">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-800">Order Terminal</h2>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              #TX-{Math.floor(1000 + Math.random() * 9000)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Review selected services and discounts</p>
        </div>

        {/* Selected Items List */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {selectedService ? (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
              <div>
                <span className="font-extrabold text-slate-800 block">{selectedService.name}</span>
                <span className="text-[10px] text-slate-400 capitalize">{vehicleType} Package</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                ₱{selectedService.prices[vehicleType].toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No main package selected yet.
            </div>
          )}

          {selectedAddons.map((addonId) => {
            const addon = ADDONS.find(a => a.id === addonId);
            if (!addon) return null;
            return (
              <div key={addon.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 text-[11px]">{addon.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">₱{addon.price.toFixed(2)}</span>
                  <button onClick={() => toggleAddon(addon.id)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Discounts & Promos Section */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Apply Promotions</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType(discountType === 'rider' ? 'none' : 'rider')}
                className={`p-2 rounded-xl text-[10px] font-extrabold border transition flex items-center justify-center gap-1 ${
                  discountType === 'rider'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Bike className="w-3 h-3" /> Rider (-20%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType(discountType === 'loyalty' ? 'none' : 'loyalty')}
                className={`p-2 rounded-xl text-[10px] font-extrabold border transition flex items-center justify-center gap-1 ${
                  discountType === 'loyalty'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Award className="w-3 h-3" /> Loyalty Reward
              </button>
            </div>
          </div>
        </div>

        {/* Total Calculation & Checkout Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-slate-800">₱{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Discount</span>
                <span className="font-mono">-₱{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Due</span>
              <span className="font-mono text-blue-600 text-base">₱{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleOpenPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl text-xs transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Process Payment & Queue
          </button>
        </div>
      </div>

      {/* Payment Processing Modal */}
      {showPaymentModal && (
        <PaymentModal
          totalAmount={grandTotal}
          onClose={() => setShowPaymentModal(false)}
          onComplete={handlePaymentSuccess}
        />
      )}
    </div>
  );
}