export const productImageOptions = [
  {
    value: '/Auto_Change_WaterLevel_Controller.png',
    label: 'Auto Change Water Level Controller'
  },
  {
    value: '/Dobule_Tank_FullyAutomated.png',
    label: 'Double Tank Fully Automated'
  },
  {
    value: '/Wireless_Controller-Tank_Module.png',
    label: 'Wireless Controller Tank Module'
  },
  {
    value: '/Wireless_Controller-Base_Module.png',
    label: 'Wireless Controller Base Module'
  },
  {
    value: '/Water_Level_Sensors.png',
    label: 'Water Level Sensors'
  },
  {
    value: '/Water_LevelController_With_Timer.png',
    label: 'Water Level Controller With Timer'
  },
  {
    value: '/Three_Phase_Fully_Automatic_Controller.png',
    label: 'Three Phase Fully Automatic Controller'
  },
  {
    value: '/Three_Phase_Dry_Run_Preventer.png',
    label: 'Three Phase Dry Run Preventer'
  },
  {
    value: '/Single_Phase_Water_Controller_With_Dry_Run.png',
    label: 'Single Phase Water Controller With Dry Run'
  },
  {
    value: '/Single_Phase_Fully_Automatic_Controller.png',
    label: 'Single Phase Fully Automatic Controller'
  },
  {
    value: '/Single_Phase_Controller_Above-1.5HP.png',
    label: 'Single Phase Controller Above 1.5HP'
  },
  {
    value: '/GSM_Based_On-Off_With_Dry-run.png',
    label: 'GSM Based On-Off With Dry Run'
  },
  {
    value: '/GSM_Based_On-Off.png',
    label: 'GSM Based On-Off'
  },
  {
    value: '/Float_Switch.png',
    label: 'Float Switch'
  }
];

export const defaultProducts = [
  {
    id: 'p-1',
    name: 'Auto Change Water Level Controller',
    description: 'Automatic tank control with smart water level switching and overflow protection.',
    price: 3200,
    image: productImageOptions[0].value,
    floatFee: 150,
    wire: { baseFee: 300, baseMeters: 30, extraPerMeter: 10 }
  },
  {
    id: 'p-2',
    name: 'Double Tank Fully Automated',
    description: 'Dual tank automation for dependable water transfer and monitoring.',
    price: 4800,
    image: productImageOptions[1].value,
    floatFee: 200,
    wire: { baseFee: 350, baseMeters: 30, extraPerMeter: 12 }
  },
  {
    id: 'p-3',
    name: 'Wireless Tank Module',
    description: 'Remote tank module for connected water level tracking and control.',
    price: 2700,
    image: productImageOptions[2].value,
    floatFee: 0,
    wire: { baseFee: 250, baseMeters: 30, extraPerMeter: 8 }
  },
  {
    id: 'p-4',
    name: 'GSM Based On-Off with Dry Run',
    description: 'GSM enabled automation with dry run protection for safer operation.',
    price: 3900,
    image: productImageOptions[11].value,
    floatFee: 0,
    wire: { baseFee: 300, baseMeters: 30, extraPerMeter: 10 }
  },
  {
    id: 'p-5',
    name: 'Wireless Controller Base Module',
    description: 'Base unit for wireless control and tank management automation.',
    price: 2500,
    image: productImageOptions[3].value,
    floatFee: 100,
    wire: { baseFee: 300, baseMeters: 30, extraPerMeter: 10 }
  },
  {
    id: 'p-6',
    name: 'Water Level Sensors',
    description: 'Precision sensors for accurate water level monitoring and alerts.',
    price: 1800,
    image: productImageOptions[4].value,
    floatFee: 80,
    wire: { baseFee: 200, baseMeters: 30, extraPerMeter: 6 }
  },
  {
    id: 'p-7',
    name: 'Water Level Controller With Timer',
    description: 'Timer-based controller for scheduled water management.',
    price: 2900,
    image: productImageOptions[5].value,
    floatFee: 120,
    wire: { baseFee: 300, baseMeters: 30, extraPerMeter: 10 }
  },
  {
    id: 'p-8',
    name: 'Three Phase Fully Automatic Controller',
    description: 'Heavy-duty automation controller for three-phase systems.',
    price: 5400,
    image: productImageOptions[6].value,
    floatFee: 0,
    wire: { baseFee: 400, baseMeters: 30, extraPerMeter: 15 }
  },
  {
    id: 'p-9',
    name: 'Three Phase Dry Run Preventer',
    description: 'Protective dry run preventer for three-phase pump safety.',
    price: 4300,
    image: productImageOptions[7].value,
    floatFee: 0,
    wire: { baseFee: 350, baseMeters: 30, extraPerMeter: 12 }
  },
  {
    id: 'p-10',
    name: 'Single Phase Water Controller With Dry Run',
    description: 'Single-phase automation with built-in dry run protection.',
    price: 3600,
    image: productImageOptions[8].value,
    floatFee: 0,
    wire: { baseFee: 300, baseMeters: 30, extraPerMeter: 10 }
  },
  {
    id: 'p-11',
    name: 'Single Phase Fully Automatic Controller',
    description: 'Compact automatic controller for single-phase water systems.',
    price: 3400,
    image: productImageOptions[9].value,
    floatFee: 80,
    wire: { baseFee: 300, baseMeters: 30, extraPerMeter: 10 }
  },
  {
    id: 'p-12',
    name: 'Single Phase Controller Above 1.5HP',
    description: 'Controller designed for higher-load single-phase pump setups.',
    price: 4100,
    image: productImageOptions[10].value,
    floatFee: 0,
    wire: { baseFee: 350, baseMeters: 30, extraPerMeter: 12 }
  },
  {
    id: 'p-13',
    name: 'GSM Based On-Off',
    description: 'Remote GSM switching controller for flexible water management.',
    price: 3100,
    image: productImageOptions[12].value,
    floatFee: 0,
    wire: { baseFee: 300, baseMeters: 30, extraPerMeter: 10 }
  },
  {
    id: 'p-14',
    name: 'Float Switch',
    description: 'Durable float switch for simple and reliable level detection.',
    price: 1200,
    image: productImageOptions[13].value,
    floatFee: 400,
    wire: { baseFee: 150, baseMeters: 30, extraPerMeter: 5 }
  }
];

export const defaultBillingSettings = {
  InstallationRate: 0.12,
  taxRate: 0.18,
  miscellaneousFee: 1000,
  notes: 'Standard billing defaults for estimation calculations.'
};

export const loginPhones = {
  admin: '0987654321'
};
