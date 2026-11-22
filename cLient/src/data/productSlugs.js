/**
 * MOSH Automation - Product SEO Slug Mappings & Technical Specifications
 * Provides clean URL slugs, technical metadata, and specifications for search engines.
 */

export const productSlugMap = {
  'p-1': 'auto-change-water-level-controller',
  'p-2': 'double-tank-fully-automated',
  'p-4': 'gsm-based-on-off-with-dry-run',
  'p-5': 'wireless-controller-base-module',
  'p-6': 'water-level-sensors',
  'p-7': 'water-level-controller-with-timer',
  'p-8': 'three-phase-fully-automatic-controller',
  'p-9': 'three-phase-dry-run-preventer',
  'p-10': 'single-phase-water-controller-with-dry-run',
  'p-11': 'single-phase-fully-automatic-controller',
  'p-12': 'single-phase-controller-above-1-5hp',
  'p-13': 'gsm-based-on-off',
  'p-14': 'float-switch',
  'p-15': 'wireless-controller-tank-module'
};

export const slugToProductId = Object.entries(productSlugMap).reduce((acc, [id, slug]) => {
  acc[slug] = id;
  return acc;
}, {});

export const productTechnicalData = {
  'p-1': {
    slug: 'auto-change-water-level-controller',
    category: 'Automatic Water Level Controllers',
    seoTitle: 'Auto Change Water Level Controller Price & Specs | MOSH Automation',
    metaDescription: 'Buy MOSH Auto Change Water Level Controller online for ₹3,200. Features intelligent auto-switching, overflow prevention, and dry-run safety for overhead tanks.',
    h1: 'Auto Change Water Level Controller with Smart Switching',
    specs: {
      'Operating Voltage': '220V - 240V AC, 50Hz',
      'Phase Support': 'Single Phase',
      'Motor Capacity': 'Up to 1.5 HP (Direct connection)',
      'Sensor Technology': 'Magnetic Float / Non-Corrosive SS304 Sensors',
      'Dry Run Cutoff': 'Yes, built-in sensor timeout',
      'Enclosure Material': 'High-Impact Fire-Retardant ABS',
      'Warranty': '1 Year Comprehensive Replacement Warranty',
      'Origin': 'Coimbatore, Tamil Nadu, India'
    },
    keyFeatures: [
      'Autonomous automatic motor switching based on tank water thresholds',
      'Prevents overhead tank overflow and saves electricity',
      'Protects water pump against dry run operation when sump is dry',
      'Visual LED indicators for Overhead Full, Sump Low, and Motor Active status',
      'Manual override switch for emergency continuous pumping'
    ]
  },
  'p-2': {
    slug: 'double-tank-fully-automated',
    category: 'Dual Tank Automation Systems',
    seoTitle: 'Double Tank Fully Automated Water Level Controller | MOSH Automation',
    metaDescription: 'Dual tank water level automation system for ₹4,800. Automatically coordinates underground sump to overhead tank water transfer with dry-run protection.',
    h1: 'Double Tank Fully Automated Water Management System',
    specs: {
      'Operating Voltage': '220V - 240V AC, 50Hz',
      'Phase Support': 'Single Phase (Three-Phase compatible with contactor)',
      'Tanks Monitored': 'Dual Tank (Underground Sump + Overhead Tank)',
      'Motor Capacity': 'Up to 2.0 HP',
      'Sensor Type': 'Low-Voltage AC Sensing (Electrolysis-Free)',
      'Enclosure': 'Industrial Grade ABS Enclosure',
      'Warranty': '1 Year Replacement Warranty',
      'Origin': 'Engineered in Coimbatore, India'
    },
    keyFeatures: [
      'Synchronous dual-tank sensing: overhead high/low and sump high/low',
      'Automatic interlock: motor never runs if underground sump is below safe level',
      'Automated water transfer without human intervention 24/7',
      'Electrolysis-proof low voltage AC sensor signals prevent sensor scaling',
      'Audible alarm notification on sump depletion'
    ]
  },
  'p-4': {
    slug: 'gsm-based-on-off-with-dry-run',
    category: 'GSM & Wireless Motor Automation',
    seoTitle: 'GSM Based Motor Controller with Dry Run Protection | MOSH Automation',
    metaDescription: 'Control water pump via mobile SMS and phone calls for ₹3,900. Includes real-time dry-run sensing, phase failure cutoff, and remote status feedback.',
    h1: 'GSM Based Motor Controller with Intelligent Dry Run Protection',
    specs: {
      'Operating Voltage': '220V - 415V AC (Single & Three Phase variants)',
      'Communication Mode': 'GSM SIM Card (2G/4G Compatible)',
      'Control Methods': 'Missed Call, SMS Commands, Mobile Web App',
      'Dry Run Detection': 'Current Sensing / Sensor Probe',
      'Phase Protection': 'Phase reversal, phase failure & low voltage cutoff',
      'Warranty': '1 Year Full Replacement Warranty',
      'Origin': 'Engineered in India'
    },
    keyFeatures: [
      'Turn agricultural and residential water pumps ON/OFF from anywhere in the world',
      'Instant SMS alert notifications for Power Available, Motor Running, and Dry Run',
      'Dry run auto-cutoff prevents pump burnout when borewell water dries up',
      'Authorised user phone number authentication prevents unauthorized access',
      'Heavy-duty relay rated for continuous operation under fluctuating voltages'
    ]
  },
  'p-5': {
    slug: 'wireless-controller-base-module',
    category: 'Wireless Telemetry & Multi-Node',
    seoTitle: 'Wireless Water Level Controller Base Module | MOSH Automation',
    metaDescription: 'Wireless receiver base module for water pump automation for ₹2,500. Long-range RF telemetry eliminates expensive wire routing across buildings.',
    h1: 'Wireless Water Level Controller Base Receiver Module',
    specs: {
      'Operating Voltage': '220V AC, 50Hz',
      'Radio Frequency': '868MHz / 433MHz Industrial ISM Band',
      'Line-of-Sight Range': 'Up to 1.5 Kilometers (Obstacle-penetrating)',
      'Motor Switching': 'Inbuilt 30A Heavy-Duty Relay',
      'Pairing': 'Secure Rolling Code Frequency Hopping',
      'Warranty': '1 Year Warranty',
      'Origin': 'Made in India'
    },
    keyFeatures: [
      'Eliminates long sensor cable wiring between overhead tank and ground motor',
      'Receives real-time telemetry from remote rooftop tank transmitter node',
      'Fail-safe timeout: auto shuts off motor if radio signal is interrupted',
      'Multi-story apartment building and commercial campus penetration',
      'Zero wire maintenance, termite damage or cable breakage risks'
    ]
  },
  'p-6': {
    slug: 'water-level-sensors',
    category: 'Sensors & Probes',
    seoTitle: 'Stainless Steel Magnetic Water Level Sensors | MOSH Automation',
    metaDescription: 'High-durability SS304 magnetic water level sensors for ₹1,800. Non-corrosive, electrolysis-free, and ideal for overhead and underground water tanks.',
    h1: 'Heavy-Duty Magnetic Stainless Steel Water Level Sensors',
    specs: {
      'Material': 'Food-Grade Stainless Steel SS304 / Teflon Coated',
      'Sensor Type': 'Magnetic Reed Switch & Float Element',
      'Operating Temperature': '-10°C to +85°C',
      'Signal Voltage': '5V - 12V DC Low Power Safe',
      'Corrosion Resistance': 'Rust-proof, Salt-water & Mineral resistant',
      'Cable Type': 'PVC Insulated Submersible Cable',
      'Warranty': '1 Year Warranty'
    },
    keyFeatures: [
      'Hermetically sealed magnetic reed mechanism with zero exposed carbon points',
      'Completely electrolysis-free operation guarantees 10+ years sensor life',
      'Suitable for hard water, borewell water, municipal RO and chemical water',
      'Easy hook installation without drilling into water tank bottom',
      'Compatible with all MOSH automatic controllers and third-party panels'
    ]
  },
  'p-7': {
    slug: 'water-level-controller-with-timer',
    category: 'Automatic Water Level Controllers',
    seoTitle: 'Water Level Controller With Cyclic Digital Timer | MOSH Automation',
    metaDescription: 'Timer-based water level controller for ₹2,900. Automates municipal corporation water supply pumping and periodic tank replenishing schedules.',
    h1: 'Automatic Water Level Controller with Programmable Digital Timer',
    specs: {
      'Operating Voltage': '220V - 240V AC',
      'Timer Modes': 'Cyclic On/Off, Scheduled Start, Running Limit',
      'Max Run Time': 'Programmable 1 min to 120 mins',
      'Motor Load': 'Up to 2 HP',
      'Display': 'Digital Seven-Segment LED Status Display',
      'Warranty': '1 Year Warranty'
    },
    keyFeatures: [
      'Ideal for areas with scheduled municipal water supply (Corporation Water)',
      'Limits motor continuous run time to protect pump from overheating',
      'Combines tank water level sensing with cyclic pumping intervals',
      'Retains programmed timer settings during power failures via internal EEPROM',
      'Manual override with single-touch bypass'
    ]
  },
  'p-8': {
    slug: 'three-phase-fully-automatic-controller',
    category: 'Industrial & Agricultural Motor Controllers',
    seoTitle: 'Three Phase Fully Automatic Water Motor Controller | MOSH Automation',
    metaDescription: 'Industrial three-phase automatic motor controller for ₹5,400. Built for openwells, borewells, and industrial pumps with overload and phase protection.',
    h1: 'Industrial Three Phase Fully Automatic Water Pump Controller',
    specs: {
      'Operating Voltage': '380V - 440V AC, 3-Phase',
      'Motor Range': '3 HP to 15 HP (Direct On Line & Star-Delta)',
      'Protection': 'Single Phasing, Phase Reversal, Overload & Dry Run',
      'Contactor Rating': 'Heavy Duty 3-Pole 32A/40A Contactor',
      'Display': 'Phase Voltages and Run Indicator LEDs',
      'Warranty': '1 Year Industrial Warranty'
    },
    keyFeatures: [
      'Complete automation for agricultural borewells, factories, and residential towers',
      'Single phasing preventer disconnects motor instantly if any phase drops',
      'Electronic overload trip protects motor windings from high amperage burnouts',
      'Integrates seamlessly with overhead tank magnetic sensors or float switches',
      'Heavy-duty powder-coated metal enclosure withstands extreme environments'
    ]
  },
  'p-9': {
    slug: 'three-phase-dry-run-preventer',
    category: 'Industrial & Agricultural Motor Controllers',
    seoTitle: 'Three Phase Motor Dry Run Preventer Price | MOSH Automation',
    metaDescription: 'Protect 3-phase agricultural pumps from dry running for ₹4,300. Electronic current-sensing technology with auto-restart delay for borewells.',
    h1: 'Three Phase Electronic Motor Dry Run & Phase Protection Unit',
    specs: {
      'Voltage': '415V AC, 3 Phase',
      'Current Sensing Range': '1A to 30A Adjustable Current Threshold',
      'Auto Restart Delay': 'Programmable (15 to 180 mins)',
      'Response Time': '< 3 Seconds on Dry Run detection',
      'Compatibility': 'All standard starter panels (DOL & Star-Delta)',
      'Warranty': '1 Year Warranty'
    },
    keyFeatures: [
      'Monitors motor operating current without needing sensor cables down the borewell',
      'Immediately shuts off motor when borewell water runs out (underload detection)',
      'Automatic restart timer attempts pumping after borewell water recharges',
      'Prevents submersible pump impeller melting and dry friction seizure',
      'Easy 4-wire retrofit installation into existing motor starter panels'
    ]
  },
  'p-10': {
    slug: 'single-phase-water-controller-with-dry-run',
    category: 'Residential Water Pump Controllers',
    seoTitle: 'Single Phase Water Controller with Dry Run Cutoff | MOSH Automation',
    metaDescription: 'Single phase water level controller with dry-run cutoff for ₹3,600. Ideal for monobloc and submersible pumps in homes, villas, and apartments.',
    h1: 'Single Phase Automatic Water Controller with Built-in Dry Run Cutoff',
    specs: {
      'Operating Voltage': '180V - 250V AC, 50Hz',
      'Motor HP': '0.5 HP to 1.5 HP',
      'Dry Run Detection': 'Low-level sensing & current monitoring',
      'Sensors Included': 'Magnetic Stainless Steel Sensors (Set of 3)',
      'Cabinet': 'Compact Wall-Mountable Fire-Retardant Polycarbonate',
      'Warranty': '1 Year Warranty'
    },
    keyFeatures: [
      'Comprehensive dual protection: prevents tank overflow AND pump dry running',
      'Automatic restart timer once underground sump water level is replenished',
      'Visual LED indicators for Overhead Tank Full, Sump Dry, and Motor Running',
      'Saves up to 30% electricity by eliminating unnecessary overflow pumping',
      'Compatible with all domestic monobloc, jet, and submersible pumps'
    ]
  },
  'p-11': {
    slug: 'single-phase-fully-automatic-controller',
    category: 'Residential Water Pump Controllers',
    seoTitle: 'Single Phase Fully Automatic Water Pump Controller | MOSH Automation',
    metaDescription: 'Best automatic water level controller for home overhead tanks for ₹3,400. Compact, dependable auto-switching with overflow elimination.',
    h1: 'Single Phase Fully Automatic Water Tank Motor Controller',
    specs: {
      'Operating Voltage': '200V - 240V AC',
      'Max Load': '1.5 HP Motor',
      'Sensor Type': 'Non-Electrolytic Magnetic Sensors',
      'Relay Capacity': '25A High-Inrush Current Relay',
      'Dimensions': '180mm x 140mm x 65mm',
      'Warranty': '1 Year Replacement Warranty'
    },
    keyFeatures: [
      'Fully automated operation: starts pump at low level and stops at full level',
      'Zero manual switching required: eliminates domestic water hassles',
      'Surge-protected power supply handles Indian grid voltage spikes',
      'Durable magnetic float sensors never rust or collect algae deposits',
      'Plug-and-play installation suitable for residential electricians'
    ]
  },
  'p-12': {
    slug: 'single-phase-controller-above-1-5hp',
    category: 'Residential Water Pump Controllers',
    seoTitle: 'Heavy-Duty Single Phase Controller Above 1.5HP | MOSH Automation',
    metaDescription: 'Water level controller for high-power single-phase pumps (2HP & 3HP) for ₹4,100. Heavy-duty 40A power contactor handles high inrush currents.',
    h1: 'Heavy-Duty Single Phase Controller for Motors Above 1.5HP (Up to 3HP)',
    specs: {
      'Operating Voltage': '220V AC, 50Hz',
      'Motor Capacity': '2.0 HP to 3.0 HP High Load Motors',
      'Switching Unit': 'Industrial 40A Contactor with Arc Suppressor',
      'Thermal Protection': 'High current thermal overload trip',
      'Housing': 'Metal powder-coated or heavy ABS enclosure',
      'Warranty': '1 Year Heavy-Duty Warranty'
    },
    keyFeatures: [
      'Specifically engineered for deep borewell submersible pumps above 1.5 HP',
      'Equipped with industrial-grade contactor to prevent contact point welding',
      'Integrated auto-manual bypass toggle switch',
      'Overhead and sump tank safety interlock',
      'High-durability terminal blocks for 4 sq mm and 6 sq mm copper cables'
    ]
  },
  'p-13': {
    slug: 'gsm-based-on-off',
    category: 'GSM & Wireless Motor Automation',
    seoTitle: 'GSM Mobile Remote Motor Switch Controller | MOSH Automation',
    metaDescription: 'Turn your water motor ON and OFF from your mobile phone for ₹3,100. Call and SMS pump automation with power availability alert.',
    h1: 'GSM Mobile Remote Water Motor Switch Controller',
    specs: {
      'GSM Band': 'Quad Band 850/900/1800/1900MHz',
      'Input Voltage': '180V - 260V AC',
      'User Capacity': 'Up to 5 Registered Mobile Numbers',
      'Feedback': 'Instant Confirmation SMS & Ringback',
      'Warranty': '1 Year Warranty'
    },
    keyFeatures: [
      'Switch water pumps on or off from anywhere using simple missed calls or SMS',
      'Automatic power alert: sends SMS when electricity is restored or interrupted',
      'Compatible with all domestic and agricultural motor starters',
      'Password protected configuration prevents accidental or unauthorized switching',
      'High-gain external antenna ensures connectivity in low-signal rural areas'
    ]
  },
  'p-14': {
    slug: 'float-switch',
    category: 'Sensors & Probes',
    seoTitle: 'Magnetic Cable Float Switch for Water Tanks | MOSH Automation',
    metaDescription: 'High reliability magnetic cable float switch for ₹650. Dual-function NO/NC contacts for automatic tank filling and sump emptying applications.',
    h1: 'High Reliability Magnetic Cable Float Switch for Water Tanks',
    specs: {
      'Cable Length': '3 Meters / 5 Meters (Heavy duty copper core)',
      'Contact Type': 'Dual Microswitch (NO + NC for Fill / Empty)',
      'Rated Current': '16A / 250V AC',
      'Float Body': 'High-Density Non-Toxic Polypropylene (IP68 Waterproof)',
      'Counterweight': 'Adjustable Counterweight Included',
      'Warranty': '1 Year Warranty'
    },
    keyFeatures: [
      'Dual purpose operation: wire for tank filling (cut on high) or sump drainage (cut on low)',
      'Hermetically sealed IP68 waterproof design with 100,000+ switching cycle life',
      'Adjustable counterweight enables precise setting of water level switching differential',
      'Chemical, oil, and mineral resistant cable suitable for sewage and treated water',
      'Direct switching of small fractional pumps or control signal for starter panels'
    ]
  },
  'p-15': {
    slug: 'wireless-controller-tank-module',
    category: 'Wireless Telemetry & Multi-Node',
    seoTitle: 'Wireless Controller Tank Module Node | MOSH Automation',
    metaDescription: 'Rooftop tank solar/battery wireless telemetry transmitter node for ₹2,100. Transmits real-time water levels up to 1.5km to motor base controller.',
    h1: 'Wireless Rooftop Water Tank Telemetry Transmitter Node',
    specs: {
      'Power Source': 'Ultra Low-Power 3.3V DC (Battery / Solar Option)',
      'Battery Life': 'Up to 2 Years on standard AA Lithium cells',
      'Transmission Distance': '1.5 Km Line of Sight, 400m Urban Buildings',
      'Sensors Supported': 'Up to 4 Discrete Water Level Thresholds',
      'Ingress Protection': 'IP67 Weatherproof Outdoor UV-Stabilized Enclosure',
      'Warranty': '1 Year Warranty'
    },
    keyFeatures: [
      'Installs directly on rooftop water tanks without running cables down the building',
      'Transmits instantaneous tank fill status to ground pump controller via secure RF',
      'Low battery warning alert transmitted to base receiver unit',
      'UV-stabilized waterproof housing withstands direct sunlight, monsoons, and extreme heat',
      'Zero monthly recharge or network costs (license-free ISM radio frequency)'
    ]
  }
};
