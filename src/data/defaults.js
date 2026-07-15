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
    price: 32000,
    image: productImageOptions[0].value
  },
  {
    id: 'p-2',
    name: 'Double Tank Fully Automated',
    description: 'Dual tank automation for dependable water transfer and monitoring.',
    price: 48000,
    image: productImageOptions[1].value
  },
  {
    id: 'p-3',
    name: 'Wireless Tank Module',
    description: 'Remote tank module for connected water level tracking and control.',
    price: 27000,
    image: productImageOptions[2].value
  },
  {
    id: 'p-4',
    name: 'GSM Based On-Off with Dry Run',
    description: 'GSM enabled automation with dry run protection for safer operation.',
    price: 39000,
    image: productImageOptions[11].value
  },
  {
    id: 'p-5',
    name: 'Wireless Controller Base Module',
    description: 'Base unit for wireless control and tank management automation.',
    price: 25000,
    image: productImageOptions[3].value
  },
  {
    id: 'p-6',
    name: 'Water Level Sensors',
    description: 'Precision sensors for accurate water level monitoring and alerts.',
    price: 18000,
    image: productImageOptions[4].value
  },
  {
    id: 'p-7',
    name: 'Water Level Controller With Timer',
    description: 'Timer-based controller for scheduled water management.',
    price: 29000,
    image: productImageOptions[5].value
  },
  {
    id: 'p-8',
    name: 'Three Phase Fully Automatic Controller',
    description: 'Heavy-duty automation controller for three-phase systems.',
    price: 54000,
    image: productImageOptions[6].value
  },
  {
    id: 'p-9',
    name: 'Three Phase Dry Run Preventer',
    description: 'Protective dry run preventer for three-phase pump safety.',
    price: 43000,
    image: productImageOptions[7].value
  },
  {
    id: 'p-10',
    name: 'Single Phase Water Controller With Dry Run',
    description: 'Single-phase automation with built-in dry run protection.',
    price: 36000,
    image: productImageOptions[8].value
  },
  {
    id: 'p-11',
    name: 'Single Phase Fully Automatic Controller',
    description: 'Compact automatic controller for single-phase water systems.',
    price: 34000,
    image: productImageOptions[9].value
  },
  {
    id: 'p-12',
    name: 'Single Phase Controller Above 1.5HP',
    description: 'Controller designed for higher-load single-phase pump setups.',
    price: 41000,
    image: productImageOptions[10].value
  },
  {
    id: 'p-13',
    name: 'GSM Based On-Off',
    description: 'Remote GSM switching controller for flexible water management.',
    price: 31000,
    image: productImageOptions[12].value
  },
  {
    id: 'p-14',
    name: 'Float Switch',
    description: 'Durable float switch for simple and reliable level detection.',
    price: 12000,
    image: productImageOptions[13].value
  }
];

export const defaultBillingSettings = {
  installationRate: 0.12,
  taxRate: 0.18,
  miscellaneousFee: 500,
  notes: 'Standard billing defaults for estimation calculations.'
};

export const loginPhones = {
  admin: '0987654321'
};
