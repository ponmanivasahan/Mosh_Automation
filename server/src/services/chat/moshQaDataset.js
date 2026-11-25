/**
 * MOSH Automation Real Customer Q&A Dataset & Fuzzy Intent Retriever
 *
 * Built from verified MOSH Automation product specifications (p-1 to p-14),
 * actual customer questions from MySQL (chat_messages & estimations),
 * and natural English, Tamil, and Thanglish variations.
 */

const { pool } = require('../../config/db');

const MOSH_QA_DATASET = [
  // =========================================================================
  // INTENT: auto_shutoff_on_tank_full
  // =========================================================================
  {
    id: 'qa-001',
    originalQuestion: 'Will the motor stop automatically when the tank is full?',
    normalizedQuestion: 'will motor stop automatically when tank is full',
    intent: 'Automatic motor shutoff when the tank is full',
    relatedProductId: 'p-1',
    category: 'working_principle',
    language: 'en',
    verifiedAnswer: 'Yes, the controller automatically starts your pump when the tank drops to the low level and turns it off as soon as the tank is full. For a single-phase home pump up to 1.5 HP, the Auto Change Water Level Controller (₹3,200) or Single Phase Fully Automatic Controller (₹3,400) is ideal.',
    detailedAnswer: 'Sensors placed at the lower and upper thresholds inside your overhead tank send low-voltage signals to the controller. When water drops below the lower sensor, the relay/contactor turns the motor ON. Once water reaches the upper sensor, it immediately cuts power to stop overflow and save up to 30% electricity. Compatible with 220V-240V AC single-phase pumps up to 1.5 HP, with a 1-Year Replacement Warranty.',
    alternativePatterns: [
      'Does it automatically switch the motor ON and OFF?',
      'Will pump turn off once tank fills up?',
      'Can this prevent overhead tank overflow automatically?',
      'Motor automatic-ah off aaguma?',
      'Tank full aana motor ninnuduma?',
      'Thanni nirambina motor stop aaguma?',
      'Tank full aana motor automatic-aa off aaguma? Athukku enna model vaanganum?',
      'Veetu tank daily overflow aagi thanni waste aaguthu, enna podalam?',
      'டேங்க் நிரம்பியதும் மோட்டார் தானாகவே ஆஃப் ஆகுமா?'
    ]
  },
  {
    id: 'qa-002',
    originalQuestion: 'ennaku water level controller epapdi work aaguthu',
    normalizedQuestion: 'how does water level controller work',
    intent: 'Automatic water level controller working principle',
    relatedProductId: 'p-1',
    category: 'working_principle',
    language: 'tanglish',
    verifiedAnswer: 'Tank-la upper matrum lower level-la sensors irukkum. Thanni kammi aagumpothu motor automatic-aa ON aagum, tank full aanathum automatic-aa OFF aagum. Sump iruntha keela thanni illana motor odama lock pannidum.',
    detailedAnswer: 'MOSH controllers use hermetically sealed magnetic reed / SS304 stainless steel sensors operating on safe low-voltage AC/DC signals. When overhead tank water drops below the low threshold (and sump water is available), the 25A/30A relay or contactor switches the pump ON. When the top threshold is reached, it cuts off immediately to prevent overflow.',
    alternativePatterns: [
      'How does an automatic water level controller work?',
      'Explain how this product works',
      'Water level controller working principle',
      'epdi work aaguthu water controller',
      'MOSH வாட்டர் லெவல் கண்ட்ரோலர் எப்படி வேலை செய்கிறது?'
    ]
  },

  // =========================================================================
  // INTENT: dual_tank_sump_and_overhead
  // =========================================================================
  {
    id: 'qa-003',
    originalQuestion: 'Anna, en veetla underground sump-um overhead tank-um irukku. Motor-ah manual-ah ON/OFF panren. Indha automatic water level controller use panna motor automatic-ah ON/OFF aaguma? Installation eppadi panradhu, product price evlo, warranty details enna nu sollunga.',
    normalizedQuestion: 'controller for underground sump and overhead tank automatic on off installation price warranty',
    intent: 'Dual tank automation for underground sump and overhead tank',
    relatedProductId: 'p-2',
    category: 'products',
    language: 'tanglish',
    verifiedAnswer: 'Aama, underground sump-um overhead tank-um iruntha motor automatic-aa ON/OFF aagum. Up to 1.5 HP home motor-ku Single Phase Water Controller With Dry Run (₹3,600), 2.0 HP varaikkum Double Tank Fully Automated (₹4,800) best. Tank-la ota podama top-hook sensors vachu electrician easy-aa install pannidalam (wiring diagram box-la varum). Ellathukkum 1 Year Replacement Warranty irukku.',
    detailedAnswer: 'Double Tank Fully Automated (₹4,800, up to 2.0 HP) monitors both underground sump (high/low) and overhead tank (high/low) synchronously. If the sump runs low, an interlock stops the pump and triggers an audible alarm. For up to 1.5 HP, Single Phase Water Controller With Dry Run (₹3,600) includes 3 magnetic SS304 sensors. Standard installation rate is ₹1,500 (if you book technician support) and wire base is ₹300-₹350 for 30m. 1-Year Replacement Warranty included.',
    alternativePatterns: [
      'I have an overhead tank and an underground sump, which controller is best?',
      'Which automatic water level controller is best for a home with both an underground sump and an overhead tank?',
      'Keela sump-um mele overhead tank-um irukku, rendu tank-um automatic-aa control panna enna model?',
      'கீழே சம்ப் மற்றும் மேலே டேங்க் இரண்டையும் தானாக கட்டுப்படுத்த என்ன மாடல் உள்ளது?',
      'double tank fully automated price and details',
      'Should I buy Double Tank Fully Automated or Single Phase With Dry Run?'
    ]
  },

  // =========================================================================
  // INTENT: sensor_water_safety_and_material
  // =========================================================================
  {
    id: 'qa-004',
    originalQuestion: 'is senors does nort affect te water aa ?',
    normalizedQuestion: 'do sensors affect water safety drinking safe non toxic',
    intent: 'Water safety and non-contamination of sensors',
    relatedProductId: 'p-6',
    category: 'compatibility',
    language: 'tanglish',
    verifiedAnswer: 'No, MOSH sensors do not affect or contaminate your drinking water at all. They are made from food-grade SS304 stainless steel and non-toxic polypropylene with low-voltage electrolysis-free signaling, so there is no rust, chemical leaching, or shock risk.',
    detailedAnswer: 'MOSH Water Level Sensors (₹1,800) use food-grade SS304 stainless steel / Teflon-coated bodies with hermetically sealed magnetic reed switches (5V-12V low-power signal). Our Float Switch (₹1,200) uses non-toxic IP68 polypropylene. Because there is no DC electrolysis in water, no metal ions dissolve into your tank.',
    alternativePatterns: [
      'Do the sensors contaminate drinking water?',
      'Are the sensors safe for drinking water tank?',
      'Is it food grade? Will it give electric shock in water?',
      'Thanni-la current varuma? Drinking water-ku safe-aa?',
      'Sensors water taste maathuma?'
    ]
  },
  {
    id: 'qa-005',
    originalQuestion: 'form which componenet the sensors are made',
    normalizedQuestion: 'what material are the sensors made of',
    intent: 'Sensor build material and corrosion resistance',
    relatedProductId: 'p-6',
    category: 'products',
    language: 'en',
    verifiedAnswer: 'MOSH Water Level Sensors (₹1,800) are made from food-grade SS304 stainless steel with Teflon coating and hermetically sealed magnetic reed switches, so they do not rust or corrode even in hard or salty borewell water.',
    detailedAnswer: 'Specifications for Water Level Sensors (₹1,800): Material is Food-Grade Stainless Steel SS304 / Teflon Coated; Sensor Type is Magnetic Reed Switch & Float Element; Operating Temp -10°C to +85°C; Signal Voltage 5V-12V DC; PVC-insulated submersible cable; 10+ years electrolysis-free life; 1-Year Warranty.',
    alternativePatterns: [
      'What sensors does MOSH use and do they rust in hard water?',
      'What material is used in MOSH probes?',
      'Do your sensors rust or need frequent cleaning?',
      'Sensor mattum thaniya kidaikuma? Salt water-la rust aaguma?',
      'சென்சார் துருப்பிடிக்குமா? என்ன மெட்டீரியல்?'
    ]
  },

  // =========================================================================
  // INTENT: delivery_timeline_and_shipping
  // =========================================================================
  {
    id: 'qa-006',
    originalQuestion: 'ஆர்டர் செய்த பிறகு எப்போது கிடைக்கும்?',
    normalizedQuestion: 'when will i receive order after placing delivery timeline',
    intent: 'Order delivery timeline and tracking',
    relatedProductId: null,
    category: 'ordering',
    language: 'ta',
    verifiedAnswer: 'ஆர்டர் செய்த பிறகு உங்கள் ஆர்டரின் நிலையை Cart & Orders -> Order History பகுதியில் (Processing, Dispatched, Completed) நேரடியாகப் பார்க்கலாம். குறிப்பிட்ட டெலிவரி தேதிக்கு +91 95147 14441 என்ற எண்ணில் அழைக்கவும் அல்லது admin@moshautomation.com-க்கு தொடர்பு கொள்ளவும்.',
    detailedAnswer: 'Once you place an order in Cart & Orders, you can track live status updates (Processing, Paid, Dispatched, Completed) inside Order History. Exact dispatch and courier delivery timelines depend on your pincode and installation requirements; please call +91 95147 14441 or check My Queries for exact dispatch ETA.',
    alternativePatterns: [
      'When will my order be delivered?',
      'How many days for delivery after ordering?',
      'Shipping time to Chennai or Coimbatore?',
      'Order panna ethana naal-la kidaikkum?',
      'Delivery eppo varum?'
    ]
  },

  // =========================================================================
  // INTENT: online_ordering_and_payment
  // =========================================================================
  {
    id: 'qa-007',
    originalQuestion: 'ஆன்லைனில் ஆர்டர் செய்வது எப்படி?',
    normalizedQuestion: 'how to order online and pay',
    intent: 'How to place an online order and pay',
    relatedProductId: null,
    category: 'ordering',
    language: 'ta',
    verifiedAnswer: 'Products பக்கத்தில் தேவையான கருவியை Add to Cart செய்து, Cart & Orders பக்கத்தில் டெலிவரி முகவரியை உள்ளிட்டு Razorpay UPI (GPay, PhonePe, Paytm) மூலம் பாதுகாப்பாக பணம் செலுத்தலாம். ₹5,000-க்கு மேல் ஆர்டர் செய்தால் 10% தள்ளுபடி கிடைக்கும்.',
    detailedAnswer: 'Steps to order: 1) Browse Products in the Customer Portal and click Add to Cart (select wire length and float option if needed). 2) Open Cart & Orders and click Proceed to Checkout. 3) Enter your delivery address and pincode, then pay via Razorpay UPI. Orders above ₹5,000 automatically get a 10% volume discount.',
    alternativePatterns: [
      'How do I place an order and pay online?',
      'Online-la order epdi panrathu? GPay / UPI-la pay pannalama?',
      'How to buy from website?',
      'Can I pay via UPI or Razorpay?',
      'Do you offer any bulk discount on orders?'
    ]
  },

  // =========================================================================
  // INTENT: company_and_recommendations
  // =========================================================================
  {
    id: 'qa-008',
    originalQuestion: 'suggest me a beest water level controller companies',
    normalizedQuestion: 'suggest best water level controller company',
    intent: 'Best water level controller recommendation and MOSH strengths',
    relatedProductId: 'p-1',
    category: 'products',
    language: 'en',
    verifiedAnswer: 'MOSH Automation (manufactured in Coimbatore, Tamil Nadu) offers reliable, electrolysis-free automatic water level controllers with a 1-year replacement warranty. Depending on your setup, our popular models are Auto Change Water Level Controller (₹3,200), Single Phase With Dry Run (₹3,600), Double Tank Fully Automated (₹4,800), and Wireless/GSM controllers.',
    detailedAnswer: 'MOSH Automation builds residential, agricultural, and industrial motor automation systems in Coimbatore (GSTIN: 33DLCPP0458M1ZW). Key advantages include food-grade SS304 magnetic sensors (10+ year life), built-in dry-run & voltage protection, wireless RF up to 1.5 km, GSM mobile control, and 1-year replacement warranty. Tell me your motor HP, phase (single/3-phase), and tank setup so I can recommend the exact model.',
    alternativePatterns: [
      'Which is the best water level controller brand?',
      'Which MOSH controller should I buy for home?',
      'Best automatic water level controller for home',
      'Which controller is best for a 1 HP home water motor?'
    ]
  },
  {
    id: 'qa-009',
    originalQuestion: 'intha website pannunathu yaaru',
    normalizedQuestion: 'who made this website unknown company query',
    intent: 'Website and company identity or out-of-scope question',
    relatedProductId: null,
    category: 'support',
    language: 'tanglish',
    verifiedAnswer: 'Idhu MOSH Automation-oda official customer portal (Coimbatore, Tamil Nadu). Website developer details enga system-la illa; products, pricing, orders, allathu technical support-ku +91 95147 14441 call pannalam.',
    detailedAnswer: 'This is the official portal for MOSH Automation, headquartered at 162 ABC-164, Andal Complex, Kamarajar Rd, Varadharajapuram, Coimbatore - 641015 (admin@moshautomation.com, +91 95147 14441). Specific developer credits are not part of the product catalog.',
    alternativePatterns: [
      'Who built this website?',
      'Who owns MOSH Automation?',
      'Where are MOSH Automation controllers manufactured?'
    ]
  },

  // =========================================================================
  // INTENT: dry_run_protection
  // =========================================================================
  {
    id: 'qa-010',
    originalQuestion: 'How does MOSH Automation dry-run protection save my submersible motor from burning out?',
    normalizedQuestion: 'how does dry run protection work to prevent motor burnout',
    intent: 'Dry-run protection mechanism and product selection',
    relatedProductId: 'p-10',
    category: 'dry_run',
    language: 'en',
    verifiedAnswer: 'Dry-run protection monitors either the sump water level sensor or the motor running current. As soon as water stops flowing, it cuts off the pump within seconds so the submersible motor windings and impellers do not overheat or melt.',
    detailedAnswer: 'For single-phase homes (0.5-1.5 HP), Single Phase Water Controller With Dry Run (₹3,600) uses low-level sensing + current monitoring and auto-restarts once the sump refills. For 3-phase borewells (3-15 HP), Three Phase Dry Run Preventer (₹4,300) detects underload current (1A-30A) in under 3 seconds without borewell sensor wires and auto-restarts after a programmable 15-180 min recharge delay.',
    alternativePatterns: [
      'How do dry-run preventers work?',
      'Borewell-la thanni illana motor burn aagama irukka enna controller podanum?',
      'Dry run aana motor off aaguma?',
      'Why is dry-run protection important for submersible pumps?',
      'போர்வெல்லில் தண்ணீர் இல்லாதபோது மோட்டார் எரியாமல் இருக்க என்ன கருவி பயன்படுத்த வேண்டும்?'
    ]
  },
  {
    id: 'qa-011',
    originalQuestion: 'Do you have a 3-phase dry-run preventer without borewell sensor wires?',
    normalizedQuestion: 'three phase dry run preventer without borewell sensor wires',
    intent: 'Three-phase current-sensing dry-run preventer',
    relatedProductId: 'p-9',
    category: 'dry_run',
    language: 'en',
    verifiedAnswer: 'Yes, the Three Phase Dry Run Preventer (₹4,300) monitors motor current (1A-30A) electronically with a 4-wire retrofit into your DOL or Star-Delta starter, needing no sensor wires down the borewell.',
    detailedAnswer: 'Three Phase Dry Run Preventer (₹4,300): 415V AC 3-Phase, 1A-30A adjustable current threshold, <3 seconds trip time on dry run, programmable auto-restart delay (15 to 180 minutes) for borewell recharge, compatible with DOL & Star-Delta starters, 1-Year Warranty.',
    alternativePatterns: [
      'Three Phase Dry Run Preventer price and specs',
      'Borewell kulla wire podama dry run protector irukka?',
      'After a dry-run cutoff, do I have to manually restart the motor?'
    ]
  },

  // =========================================================================
  // INTENT: wireless_telemetry_system
  // =========================================================================
  {
    id: 'qa-012',
    originalQuestion: 'Do you have a wireless water level controller if I cannot run cables from the roof?',
    normalizedQuestion: 'wireless water level controller without cable wiring price range',
    intent: 'Wireless water level controller modules, range, and pricing',
    relatedProductId: 'p-5',
    category: 'products',
    language: 'en',
    verifiedAnswer: 'Yes, our wireless system pairs the Wireless Controller Base Module (₹2,500) near your motor with the Wireless Tank Module (₹2,700) on the roof, communicating wirelessly up to 1.5 km line-of-sight (400m in buildings) with no Wi-Fi or SIM needed.',
    detailedAnswer: 'Wireless Controller Base Module (p-5, ₹2,500): 220V AC, inbuilt 30A relay, 868MHz/433MHz ISM band, fail-safe timeout if radio signal drops. Wireless Tank Module (p-3, ₹2,700): 3.3V DC AA Lithium battery (up to 2 years, solar option), IP67 weatherproof UV-stabilized housing, up to 4 level thresholds, low-battery alert. Zero monthly fees.',
    alternativePatterns: [
      'Maadi tank-la irunthu wire poda mudiyaathu, wireless model irukka?',
      'Wireless controller evlo dooram work aagum? 4 floor building-la signal kidaikuma?',
      'What is the range and battery life of the Wireless Controller Tank Module?',
      'Does the Wireless Water Level Controller need Wi-Fi or SIM?',
      'வயர் இல்லாமல் வேலை செய்யும் வாட்டர் லெவல் கண்ட்ரோலர் உள்ளதா?'
    ]
  },

  // =========================================================================
  // INTENT: gsm_mobile_remote_control
  // =========================================================================
  {
    id: 'qa-013',
    originalQuestion: 'Can I turn my water motor ON and OFF from my mobile phone?',
    normalizedQuestion: 'gsm mobile remote motor control sms missed call',
    intent: 'GSM mobile remote pump switching and alerts',
    relatedProductId: 'p-4',
    category: 'products',
    language: 'en',
    verifiedAnswer: 'Yes! GSM Based On-Off (₹3,100) lets up to 5 registered numbers switch the pump via missed call or SMS with power alerts. If you also want dry-run and phase protection, choose GSM Based On-Off with Dry Run (₹3,900).',
    detailedAnswer: 'GSM Based On-Off with Dry Run (p-4, ₹3,900): 220V-415V AC (single & 3-phase), 2G/4G SIM card, missed call / SMS / web app control, dry-run cutoff, phase reversal/failure & low-voltage cutoff, authorized phone authentication. Basic GSM Based On-Off (p-13, ₹3,100): 180V-260V AC, quad-band GSM, up to 5 registered numbers, power-restored SMS alerts, external high-gain antenna.',
    alternativePatterns: [
      'Thottathu motor-a veetla irunthe phone-la missed call panni ON/OFF panna mudiyuma?',
      'What is the difference between GSM Based On-Off and GSM Based On-Off with Dry Run?',
      'Can anyone else turn on my GSM controller by calling it?',
      'Does GSM controller notify when power comes back?',
      'மொபைல் போன் மூலம் மோட்டாரை ஆன்/ஆஃப் செய்ய முடியுமா?'
    ]
  },

  // =========================================================================
  // INTENT: high_hp_and_three_phase_motors
  // =========================================================================
  {
    id: 'qa-014',
    originalQuestion: 'Which controller works for 2 HP or 3 HP single-phase submersible motors?',
    normalizedQuestion: 'single phase controller above 1.5hp 2hp 3hp motor',
    intent: 'High-load single-phase controller above 1.5 HP',
    relatedProductId: 'p-12',
    category: 'motor_control',
    language: 'en',
    verifiedAnswer: 'For 2.0 HP to 3.0 HP single-phase pumps, use the Single Phase Controller Above 1.5HP (₹4,100). It includes a heavy-duty 40A industrial contactor and thermal overload trip.',
    detailedAnswer: 'Single Phase Controller Above 1.5HP (p-12, ₹4,100): 220V AC 50Hz, 2.0-3.0 HP capacity, 40A contactor with arc suppressor (prevents contact welding), thermal overload trip, overhead & sump interlock, auto-manual bypass, terminal blocks for 4 sq mm and 6 sq mm copper cables, 1-Year Heavy-Duty Warranty.',
    alternativePatterns: [
      'Enkitta 2HP / 3HP single phase submersible motor irukku, ethu podanum?',
      'What cable size does the Single Phase Controller Above 1.5HP support?'
    ]
  },
  {
    id: 'qa-015',
    originalQuestion: 'What controller do you offer for 3-phase industrial or agricultural motors?',
    normalizedQuestion: 'three phase fully automatic controller 3hp to 15hp',
    intent: 'Three-phase fully automatic motor controller',
    relatedProductId: 'p-8',
    category: 'motor_control',
    language: 'en',
    verifiedAnswer: 'The Three Phase Fully Automatic Controller (₹5,400) handles 3 HP to 15 HP 3-phase motors (DOL and Star-Delta) with single-phasing, phase-reversal, overload, and dry-run protection.',
    detailedAnswer: 'Three Phase Fully Automatic Controller (p-8, ₹5,400): 380V-440V AC 3-phase, 3-15 HP (DOL & Star-Delta), 32A/40A 3-pole contactor, phase voltage & run LEDs, electronic overload trip, powder-coated metal enclosure, 1-Year Industrial Warranty.',
    alternativePatterns: [
      '3 phase 5HP / 7.5HP / 10HP motor-ku automatic controller rate enna?',
      'Does the 3-phase controller work with both DOL and Star-Delta starters?',
      '3-ஃபேஸ் (Three Phase) மோட்டாருக்கு என்ன கண்ட்ரோலர் உள்ளது?'
    ]
  },

  // =========================================================================
  // INTENT: timer_and_corporation_water
  // =========================================================================
  {
    id: 'qa-016',
    originalQuestion: 'Which controller is best for scheduled municipal corporation water supply?',
    normalizedQuestion: 'water level controller with timer municipal corporation supply',
    intent: 'Cyclic digital timer controller for scheduled water supply',
    relatedProductId: 'p-7',
    category: 'products',
    language: 'en',
    verifiedAnswer: 'The Water Level Controller With Timer (₹2,900) is designed for municipal corporation water schedules. It supports cyclic ON/OFF, scheduled start, and a 1-120 minute max run-time limit.',
    detailedAnswer: 'Water Level Controller With Timer (p-7, ₹2,900): 220V-240V AC, up to 2 HP motor load, 7-segment LED display, EEPROM memory that preserves settings across power cuts, single-touch manual bypass, and 1-Year Warranty.',
    alternativePatterns: [
      'Corporation thanni varra time-ku mattum motor oda timer controller irukka?',
      'Will the Timer controller lose my settings if there is a power cut?',
      'கார்ப்பரேஷன் தண்ணீர் வரும் நேரத்திற்கு மட்டும் மோட்டார் ஓட டைமர் உள்ளதா?'
    ]
  },

  // =========================================================================
  // INTENT: float_switch
  // =========================================================================
  {
    id: 'qa-017',
    originalQuestion: 'What is the Float Switch price and can it be used for sump drainage or tank filling?',
    normalizedQuestion: 'float switch price tank filling sump drainage',
    intent: 'Magnetic cable float switch pricing and dual-mode operation',
    relatedProductId: 'p-14',
    category: 'products',
    language: 'en',
    verifiedAnswer: 'The Float Switch costs ₹1,200 in the catalog and has dual NO + NC contacts, so you can wire it either to fill an overhead tank (cut on high) or empty a drainage sump (cut on low).',
    detailedAnswer: 'Float Switch (p-14, ₹1,200): IP68 waterproof non-toxic polypropylene body, 16A / 250V AC dual microswitch (NO + NC), 3m/5m copper core cable, adjustable counterweight, 100,000+ cycle life, 1-Year Warranty.',
    alternativePatterns: [
      'How much is the Float Switch?',
      'Can the Float Switch be used to empty a drainage sump?'
    ]
  },

  // =========================================================================
  // INTENT: installation_wire_and_estimates
  // =========================================================================
  {
    id: 'qa-018',
    originalQuestion: 'How much wire is included, what is the extra wire cost, and what is the installation charge?',
    normalizedQuestion: 'wire cost per meter installation charge estimate gst',
    intent: 'Wire fees, float fees, installation charges, and custom estimates',
    relatedProductId: null,
    category: 'installation',
    language: 'en',
    verifiedAnswer: 'Wire packages cover 30m by default (₹150-₹400 base fee depending on the model) with extra cable at ₹5-₹15 per meter. Standard installation rate is ₹1,500 (plus 18% GST). You can request a custom PDF quotation in My Queries.',
    detailedAnswer: 'Wire 30m base + extra/m: Float Switch ₹150 + ₹5/m; Sensors ₹200 + ₹6/m; Auto Change / Single Phase / Timer / GSM / Wireless Base ₹300 + ₹10/m; Double Tank / Above 1.5HP / 3-Phase Dry Run ₹350 + ₹12/m; 3-Phase Fully Automatic ₹400 + ₹15/m. Standard billing defaults: Installation ₹1,500, GST 18%, Misc ₹1,000 if applicable.',
    alternativePatterns: [
      'Can I install the controller myself? What tools are required?',
      'Do I need to drill a hole in my water tank to fit the sensors?',
      'Installation naane pannalama? Tank-la ota podanuma?',
      'How do I request a custom quotation for my building?'
    ]
  },

  // =========================================================================
  // INTENT: troubleshooting_and_voltage
  // =========================================================================
  {
    id: 'qa-019',
    originalQuestion: 'My pump is not starting automatically or sensors are not detecting water. How do I troubleshoot?',
    normalizedQuestion: 'pump not starting automatically sensors not detecting troubleshoot',
    intent: 'Troubleshooting pump auto-start and sensor detection issues',
    relatedProductId: null,
    category: 'troubleshooting',
    language: 'en',
    verifiedAnswer: 'Check 3 things: 1) Main power is ON and voltage is above 180V. 2) The controller toggle switch is set to AUTO mode (and Sump Low LED is not lit). 3) Clean tank sensors gently with fine sandpaper and confirm wires are tight in the terminal block.',
    detailedAnswer: 'Full troubleshooting: Ensure voltage >180V AC, verify AUTO mode, inspect probes for biofilm/scaling and clean with fine sandpaper, tighten terminal block screws, and route low-voltage sensor cables away from high-power motor cables to avoid interference.',
    alternativePatterns: [
      'Motor auto-la start aagala, enna check pannanum?',
      'Tank full aagiyum motor off aagala, overflow aaguthu — enna problem?',
      'மோட்டார் தானாக ஆன் ஆகவில்லை என்றால் என்ன சரிபார்க்க வேண்டும்?',
      'Can controllers handle voltage fluctuations?'
    ]
  },
  {
    id: 'qa-020',
    originalQuestion: 'My GSM controller is offline or not replying to SMS. What should I check?',
    normalizedQuestion: 'gsm controller offline sms not coming troubleshoot',
    intent: 'Troubleshooting GSM controller connectivity and SMS alerts',
    relatedProductId: 'p-4',
    category: 'troubleshooting',
    language: 'en',
    verifiedAnswer: 'Verify that the SIM card has active validity and an SMS pack, check the signal LED, and place the external antenna outside any metal starter box.',
    detailedAnswer: 'GSM checklist: 1) Confirm SIM validity & SMS balance. 2) If the signal LED blinks slowly, mount the high-gain external antenna outside the metal panel enclosure. 3) Verify stable AC input voltage (180V-260V / 220V-415V depending on model).',
    alternativePatterns: [
      'GSM controller-la SMS varala / offline-nu kaattuthu, enna seiyanum?',
      'Which SIM card works in the GSM motor controller?'
    ]
  },

  // =========================================================================
  // INTENT: warranty_and_support_locations
  // =========================================================================
  {
    id: 'qa-021',
    originalQuestion: 'What is the warranty policy and where is MOSH Automation located in Coimbatore?',
    normalizedQuestion: 'warranty policy claim coimbatore office address phone email',
    intent: 'Warranty coverage, claims, Coimbatore locations, and contact info',
    relatedProductId: null,
    category: 'warranty',
    language: 'en',
    verifiedAnswer: 'All MOSH Automation controllers and sensors include a 1-Year Replacement Warranty. Our HQ & Factory is at 162 ABC-164, Andal Complex, Kamarajar Rd, Varadharajapuram, Coimbatore - 641015, and our Branch Office is at 10/9, Kaleeswara Mill Rd (Star Lodge), Coimbatore - 641009. Call +91 95147 14441 or email support@moshautomation.com.',
    detailedAnswer: 'Warranty: 1-Year Comprehensive Replacement Warranty from purchase date (claim with Order ID & serial number via support@moshautomation.com / admin@moshautomation.com or +91 95147 14441). HQ & Factory: 162 ABC-164, Andal Complex, Kamarajar Road, Varadharajapuram, Uppilipalayam, Coimbatore - 641015, TN. Branch: 10/9, Kaleeswara Mill Rd, Coimbatore - 641009, TN (Star Lodge). GSTIN: 33DLCPP0458M1ZW.',
    alternativePatterns: [
      'How do I claim a warranty replacement?',
      'Coimbatore-la unga shop / factory enga irukku? Phone number enna?',
      'Warranty ethana varusham irukku?',
      'MOSH கருவிகளுக்கு எத்தனை வருட வாரண்டி உள்ளது?',
      'Do you provide a GST invoice?'
    ]
  },

  // =========================================================================
  // INTENT: full_catalog_pricing_and_compatibility
  // =========================================================================
  {
    id: 'qa-022',
    originalQuestion: 'What is the full price list and pump compatibility of MOSH Automation controllers?',
    normalizedQuestion: 'full price list catalog compatible existing pump',
    intent: 'Catalog pricing overview and pump compatibility',
    relatedProductId: null,
    category: 'pricing',
    language: 'en',
    verifiedAnswer: 'MOSH controllers work with all existing monoblock, jet, openwell, and submersible pumps (single phase up to 3HP, 3-phase up to 15HP). Prices start at ₹1,200 (Float Switch) and ₹1,800 (Sensors), ₹2,900-₹4,800 for single-phase/timer/GSM/wireless models, and ₹4,300-₹5,400 for 3-phase controllers.',
    detailedAnswer: 'Full Verified Price List: Float Switch (p-14) ₹1,200 | Water Level Sensors (p-6) ₹1,800 | Wireless Controller Base Module (p-5) ₹2,500 | Wireless Tank Module (p-3) ₹2,700 | Water Level Controller With Timer (p-7) ₹2,900 | GSM Based On-Off (p-13) ₹3,100 | Auto Change Water Level Controller (p-1) ₹3,200 | Single Phase Fully Automatic (p-11) ₹3,400 | Single Phase With Dry Run (p-10) ₹3,600 | GSM Based On-Off with Dry Run (p-4) ₹3,900 | Single Phase Above 1.5HP (p-12) ₹4,100 | Three Phase Dry Run Preventer (p-9) ₹4,300 | Double Tank Fully Automated (p-2) ₹4,800 | Three Phase Fully Automatic (p-8) ₹5,400.',
    alternativePatterns: [
      'Can I install a MOSH controller on my existing water pump?',
      'Palaya motor-la MOSH controller set aaguma?',
      'Show all product prices'
    ]
  }
];

// Cache for admin-approved Q&A rows loaded from MySQL
let approvedCache = [];
let approvedCacheLoadedAt = 0;
const CACHE_TTL_MS = 60 * 1000;

function invalidateQaCache() {
  approvedCacheLoadedAt = 0;
}

async function getApprovedExamples() {
  if (Date.now() - approvedCacheLoadedAt < CACHE_TTL_MS && approvedCache.length >= 0 && approvedCacheLoadedAt > 0) {
    return approvedCache;
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, original_question, normalized_question, intent, related_product_id, verified_answer, alternative_patterns, language, category FROM approved_qa_examples ORDER BY id DESC'
    );
    approvedCache = rows.map((r) => {
      let patterns = [];
      if (r.alternative_patterns) {
        if (typeof r.alternative_patterns === 'string') {
          try { patterns = JSON.parse(r.alternative_patterns); } catch { patterns = []; }
        } else if (Array.isArray(r.alternative_patterns)) {
          patterns = r.alternative_patterns;
        }
      }
      return {
        id: `approved-${r.id}`,
        originalQuestion: r.original_question,
        normalizedQuestion: r.normalized_question,
        intent: r.intent,
        relatedProductId: r.related_product_id || null,
        category: r.category || 'general',
        language: r.language || 'en',
        verifiedAnswer: r.verified_answer,
        detailedAnswer: r.verified_answer,
        alternativePatterns: patterns
      };
    });
    approvedCacheLoadedAt = Date.now();
  } catch {
    // DB table may not be initialized in unit contexts; keep existing cache
  }
  return approvedCache;
}

/**
 * Normalizes English, Tamil, and Thanglish text including common customer typos.
 */
function normalizeText(str) {
  let s = String(str || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.₹]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const typoMap = [
    [/\bepapdi\b|\beppadi\b|\bepdi\b/g, 'eppadi'],
    [/\bsenors\b|\bsenser\b|\bsensar\b/g, 'sensor'],
    [/\bnort\b/g, 'not'],
    [/\bcomponenet\b|\bcomponant\b/g, 'component'],
    [/\bbeest\b/g, 'best'],
    [/\btanni\b|\bthanni\b/g, 'thanni'],
    [/\baguma\b|\baaguma\b/g, 'aaguma'],
    [/\bevalo\b|\bevlo\b/g, 'evlo'],
    [/\bennaku\b|\benaku\b/g, 'enakku']
  ];

  for (const [pattern, replacement] of typoMap) {
    s = s.replace(pattern, replacement);
  }
  return s;
}

/**
 * Character bigram similarity (Dice coefficient) for fuzzy typo matching.
 */
function bigramSimilarity(a, b) {
  if (!a || !b || a.length < 3 || b.length < 3) return 0;
  if (a === b) return 1;
  const getBigrams = (s) => {
    const set = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      set.set(bg, (set.get(bg) || 0) + 1);
    }
    return set;
  };
  const bgA = getBigrams(a);
  const bgB = getBigrams(b);
  let overlap = 0;
  for (const [bg, count] of bgA.entries()) {
    if (bgB.has(bg)) overlap += Math.min(count, bgB.get(bg));
  }
  return (2 * overlap) / (a.length - 1 + (b.length - 1));
}

/**
 * Retrieves top-K relevant Q&A items across built-in dataset and admin-approved DB examples.
 */
async function retrieveRelevantQa(query, topK = 5) {
  const normQuery = normalizeText(query);
  if (!normQuery) return [];

  const tokens = normQuery.split(' ').filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];

  const approved = await getApprovedExamples();
  const combined = [...approved, ...MOSH_QA_DATASET];

  const scored = combined.map((item) => {
    let score = 0;
    const corpusPhrases = [
      item.originalQuestion,
      item.normalizedQuestion,
      item.intent,
      ...(item.alternativePatterns || [])
    ].map(normalizeText);

    const joinedCorpus = corpusPhrases.join(' ');
    const corpusTokens = Array.from(new Set(joinedCorpus.split(' ').filter((t) => t.length >= 3)));

    // Phrase inclusion boost
    for (const phrase of corpusPhrases) {
      if (phrase && (normQuery.includes(phrase) || phrase.includes(normQuery))) {
        score += 10;
      }
    }

    // Exact & fuzzy token match
    for (const t of tokens) {
      if (joinedCorpus.includes(t)) {
        score += t.length >= 4 ? 3.5 : 2;
      } else if (t.length >= 4) {
        for (const ct of corpusTokens) {
          if (bigramSimilarity(t, ct) >= 0.72) {
            score += 2;
            break;
          }
        }
      }
    }

    // Language affinity
    const hasTamil = /[\u0B80-\u0BFF]/.test(query);
    if (hasTamil && item.language === 'ta') score += 3;

    // Slight boost for admin-approved examples
    if (String(item.id).startsWith('approved-')) score += 1.5;

    return { item, score };
  })
    .filter((entry) => entry.score >= 3)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((entry) => entry.item);
}

function isDetailedRequest(query) {
  return /detail|spec|technical|explain|how does|working principle|wiring|volt|amp|hp|compare|difference|full list|price list|vilakkam|details sollunga|epdi work|eppadi work|epapdi work/i.test(
    query || ''
  );
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

module.exports = {
  MOSH_QA_DATASET,
  retrieveRelevantQa,
  isDetailedRequest,
  decodeHtmlEntities,
  normalizeText,
  invalidateQaCache
};
