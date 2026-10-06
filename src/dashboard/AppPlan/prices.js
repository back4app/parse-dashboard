// BaaS plans shown on Plan Usage and sold by the direct checkout.
export const prices = [
  {
    id: 0,
    name: 'MVP',
    desc: 'Validate Ideas Quickly — Launch Fast on Our Managed Serverless Backend',
    pricePerMonth: '25',
    monthlyPlanId: 'gXGhzlMHZ6',
    monthlyProductId: 'pri_01jjyr3kxmsav875y1v2p8h68k',
    pricePerYear: '15',
    annuallyPlanId: 'nUAySI815X',
    annuallyProductId: 'pri_01jjyr5r3ayqcs5cr58bm5b4rw',
    priceTag: 'Per App / Month',
    savePercent: '40%',
    details: [
      {
        text: 'Web hosting on a b4a.app subdomain',
      },
      {
        text: 'Daily Backups',
      },
      {
        text: 'Latest MongoDB',
      },
      {
        text: 'Custom email templates',
      },
      {
        number: 'Up to 3',
        text: 'collaborators',
      },
      {
        number: '500 K',
        text: 'Requests',
      },
      {
        number: '1 GB',
        text: 'Data Storage',
      },
      {
        number: '250 GB',
        text: 'Data Transfer',
      },
      {
        number: '50 GB',
        text: 'File Storage',
      },
    ],
    icon: 'b4a-mvp-plan-icon',
    greenText: 'Go live with web hosting'
  },
  {
    id: 1,
    name: 'Pay As You Go',
    desc: 'Run & Scale Applications on a Serverless Infrastructure',
    pricePerMonth: '100',
    monthlyPlanId: '7xWmyzNUvZ',
    monthlyProductId: 'pri_01jjyr4fs9j1926g5tv54jvs0h',
    pricePerYear: '80',
    annuallyPlanId: 'YfX9ryk4UH',
    annuallyProductId: 'pri_01jjyr4zj8dzg88xf82mtrnk6k',
    priceTag: 'Per App / Month',
    savePercent: '20%',
    details: [
      {
        number: '5 M',
        text: 'Requests',
      },
      {
        number: '3 GB',
        text: 'Data Storage',
      },
      {
        number: '1 TB',
        text: 'Data Transfer',
      },
      {
        number: '250 GB',
        text: 'File Storage',
      },
      {
        text: 'Daily Backups',
      },
      {
        text: 'Custom domain',
      },
      {
        text: 'HTTPS on your custom domain',
      },
      {
        text: 'SOC 2 and ISO 27001',
      },
    ],
    icon: 'b4a-pay-as-you-go-plan-icon',
    greenText: '200x more requests'
  },
  {
    id: 2,
    name: 'Dedicated',
    desc: 'Production-Grade Speed, Isolation & Flexibility on Dedicated Resources',
    pricePerMonth: '500',
    monthlyPlanId: 'VGaDTCDNbi',
    pricePerYear: '400',
    monthlyProductId: 'pri_01jjyrqff5wb1pkcekge3ddrtz',
    annuallyPlanId: 'U8nRA9rxdD',
    annuallyProductId: 'pri_01jjyrsbcexqvqzsjvby0ykw2h',
    priceTag: 'Per App / Month',
    savePercent: '20%',
    details: [
      {
        text: 'Unlimited Requests',
      },
      {
        number: '10 CPUs / 14 GB',
      },
      {
        number: '8 GB',
        text: 'Data Storage',
      },
      {
        number: '2 TB',
        text: 'Data Transfer',
      },
      {
        number: '1 TB',
        text: 'File Storage',
      },
      {
        text: 'Point-in-Time Backups',
      },
      {
        text: 'SOC 2 and ISO 27001',
      },
      {
        text: 'HIPAA After BAA Signed',
      },
    ],
    icon: 'b4a-dedicated-plan-icon',
    greenText: 'Unlimited requests'
  },
];
