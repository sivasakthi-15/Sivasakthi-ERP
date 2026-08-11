import { Product, Customer, Supplier } from '../types';

// Sivasakthi Electricals Products (Shop ID: sivasakthi_elec)
const generateProducts = (): Product[] => {
  const list: Product[] = [];
  let idCounter = 1;

  // Let's define the items we want to generate:
  // 1. Wires & Cables (Finolex, Polycab, Havells)
  const wireBrands = ['Finolex', 'Polycab', 'Havells'];
  const wireSizes = ['0.75 Sqmm', '1.0 Sqmm', '1.5 Sqmm', '2.5 Sqmm', '4.0 Sqmm', '6.0 Sqmm'];
  const wireColors = ['Red', 'Black', 'Green', 'Blue', 'Yellow'];
  const wirePriceMap: Record<string, number> = {
    '0.75 Sqmm': 850,
    '1.0 Sqmm': 1150,
    '1.5 Sqmm': 1650,
    '2.5 Sqmm': 2450,
    '4.0 Sqmm': 3800,
    '6.0 Sqmm': 5500
  };
  wireBrands.forEach(brand => {
    wireSizes.forEach(size => {
      wireColors.forEach(color => {
        const pPrice = Math.round(wirePriceMap[size] * 0.8);
        const sPrice = wirePriceMap[size];
        const mrp = Math.round(sPrice * 1.2);
        const code = `${brand.substring(0,3).toUpperCase()}-${size.replace(' ', '')}-${color.substring(0,1)}`;
        list.push({
          id: `prod_${idCounter++}`,
          shopId: 'shared_master',
          name: `${brand} ${size} Copper Wire (${color}) 90m`,
          productCode: code,
          barcode: `890123456${idCounter.toString().padStart(4, '0')}`,
          sku: `${brand.toUpperCase()}-W-${size.replace(' ', '')}-${color.toUpperCase()}`,
          hsnCode: '8544',
          category: 'Wires & Cables',
          brand,
          unit: 'Coil',
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          mrp,
          gstPercent: 18,
          stock: 0,
          minStock: 5,
          maxStock: 100,
          reorderLevel: 8,
          description: `${brand} FR PVC Insulated copper wire. Length 90 meters.`,
          isActive: true
        });
      });
    });
  });

  // 2. Switches, Sockets & Modular Plates (Anchor, Legrand, GM)
  const switchBrands = ['Anchor', 'Legrand', 'GM'];
  const switchItems = [
    { name: '1 Way Switch 10A', code: 'SW1-10A', sPrice: 45, unit: 'Pcs', hsn: '8536', cat: 'Switches' },
    { name: '2 Way Switch 10A', code: 'SW2-10A', sPrice: 65, unit: 'Pcs', hsn: '8536', cat: 'Switches' },
    { name: '1 Way Switch 20A', code: 'SW1-20A', sPrice: 85, unit: 'Pcs', hsn: '8536', cat: 'Switches' },
    { name: '3 Pin Socket 6A', code: 'SK3-6A', sPrice: 75, unit: 'Pcs', hsn: '8536', cat: 'Sockets' },
    { name: '3 Pin Socket 16A', code: 'SK3-16A', sPrice: 125, unit: 'Pcs', hsn: '8536', cat: 'Sockets' },
    { name: 'Modular Plate 2 Module', code: 'PL-2M', sPrice: 90, unit: 'Pcs', hsn: '8538', cat: 'Modular Plates' },
    { name: 'Modular Plate 4 Module', code: 'PL-4M', sPrice: 140, unit: 'Pcs', hsn: '8538', cat: 'Modular Plates' },
    { name: 'Modular Plate 6 Module', code: 'PL-6M', sPrice: 180, unit: 'Pcs', hsn: '8538', cat: 'Modular Plates' },
    { name: 'Modular Plate 8 Module', code: 'PL-8M', sPrice: 240, unit: 'Pcs', hsn: '8538', cat: 'Modular Plates' },
    { name: 'Modular Plate 12 Module', code: 'PL-12M', sPrice: 320, unit: 'Pcs', hsn: '8538', cat: 'Modular Plates' }
  ];
  const colors = ['White', 'Silver', 'Charcoal'];
  switchBrands.forEach(brand => {
    switchItems.forEach(item => {
      colors.forEach(col => {
        const factor = col === 'White' ? 1.0 : col === 'Silver' ? 1.15 : 1.25;
        const sPrice = Math.round(item.sPrice * factor);
        const pPrice = Math.round(sPrice * 0.75);
        const mrp = Math.round(sPrice * 1.3);
        const code = `${brand.substring(0,3).toUpperCase()}-${item.code}-${col.substring(0,2).toUpperCase()}`;
        list.push({
          id: `prod_${idCounter++}`,
          shopId: 'shared_master',
          name: `${brand} ${item.name} (${col})`,
          productCode: code,
          barcode: `890123456${idCounter.toString().padStart(4, '0')}`,
          sku: `${brand.toUpperCase()}-${item.code}-${col.toUpperCase()}`,
          hsnCode: item.hsn,
          category: item.cat,
          brand,
          unit: item.unit,
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          mrp,
          gstPercent: 18,
          stock: 0,
          minStock: 10,
          maxStock: 500,
          reorderLevel: 15,
          description: `Premium ${brand} modular range in elegant ${col} finish.`,
          isActive: true
        });
      });
    });
  });

  // 3. MCB, RCCB & Distribution Boards (Havells, Legrand)
  const mcbBrands = ['Havells', 'Legrand'];
  const mcbTypes = [
    { name: 'Single Pole MCB B-Curve', code: 'SP-B', hsn: '8536', basePrice: 150, cat: 'MCB' },
    { name: 'Double Pole MCB B-Curve', code: 'DP-B', hsn: '8536', basePrice: 350, cat: 'MCB' },
    { name: 'Three Pole MCB C-Curve', code: 'TP-C', hsn: '8536', basePrice: 650, cat: 'MCB' },
    { name: 'RCCB 30mA Double Pole', code: 'RCCB-DP', hsn: '8536', basePrice: 2200, cat: 'RCCB' },
    { name: 'RCCB 100mA Four Pole', code: 'RCCB-FP', hsn: '8536', basePrice: 3200, cat: 'RCCB' }
  ];
  const ratings = ['10A', '16A', '25A', '32A', '63A'];
  mcbBrands.forEach(brand => {
    mcbTypes.forEach(type => {
      ratings.forEach(rating => {
        const sPrice = type.basePrice + (rating === '63A' ? 100 : 20);
        const pPrice = Math.round(sPrice * 0.8);
        const mrp = Math.round(sPrice * 1.25);
        const code = `${brand.substring(0,3).toUpperCase()}-${type.code}-${rating}`;
        list.push({
          id: `prod_${idCounter++}`,
          shopId: 'shared_master',
          name: `${brand} ${type.name} ${rating}`,
          productCode: code,
          barcode: `890123456${idCounter.toString().padStart(4, '0')}`,
          sku: `${brand.toUpperCase()}-${type.code}-${rating}`,
          hsnCode: type.hsn,
          category: type.cat,
          brand,
          unit: 'Pcs',
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          mrp,
          gstPercent: 18,
          stock: 0,
          minStock: 2,
          maxStock: 50,
          reorderLevel: 4,
          description: `High breaking capacity safety ${type.name} rating ${rating} protection.`,
          isActive: true
        });
      });
    });
  });

  // 4. LED Lights (Philips, Havells, Crompton, Bajaj)
  const lightBrands = ['Philips', 'Havells', 'Crompton', 'Bajaj'];
  const lightTypes = [
    { name: 'LED Bulb 5W', code: 'BULB-5W', hsn: '8539', basePrice: 75, cat: 'LED Bulbs' },
    { name: 'LED Bulb 9W', code: 'BULB-9W', hsn: '8539', basePrice: 110, cat: 'LED Bulbs' },
    { name: 'LED Bulb 12W', code: 'BULB-12W', hsn: '8539', basePrice: 160, cat: 'LED Bulbs' },
    { name: 'LED Tube Light 18W', code: 'TUBE-18W', hsn: '8539', basePrice: 220, cat: 'Tube Lights' },
    { name: 'LED Panel Downlight 12W', code: 'PNL-12W', hsn: '9405', basePrice: 350, cat: 'Ceiling Lights' },
    { name: 'LED COB Light 6W', code: 'COB-6W', hsn: '9405', basePrice: 280, cat: 'Ceiling Lights' }
  ];
  const lightColors = ['Warm White', 'Cool Day Light', 'Natural White'];
  lightBrands.forEach(brand => {
    lightTypes.forEach(type => {
      lightColors.forEach(col => {
        const sPrice = type.basePrice;
        const pPrice = Math.round(sPrice * 0.7);
        const mrp = Math.round(sPrice * 1.4);
        const code = `${brand.substring(0,3).toUpperCase()}-${type.code}-${col.substring(0,2).toUpperCase()}`;
        list.push({
          id: `prod_${idCounter++}`,
          shopId: 'shared_master',
          name: `${brand} ${type.name} (${col})`,
          productCode: code,
          barcode: `890123456${idCounter.toString().padStart(4, '0')}`,
          sku: `${brand.toUpperCase()}-${type.code}-${col.replace(' ', '')}`,
          hsnCode: type.hsn,
          category: type.cat,
          brand,
          unit: 'Pcs',
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          mrp,
          gstPercent: 12,
          stock: 0,
          minStock: 5,
          maxStock: 100,
          reorderLevel: 10,
          description: `Energy efficient eco-friendly ${type.name} light source in ${col}.`,
          isActive: true
        });
      });
    });
  });

  // 5. Fans & Exhaust Fans (Crompton, Havells, Bajaj, V-Guard)
  const fanBrands = ['Crompton', 'Havells', 'Bajaj', 'V-Guard'];
  const fanTypes = [
    { name: 'Ceiling Fan 1200mm Classic', code: 'FAN-1200C', hsn: '8414', basePrice: 1650, cat: 'Fans' },
    { name: 'Ceiling Fan 1400mm Classic', code: 'FAN-1400C', hsn: '8414', basePrice: 1950, cat: 'Fans' },
    { name: 'Ceiling Fan 1200mm Decorative', code: 'FAN-1200D', hsn: '8414', basePrice: 2450, cat: 'Fans' },
    { name: 'Exhaust Fan 150mm', code: 'EXH-150', hsn: '8414', basePrice: 950, cat: 'Exhaust Fans' },
    { name: 'Exhaust Fan 200mm', code: 'EXH-200', hsn: '8414', basePrice: 1250, cat: 'Exhaust Fans' },
    { name: 'High Speed Pedestal Fan', code: 'PED-HS', hsn: '8414', basePrice: 2200, cat: 'Fans' }
  ];
  const fanColors = ['Brown', 'White', 'Ivory'];
  fanBrands.forEach(brand => {
    fanTypes.forEach(type => {
      fanColors.forEach(col => {
        const sPrice = type.basePrice;
        const pPrice = Math.round(sPrice * 0.75);
        const mrp = Math.round(sPrice * 1.3);
        const code = `${brand.substring(0,3).toUpperCase()}-${type.code}-${col.substring(0,1).toUpperCase()}`;
        list.push({
          id: `prod_${idCounter++}`,
          shopId: 'shared_master',
          name: `${brand} ${type.name} (${col})`,
          productCode: code,
          barcode: `890123456${idCounter.toString().padStart(4, '0')}`,
          sku: `${brand.toUpperCase()}-${type.code}-${col.toUpperCase()}`,
          hsnCode: type.hsn,
          category: type.cat,
          brand,
          unit: 'Pcs',
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          mrp,
          gstPercent: 18,
          stock: 0,
          minStock: 2,
          maxStock: 30,
          reorderLevel: 3,
          description: `High speed, noiseless operation ${type.name} with copper motor windings.`,
          isActive: true
        });
      });
    });
  });

  // 6. PVC, CPVC & UPVC Pipes & Fittings (Supreme, Astral, Prince, Ashirvad)
  const pipeBrands = ['Supreme', 'Astral', 'Prince', 'Ashirvad'];
  const pipeTypes = [
    { name: 'CPVC Pipe Class SDR-11 3m', code: 'CPVC-P', hsn: '3917', basePrice: 320, cat: 'CPVC Pipes' },
    { name: 'UPVC Pipe Class SCH-40 3m', code: 'UPVC-P', hsn: '3917', basePrice: 260, cat: 'UPVC Pipes' },
    { name: 'PVC Conduit Pipe Heavy 3m', code: 'PVC-C', hsn: '3917', basePrice: 65, cat: 'PVC Pipes' },
    { name: 'CPVC Elbow 90 Degree', code: 'CPVC-ELB', hsn: '3917', basePrice: 18, cat: 'Elbows' },
    { name: 'CPVC Equal Tee', code: 'CPVC-TEE', hsn: '3917', basePrice: 25, cat: 'Tees' },
    { name: 'CPVC Male Adapter Coupler', code: 'CPVC-MAC', hsn: '3917', basePrice: 30, cat: 'Couplers' },
    { name: 'CPVC Ball Valve', code: 'CPVC-BV', hsn: '8481', basePrice: 150, cat: 'Ball Valves' },
    { name: 'PVC Solvent Cement 100ml', code: 'SOLV-100', hsn: '3506', basePrice: 85, cat: 'Solvent Cement' }
  ];
  const pipeSizes = ['1/2 inch', '3/4 inch', '1 inch', '1.25 inch', '1.5 inch'];
  pipeBrands.forEach(brand => {
    pipeTypes.forEach(type => {
      pipeSizes.forEach(size => {
        const sizeFactor = size === '1/2 inch' ? 1.0 : size === '3/4 inch' ? 1.3 : size === '1 inch' ? 1.8 : size === '1.25 inch' ? 2.4 : 3.0;
        const sPrice = Math.round(type.basePrice * sizeFactor);
        const pPrice = Math.round(sPrice * 0.7);
        const mrp = Math.round(sPrice * 1.35);
        const code = `${brand.substring(0,3).toUpperCase()}-${type.code}-${size.replace(' ', '')}`;
        list.push({
          id: `prod_${idCounter++}`,
          shopId: 'shared_master',
          name: `${brand} ${type.name} (${size})`,
          productCode: code,
          barcode: `890123456${idCounter.toString().padStart(4, '0')}`,
          sku: `${brand.toUpperCase()}-${type.code}-${size.replace(' ', '')}`,
          hsnCode: type.hsn,
          category: type.cat,
          brand,
          unit: type.name.includes('Pipe') ? 'Length' : type.name.includes('Solvent') ? 'Can' : 'Pcs',
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          mrp,
          gstPercent: 18,
          stock: 0,
          minStock: 10,
          maxStock: 500,
          reorderLevel: 20,
          description: `Industrial and home usage premium quality leakproof plumbing ${type.name} in size ${size}.`,
          isActive: true
        });
      });
    });
  });

  // 7. Water Tanks (Sintex)
  const tankBrands = ['Sintex'];
  const tankSizes = ['200L', '300L', '500L', '750L', '1000L', '1500L', '2000L', '3000L', '5000L', '10000L'];
  tankBrands.forEach(brand => {
    tankSizes.forEach(size => {
      const capacity = parseInt(size);
      const sPrice = capacity * 7.5;
      const pPrice = Math.round(sPrice * 0.8);
      const mrp = Math.round(sPrice * 1.2);
      const code = `SNT-TNK-${size}`;
      list.push({
        id: `prod_${idCounter++}`,
        shopId: 'shared_master',
        name: `${brand} Double Layer Water Tank (${size})`,
        productCode: code,
        barcode: `890123456${idCounter.toString().padStart(4, '0')}`,
        sku: `SNT-TNK-${size}`,
        hsnCode: '3925',
        category: 'Water Tanks',
        brand,
        unit: 'Pcs',
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        mrp,
        gstPercent: 18,
        stock: 0,
        minStock: 1,
        maxStock: 15,
        reorderLevel: 2,
        description: `Highly durable double layer food grade water storage tank capacity ${size}.`,
        isActive: true
      });
    });
  });

  return list;
};

export const SIVASAKTHI_PRODUCTS: Product[] = generateProducts();
export const MEENATCHI_PRODUCTS: Product[] = SIVASAKTHI_PRODUCTS;

// Common Initial Customers for both shops
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c_walkin',
    shopId: 'all', // available to both
    name: 'Walk-in Customer',
    mobile: '9999999999',
    address: 'Counter Cash Sale',
    city: 'Local',
    state: 'Tamil Nadu',
    pincode: '600001',
    gstNumber: '',
    email: 'counter@gmail.com',
    creditLimit: 0,
    outstandingAmount: 0,
    notes: 'Standard walk-in customer profile.',
    type: 'retail',
  },
  {
    id: 'c1',
    shopId: 'all',
    name: 'Balaji Builders (Contractor)',
    mobile: '9845612301',
    address: '45, Gandhi Road, Opp. Bus Stand',
    city: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '625001',
    gstNumber: '33AAAPB1234F1Z8',
    email: 'balajibuilders@yahoo.com',
    creditLimit: 50000,
    outstandingAmount: 12450, // owes us money
    notes: 'A-grade contractor. Receives contractor rates (excludes GST). Pays monthly.',
    type: 'contractor',
  },
  {
    id: 'c2',
    shopId: 'all',
    name: 'Karthik Electrician',
    mobile: '9443215890',
    address: '12/3A, Sivan Kovil Street',
    city: 'Salem',
    state: 'Tamil Nadu',
    pincode: '636003',
    gstNumber: '',
    email: 'karthikelectric@gmail.com',
    creditLimit: 15000,
    outstandingAmount: 3200,
    notes: 'Frequent buyer, wholesale rate discount on lighting.',
    type: 'wholesale',
  },
  {
    id: 'c3',
    shopId: 'all',
    name: 'Meenakshi Sundaram Pillai',
    mobile: '9789456123',
    address: 'Nehru Nagar Main Road, Block C',
    city: 'Trichy',
    state: 'Tamil Nadu',
    pincode: '620015',
    gstNumber: '',
    email: 'msundar@outlook.com',
    creditLimit: 5000,
    outstandingAmount: -1200, // advance credit paid
    notes: 'Retail homeowner. Pre-paid balance for bathroom pipeline fittings.',
    type: 'retail',
  }
];

// Common Initial Suppliers
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    shopId: 'all',
    name: 'Havells India Limited Dist.',
    mobile: '0442345678',
    address: 'Zonal Office, Mount Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600002',
    gstNumber: '33AAACH1029C1Z4',
    email: 'chennai.sales@havells.com',
    outstandingAmount: 48500, // we owe them
    notes: 'Premium electrical brand. Offers 30 days credit terms.',
    bankDetails: 'HDFC Bank - A/C: 502000124578, IFSC: HDFC0000004',
  },
  {
    id: 's2',
    shopId: 'all',
    name: 'Supreme Industries Ltd Agency',
    mobile: '0422987654',
    address: '142, bypass Ring Road',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641018',
    gstNumber: '33AAACS1234D2Z9',
    email: 'supreme.pipes.cbe@gmail.com',
    outstandingAmount: 0,
    notes: 'Primary supplier for rigid PVC, plumbing pipes and couplings.',
    bankDetails: 'State Bank of India - A/C: 3102457896, IFSC: SBIN0001240',
  }
];

// Map of Businesses / Shops
export const BUSINESSES = [
  {
    id: 'sivasakthi_elec',
    name: 'SIVASAKTHI ELECTRICALS',
    description: 'Electrical Products, Wires, Switches, Lights & Home Appliances',
    logoPlaceholder: 'SE',
    tags: ['Wires', 'Switches', 'LED Lights', 'Appliances'],
    defaultDetails: {
      address: 'No 45, Nethaji Road, Opp Government Hospital',
      city: 'Theni',
      state: 'Tamil Nadu',
      pincode: '625531',
      phone: '9876543210',
      altPhone: '04546252111',
      email: 'sivasakthielec@gmail.com',
      website: 'www.sivasakthielectricals.com',
      gstNumber: '33AAXCS4567M1ZX',
      panNumber: 'AAXCS4567M',
      bankName: 'Indian Overseas Bank',
      accountHolder: 'Sivasakthi Electricals',
      accountNumber: '023402000012456',
      ifscCode: 'IOBA0000234',
      branch: 'Theni Main',
      upiId: 'sivasakthielec@okaxis',
      invoicePrefix: 'SE',
      termsAndConditions: [
        'Goods once sold cannot be taken back or exchanged.',
        'Our responsibility ceases after delivery of goods from our godown.',
        'Warranty claims are subject to manufacturer terms and conditions.',
        'Interest @18% p.a. will be charged if payment is not made within 15 days.'
      ],
      declaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
      authorizedSignature: 'For Sivasakthi Electricals',
      roundOff: true,
      decimalPlaces: 2
    }
  },
  {
    id: 'meenatchi_pipes',
    name: 'SRI MEENATCHI PIPES & ELECTRICALS',
    description: 'Pipes, Sanitary fittings, Bathroom fittings & Electrical items',
    logoPlaceholder: 'MP',
    tags: ['PVC Pipes', 'CPVC Fittings', 'Taps', 'Bathroom Accessories'],
    defaultDetails: {
      address: 'Door No. 12/8B, Bypass Main Road, Near Old Bus Stand',
      city: 'Madurai',
      state: 'Tamil Nadu',
      pincode: '625001',
      phone: '9944556677',
      altPhone: '04522334455',
      email: 'meenatchipipes@gmail.com',
      website: 'www.meenatchipipes.com',
      gstNumber: '33AABCM9876R1ZO',
      panNumber: 'AABCM9876R',
      bankName: 'Canara Bank',
      accountHolder: 'Sri Meenatchi Pipes & Electricals',
      accountNumber: '124010100456789',
      ifscCode: 'CNRB0001240',
      branch: 'Madurai East',
      upiId: 'meenatchipipes@okicici',
      invoicePrefix: 'SM',
      termsAndConditions: [
        'Check all materials before unloading. No complaints will be entertained later.',
        'Subject to Madurai Jurisdiction.',
        'Returns accepted within 7 days with original bill, subject to 10% re-stocking fee.',
        'Credit purchases must be settled within the agreed timeline.'
      ],
      declaration: 'Certified that the particulars given above are true and correct.',
      authorizedSignature: 'For Sri Meenatchi Pipes & Elec.',
      roundOff: true,
      decimalPlaces: 2
    }
  }
];
