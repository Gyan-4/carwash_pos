'use client';

import { useEffect, useMemo, useState } from 'react';
import { Car, Check, CircleDollarSign, Printer, Search, UserRound, X } from 'lucide-react';
import { conflictsWithSelection, findPackageUpgrade, getPrice, hasPrice, packageContainsSelection, SERVICE_CATALOG, VEHICLE_SIZES, type CatalogItem, type VehicleSize, type VehicleType } from '@/lib/serviceCatalog';

type CustomerVehicle = { plate: string; vehicleType: string; vehicleSize?: string; visitCount: number; lastVisitAt?: string };
type CustomerMatch = { _id: string; name: string; vehicles: CustomerVehicle[]; totalVisits: number };
type PaymentMethod = 'cash' | 'gcash' | 'card';
type Promo = { _id: string; name: string; description?: string; discountType: 'percentage' | 'fixed'; discountValue: number; eligibleVehicleTypes?: string[]; eligibleVehicleSizes?: string[]; eligiblePlatforms?: string[]; requiresVerification?: boolean; active: boolean };
type ReceiptData = { transactionNo: string; customerName: string; plate: string; vehicleType: string; vehicleSize?: string; services: { name: string; price: number }[]; subtotal: number; discount: number; total: number; paymentMethod: PaymentMethod; amountPaid: number; change: number; promoName?: string; createdAt: string };

const RIDER_PLATFORMS = ['Grab', 'Foodpanda', 'JoyRide', 'Maxim', 'inDrive', 'SPX Express', 'J&T Express'];

export default function POSInterface() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>('medium');
  const [plate, setPlate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMatch, setCustomerMatch] = useState<CustomerMatch | null>(null);
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState<CatalogItem[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [riderPlatform, setRiderPlatform] = useState('');
  const [promoVerification, setPromoVerification] = useState(false);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [promoLoadError, setPromoLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const loadPromos = async () => {
    setLoadingPromos(true);
    setPromoLoadError('');
    try {
      const response = await fetch('/api/promos', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.error || `Unable to load promos (${response.status}).`);
      }
      const activePromos = Array.isArray(data.promos)
        ? data.promos.filter((promo: Promo) => promo.active !== false)
        : [];
      setPromos(activePromos);
    } catch (error) {
      setPromos([]);
      setPromoLoadError(error instanceof Error ? error.message : 'Unable to load promos.');
    } finally {
      setLoadingPromos(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, []);

  useEffect(() => {
    const normalizedPlate = plate.trim().toUpperCase();
    if (!normalizedPlate) {
      setCustomerMatch(null);
      setLookingUpCustomer(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLookingUpCustomer(true);
      try {
        const response = await fetch(`/api/customers?q=${encodeURIComponent(normalizedPlate)}`, { cache: 'no-store' });
        const data = await response.json();
        if (cancelled) return;
        const match = (data.customers || []).find((customer: CustomerMatch) => customer.vehicles?.some((vehicle) => vehicle.plate.toUpperCase() === normalizedPlate)) as CustomerMatch | undefined;
        setCustomerMatch(match || null);
        if (match) {
          setCustomerName(match.name === 'Walk-in Customer' ? '' : match.name);
          const vehicle = match.vehicles.find((item) => item.plate.toUpperCase() === normalizedPlate);
          if (vehicle?.vehicleType) setVehicleType(vehicle.vehicleType as VehicleType);
          if (vehicle?.vehicleSize && vehicle.vehicleType !== 'motorcycle') setVehicleSize(vehicle.vehicleSize as VehicleSize);
        }
      } catch {
        if (!cancelled) setCustomerMatch(null);
      } finally {
        if (!cancelled) setLookingUpCustomer(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [plate]);

  const services = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SERVICE_CATALOG.filter((service) => {
      const correctVehicle = vehicleType === 'motorcycle' ? service.category === 'Motorcycle' : service.category !== 'Motorcycle' && hasPrice(service, vehicleType, vehicleSize);
      return correctVehicle && (!q || service.name.toLowerCase().includes(q) || service.category.toLowerCase().includes(q)) && getPrice(service, vehicleType, vehicleSize) > 0;
    });
  }, [search, vehicleType, vehicleSize]);

  const groupedServices = useMemo(() => services.reduce<Record<string, CatalogItem[]>>((groups, service) => {
    (groups[service.category] ||= []).push(service);
    return groups;
  }, {}), [services]);

  const orderItems = useMemo(() => selectedServices.map((service) => ({ service, available: hasPrice(service, vehicleType, vehicleSize), price: getPrice(service, vehicleType, vehicleSize) })), [selectedServices, vehicleType, vehicleSize]);
  const subtotal = orderItems.reduce((sum, item) => sum + (item.available ? item.price : 0), 0);
  const hasUnavailableItems = orderItems.some((item) => !item.available);

  // IMPORTANT: vehicle/size determine visibility. Platform and verification are checked after selection.
  const eligiblePromos = useMemo(() => promos.filter((promo) => {
    const vehicleAllowed = !promo.eligibleVehicleTypes?.length || promo.eligibleVehicleTypes.includes(vehicleType);
    const sizeAllowed = vehicleType === 'motorcycle' || !promo.eligibleVehicleSizes?.length || promo.eligibleVehicleSizes.includes(vehicleSize);
    return vehicleAllowed && sizeAllowed;
  }), [promos, vehicleType, vehicleSize]);

  const selectedPromoVehicleAllowed = useMemo(() => {
    if (!selectedPromo) return true;
    const vehicleAllowed = !selectedPromo.eligibleVehicleTypes?.length || selectedPromo.eligibleVehicleTypes.includes(vehicleType);
    const sizeAllowed = vehicleType === 'motorcycle' || !selectedPromo.eligibleVehicleSizes?.length || selectedPromo.eligibleVehicleSizes.includes(vehicleSize);
    return vehicleAllowed && sizeAllowed;
  }, [selectedPromo, vehicleType, vehicleSize]);

  const promoRequirementsMet = useMemo(() => {
    if (!selectedPromo || !selectedPromoVehicleAllowed) return false;
    const platformRequired = Boolean(selectedPromo.eligiblePlatforms?.length);
    const platformMet = !platformRequired || Boolean(riderPlatform && selectedPromo.eligiblePlatforms?.includes(riderPlatform));
    const verificationMet = !selectedPromo.requiresVerification || promoVerification;
    return platformMet && verificationMet;
  }, [selectedPromo, selectedPromoVehicleAllowed, riderPlatform, promoVerification]);

  useEffect(() => {
    if (selectedPromo && !selectedPromoVehicleAllowed) {
      setSelectedPromo(null);
      setRiderPlatform('');
      setPromoVerification(false);
    }
  }, [selectedPromoVehicleAllowed, selectedPromo]);

  const discount = useMemo(() => {
    if (!selectedPromo || !promoRequirementsMet) return 0;
    return selectedPromo.discountType === 'percentage'
      ? Math.min(subtotal, subtotal * (Number(selectedPromo.discountValue) / 100))
      : Math.min(subtotal, Number(selectedPromo.discountValue));
  }, [subtotal, selectedPromo, promoRequirementsMet]);

  const total = Math.max(0, subtotal - discount);
  const paidNumber = Number(amountPaid) || 0;
  const change = Math.max(0, paidNumber - total);
  const paymentValid = total > 0 && paidNumber >= total;

  const changeVehicleType = (type: VehicleType) => { setVehicleType(type); setSelectedPromo(null); setRiderPlatform(''); setPromoVerification(false); setMessage(''); };
  const changeVehicleSize = (size: VehicleSize) => { setVehicleSize(size); setSelectedPromo(null); setRiderPlatform(''); setPromoVerification(false); setMessage(''); };

  const toggleService = (service: CatalogItem) => {
    if (selectedServices.some((item) => item.id === service.id)) {
      setSelectedServices((current) => current.filter((item) => item.id !== service.id));
      setMessage('');
      return;
    }
    const isPackage = ['Car Wash Packages', 'Premium Wash', 'Motorcycle'].includes(service.category);
    const selectedPackages = selectedServices.filter((item) => ['Car Wash Packages', 'Premium Wash', 'Motorcycle'].includes(item.category));
    if (isPackage) {
      const withoutPackages = selectedServices.filter((item) => !selectedPackages.some((pkg) => pkg.id === item.id));
      const packageComponents = new Set(service.components ?? []);
      const keptExtras = withoutPackages.filter((item) => !item.components?.length || !item.components.some((component) => packageComponents.has(component)));
      setSelectedServices([...keptExtras, service]);
      setMessage(`Package selected: ${service.name}.`);
      return;
    }
    const upgrade = findPackageUpgrade([...selectedServices, service], vehicleType, vehicleSize);
    if (upgrade) {
      const upgradeComponents = new Set(upgrade.components ?? []);
      const replaced = selectedServices.filter((item) => !item.components?.length || !item.components.some((component) => upgradeComponents.has(component)));
      setSelectedServices([...replaced, upgrade]);
      setMessage(`Package selected: ${upgrade.name}.`);
      return;
    }
    const selectedPackage = selectedServices.find((item) => ['Car Wash Packages', 'Premium Wash', 'Motorcycle'].includes(item.category) && packageContainsSelection(item, [service]));
    if (selectedPackage) {
      setMessage(`${service.name} is already included in ${selectedPackage.name}.`);
      return;
    }
    setSelectedServices((current) => [...current, service]);
    setMessage('');
  };

  const selectPromo = (id: string) => {
    const promo = promos.find((item) => item._id === id) || null;
    setSelectedPromo(promo);
    setRiderPlatform('');
    setPromoVerification(false);
    if (promo) {
      const vehicleAllowed = !promo.eligibleVehicleTypes?.length || promo.eligibleVehicleTypes.includes(vehicleType);
      const sizeAllowed = vehicleType === 'motorcycle' || !promo.eligibleVehicleSizes?.length || promo.eligibleVehicleSizes.includes(vehicleSize);
      if (!vehicleAllowed || !sizeAllowed) {
        setMessage('This promotion is not eligible for the selected vehicle.');
      } else {
        setMessage('Promo selected. Complete any required platform or verification step.');
      }
    } else {
      setMessage('');
    }
  };

  const openPayment = () => {
    if (!plate.trim() || selectedServices.length === 0 || hasUnavailableItems) return;
    if (selectedPromo && !promoRequirementsMet) {
      setMessage('Complete the selected promo requirements before payment.');
      return;
    }
    setPaymentMethod('cash');
    setAmountPaid('');
    setPaymentOpen(true);
  };

  async function completeOrder() {
    if (!plate.trim() || selectedServices.length === 0 || saving || hasUnavailableItems || !paymentValid || (selectedPromo && !promoRequirementsMet)) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate, customerName: customerName.trim(), vehicleType,
          vehicleSize: vehicleType === 'motorcycle' ? undefined : vehicleSize,
          services: selectedServices.map((service) => ({ id: service.id, name: service.name, category: service.category, price: getPrice(service, vehicleType, vehicleSize) })),
          subtotal, discount, total, promoId: selectedPromo?._id || undefined, promoName: selectedPromo?.name || undefined,
          paymentMethod, amountPaid: paidNumber, riderPlatform: riderPlatform || undefined,
          promoVerified: selectedPromo?.requiresVerification ? promoVerification : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save transaction.');
      const saved = data.transaction;
      setReceipt({ transactionNo: saved.transactionNo, customerName: customerName.trim() || 'Walk-in Customer', plate: String(plate).trim().toUpperCase(), vehicleType, vehicleSize: vehicleType === 'motorcycle' ? undefined : vehicleSize, services: selectedServices.map((service) => ({ name: service.name, price: getPrice(service, vehicleType, vehicleSize) })), subtotal, discount, total, paymentMethod, amountPaid: paidNumber, change, promoName: selectedPromo?.name, createdAt: saved.createdAt || new Date().toISOString() });
      setPaymentOpen(false); setPlate(''); setCustomerName(''); setCustomerMatch(null); setSelectedServices([]); setSelectedPromo(null); setRiderPlatform(''); setPromoVerification(false); setAmountPaid('');
      setMessage(`Transaction ${saved.transactionNo} completed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save transaction.');
    } finally { setSaving(false); }
  }

  const printReceipt = () => {
    if (!receipt) return;
    const rows = receipt.services.map((service) => `<tr><td>${service.name}</td><td style="text-align:right">₱${service.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td></tr>`).join('');
    const html = `<!doctype html><html><head><title>${receipt.transactionNo}</title><style>body{font-family:Arial;width:300px;margin:20px auto;font-size:12px}table{width:100%;border-collapse:collapse}td{padding:4px 0;border-bottom:1px dashed #ddd}.total{font-size:16px;font-weight:800}</style></head><body><h2 style="text-align:center">CARWASH RECEIPT</h2><p style="text-align:center">${receipt.transactionNo}</p><p>Customer: ${receipt.customerName}</p><p>Plate: <b>${receipt.plate}</b></p><p>Vehicle: ${receipt.vehicleType}${receipt.vehicleSize ? ` • ${receipt.vehicleSize}` : ''}</p><table>${rows}</table><p>Subtotal: <span style="float:right">₱${receipt.subtotal.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></p>${receipt.promoName ? `<p>Promo: <span style="float:right">${receipt.promoName}</span></p>` : ''}<p>Discount: <span style="float:right">₱${receipt.discount.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></p><p class="total">TOTAL <span style="float:right">₱${receipt.total.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></p><p>Payment: <span style="float:right">${receipt.paymentMethod.toUpperCase()}</span></p><p>Paid: <span style="float:right">₱${receipt.amountPaid.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></p><p>Change: <span style="float:right">₱${receipt.change.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></p><script>window.onload=()=>window.print();</script></body></html>`;
    const win = window.open('', '_blank', 'width=420,height=700');
    if (!win) { setMessage('Please allow pop-ups to print the receipt.'); return; }
    win.document.write(html); win.document.close();
  };

  return (
    <div className="w-full h-full flex gap-4 p-4 overflow-hidden bg-slate-50/60 text-slate-900">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4"><div><h1 className="text-lg sm:text-xl font-black">POS Terminal</h1><p className="mt-0.5 text-xs text-slate-500">Select the vehicle, customer, and service package.</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50"><Car className="w-5 h-5 text-blue-700" /></div></div>
          <div><div className="mb-2 text-xs font-extrabold uppercase tracking-wider">Vehicle type</div><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{(['motorcycle','sedan','suv','truck'] as VehicleType[]).map((type) => <button key={type} onClick={() => changeVehicleType(type)} className={`rounded-lg border px-3 py-2.5 text-xs font-bold capitalize ${vehicleType === type ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700'}`}>{type}</button>)}</div></div>
          {vehicleType !== 'motorcycle' && <div className="mt-4"><div className="mb-2 text-xs font-extrabold uppercase tracking-wider">Vehicle size</div><div className="grid grid-cols-5 gap-2">{VEHICLE_SIZES.map((size) => <button key={size.id} onClick={() => changeVehicleSize(size.id)} className={`rounded-lg border px-2 py-2.5 text-xs font-bold ${vehicleSize === size.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700'}`}>{size.label}</button>)}</div></div>}
          <div className="mt-4 grid gap-3 md:grid-cols-2"><div><div className="mb-2 text-xs font-extrabold uppercase tracking-wider">Vehicle plate</div><input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="Enter plate number" className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-xs font-bold uppercase" /></div><div><div className="mb-2 text-xs font-extrabold uppercase tracking-wider">Customer name <span className="font-medium normal-case text-slate-400">(optional)</span></div><div className="relative"><UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={customerName} onChange={(e) => { setCustomerName(e.target.value); setCustomerMatch(null); }} placeholder="Customer name" className="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-9 pr-3 text-xs" /></div></div></div>
          {plate.trim() && <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10px]">{lookingUpCustomer ? 'Checking plate...' : customerMatch ? `Existing customer found: ${customerMatch.name}` : 'New plate — enter a customer name if available.'}</div>}
        </div>
        <div><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-sm font-extrabold">Services & Packages</h2><p className="mt-0.5 text-[11px] text-slate-600">Choose one or more services for this order.</p></div><div className="relative w-52"><Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services" className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2 py-2 text-[11px]" /></div></div>
          {Object.entries(groupedServices).map(([category, items]) => <section key={category} className="mb-4"><h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">{category}</h3><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{items.map((service) => { const selected = selectedServices.some((item) => item.id === service.id); const conflict = !selected && conflictsWithSelection(service, selectedServices); const price = getPrice(service, vehicleType, vehicleSize); return <button key={service.id} onClick={() => toggleService(service)} className={`text-left rounded-xl border p-4 min-h-28 ${selected ? 'border-blue-600 bg-blue-50' : conflict ? 'border-slate-200 bg-slate-100 opacity-60' : 'border-slate-300 bg-white'}`}><div className="flex justify-between"><span className="text-[9px] font-extrabold uppercase text-blue-700">{category}</span>{selected && <Check className="w-4 h-4 text-blue-700" />}</div><div className="mt-3 text-xs font-extrabold">{service.name}</div>{service.description && <div className="mt-1 text-[10px] leading-4 text-slate-600">{service.description}</div>}{conflict ? <div className="mt-2 text-[10px] font-semibold text-slate-500">Already covered by current selection</div> : <div className="mt-2 text-sm font-mono font-black">₱{price.toLocaleString('en-PH',{minimumFractionDigits:2})}</div>}</button>; })}</div></section>)}
          {services.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-xs text-slate-600">No services match the current vehicle selection.</div>}
        </div>
      </div>

      <div className="w-80 shrink-0 h-full bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-200"><h2 className="text-sm font-extrabold">Current Order</h2><p className="text-[10px] text-slate-600 mt-1">{customerName || 'Walk-in Customer'} • {plate || 'No plate'}</p><p className="text-[10px] text-slate-500 mt-1">{vehicleType === 'motorcycle' ? 'Motorcycle pricing' : `${vehicleSize.toUpperCase()} vehicle pricing`}</p></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">{orderItems.length === 0 ? <div className="py-12 text-center text-xs text-slate-500">Select services to build the order.</div> : orderItems.map(({ service, available, price }) => <div key={service.id} className={`rounded-lg border p-3 flex justify-between gap-2 ${available ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'}`}><div className="min-w-0"><span className="text-xs font-bold">{service.name}</span>{!available && <div className="mt-1 text-[10px] text-amber-700">Not available for {vehicleType}.</div>}</div><div className="flex items-start gap-2"><span className="text-xs font-mono font-bold">{available ? `₱${price.toLocaleString('en-PH',{minimumFractionDigits:2})}` : '—'}</span><button onClick={() => toggleService(service)} className="text-slate-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button></div></div>)}</div>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-xs font-extrabold">Promo / Discount</h3><div className="flex items-center gap-2">{loadingPromos && <span className="text-[9px] text-slate-400">Loading...</span>}<button onClick={loadPromos} disabled={loadingPromos} className="text-[9px] font-bold text-blue-600 disabled:text-slate-400">Refresh</button></div></div>
          <select value={selectedPromo?._id || ''} onChange={(e) => selectPromo(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[11px] font-bold text-slate-800">
            <option value="">No promo</option>
            {eligiblePromos.map((promo) => <option key={promo._id} value={promo._id}>{promo.name} — {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `₱${Number(promo.discountValue).toLocaleString()} OFF`}</option>)}
          </select>
          {promoLoadError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700">{promoLoadError}</div>}
          {!promoLoadError && promos.length === 0 && !loadingPromos && <p className="text-[10px] text-slate-500">No active promos found. Create/activate one in Manager → Promos & Discounts.</p>}
          {promos.length > 0 && eligiblePromos.length === 0 && <p className="text-[10px] text-amber-700">Active promos exist, but none match this vehicle/size.</p>}
          {selectedPromo && <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2"><div className="text-[11px] font-extrabold text-blue-900">{selectedPromo.name}</div>{selectedPromo.description && <div className="text-[10px] leading-4 text-blue-700">{selectedPromo.description}</div>}
            {selectedPromo.eligiblePlatforms?.length ? <select value={riderPlatform} onChange={(e) => setRiderPlatform(e.target.value)} className="w-full rounded-lg border border-blue-200 bg-white px-2.5 py-2 text-[10px] font-bold"><option value="">Select rider platform</option>{RIDER_PLATFORMS.filter((platform) => selectedPromo.eligiblePlatforms?.includes(platform)).map((platform) => <option key={platform} value={platform}>{platform}</option>)}</select> : null}
            {selectedPromo.requiresVerification && <label className="flex items-center gap-2 text-[10px] font-bold text-blue-900"><input type="checkbox" checked={promoVerification} onChange={(e) => setPromoVerification(e.target.checked)} /> Rider/driver eligibility verified</label>}
            {!promoRequirementsMet && <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] font-bold text-amber-800">Complete the promo requirements above to apply the discount.</div>}
            {promoRequirementsMet && <div className="text-[10px] font-bold text-green-700">Promo requirements satisfied — discount applied.</div>}
          </div>}
          <div className="flex justify-between text-xs text-slate-600"><span>Subtotal</span><span className="font-mono">₱{subtotal.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div>
          {discount > 0 && <div className="flex justify-between text-xs font-bold text-green-700"><span>Discount{selectedPromo ? ` (${selectedPromo.name})` : ''}</span><span className="font-mono">-₱{discount.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div>}
          <div className="flex justify-between text-sm font-black"><span>Total</span><span className="text-blue-700 font-mono">₱{total.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div>
          {hasUnavailableItems && <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[10px] text-amber-800">Remove unavailable services before payment.</div>}
          {message && <div className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-[10px] text-slate-700">{message}</div>}
          <button onClick={openPayment} disabled={!plate.trim() || selectedServices.length === 0 || saving || hasUnavailableItems} className="w-full rounded-lg bg-blue-600 py-3 text-xs font-extrabold text-white disabled:bg-slate-300 flex items-center justify-center gap-2"><CircleDollarSign className="w-4 h-4" />Proceed to Payment</button>
        </div>
      </div>

      {paymentOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-base font-black">Confirm Payment</h2><p className="mt-1 text-[11px] text-slate-500">Review the order before completing the sale.</p></div><button onClick={() => setPaymentOpen(false)}><X className="h-4 w-4" /></button></div><div className="p-5 space-y-4"><div className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between text-xs"><span>Customer</span><b>{customerName || 'Walk-in Customer'}</b></div><div className="mt-1 flex justify-between text-xs"><span>Plate</span><b>{plate.toUpperCase()}</b></div><div className="mt-3 border-t border-slate-200 pt-3 space-y-1">{orderItems.map((item) => <div key={item.service.id} className="flex justify-between text-xs"><span>{item.service.name}</span><span>₱{item.price.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div>)}<div className="mt-2 flex justify-between border-t border-slate-300 pt-2 text-xs"><span>Subtotal</span><span>₱{subtotal.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div>{discount > 0 && <div className="flex justify-between text-xs font-bold text-green-700"><span>Discount</span><span>-₱{discount.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div>}<div className="mt-2 flex justify-between border-t border-slate-300 pt-2 text-base font-black"><span>Total</span><span>₱{total.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div></div></div><div><div className="mb-2 text-xs font-extrabold">Payment method</div><div className="grid grid-cols-3 gap-2">{(['cash','gcash','card'] as PaymentMethod[]).map((method) => <button key={method} onClick={() => { setPaymentMethod(method); setAmountPaid(method === 'cash' ? '' : String(total)); }} className={`rounded-xl border px-3 py-3 text-xs font-bold uppercase ${paymentMethod === method ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300'}`}>{method}</button>)}</div></div><div><div className="mb-2 flex justify-between text-xs font-extrabold"><span>{paymentMethod === 'cash' ? 'Cash received' : 'Amount paid'}</span>{paymentMethod === 'cash' && <span className="font-medium text-slate-500">Change ₱{change.toLocaleString('en-PH',{minimumFractionDigits:2})}</span>}</div><input autoFocus type="number" min="0" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0.00" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-right text-lg font-black" /></div>{paidNumber < total && <div className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">Payment is ₱{(total-paidNumber).toLocaleString('en-PH',{minimumFractionDigits:2})} short.</div>}<div className="flex gap-2"><button onClick={() => setPaymentOpen(false)} className="flex-1 rounded-xl border py-3 text-xs font-bold">Back</button><button onClick={completeOrder} disabled={!paymentValid || saving} className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white disabled:bg-slate-300">{saving ? 'Processing...' : 'Confirm & Complete'}</button></div></div></div></div>}

      {receipt && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-sm rounded-2xl bg-white shadow-xl"><div className="border-b border-slate-200 p-5 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-600"><Check className="h-6 w-6" /></div><h2 className="mt-3 text-base font-black">Payment Complete</h2><p className="mt-1 text-xs text-slate-500">{receipt.transactionNo}</p></div><div className="p-5"><div className="rounded-xl bg-slate-50 p-4 space-y-2 text-xs"><div className="flex justify-between"><span>Customer</span><b>{receipt.customerName}</b></div><div className="flex justify-between"><span>Plate</span><b>{receipt.plate}</b></div><div className="flex justify-between"><span>Subtotal</span><b>₱{receipt.subtotal.toLocaleString('en-PH',{minimumFractionDigits:2})}</b></div>{receipt.promoName && <div className="flex justify-between text-green-700"><span>{receipt.promoName}</span><b>-₱{receipt.discount.toLocaleString('en-PH',{minimumFractionDigits:2})}</b></div>}<div className="flex justify-between font-black"><span>Total</span><b>₱{receipt.total.toLocaleString('en-PH',{minimumFractionDigits:2})}</b></div><div className="flex justify-between"><span>Paid ({receipt.paymentMethod.toUpperCase()})</span><b>₱{receipt.amountPaid.toLocaleString('en-PH',{minimumFractionDigits:2})}</b></div><div className="flex justify-between font-black text-green-700"><span>Change</span><b>₱{receipt.change.toLocaleString('en-PH',{minimumFractionDigits:2})}</b></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={printReceipt} className="rounded-xl border py-3 text-xs font-extrabold flex items-center justify-center gap-2"><Printer className="h-4 w-4" />Print Receipt</button><button onClick={() => setReceipt(null)} className="rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white">New Order</button></div></div></div></div>}
    </div>
  );
}
