// Valores diários de extras informados pela operação, em centavos.
export const extraRates = [
  { id: 'ifc-embu', operation: 'IFC Embu', cents: 20000 },
  { id: 'ifc-extrema-24686', operation: 'IFC Extrema', cents: 24686 },
  { id: 'ifc-extrema-24616', operation: 'IFC Extrema', cents: 24616 },
  { id: 'viena-lar-center', operation: 'Viena Lar Center', cents: 15000 },
  ...['Granja V.', 'Morumbi', 'Eldorado', 'Higienópolis', 'Pátio Paulista'].map((store, i) => ({ id: `viena-lideranca-asg-${i}`, operation: `Viena ${store} — Liderança e ASG`, cents: 20000 })),
  ...['Morumbi', 'Higienópolis'].map((store, i) => ({ id: `viena-gerencia-${i}`, operation: `Viena ${store} — Gerência`, cents: 25000 })),
  ...['Cozinheiro', 'Açougueiro'].flatMap((role, i) => [15000, 12600].map(cents => ({ id: `ra-vcp-${i}-${cents}`, operation: `RA VCP — ${role}`, cents }))),
  { id: 'ra-vcp-lk', operation: 'RA VCP — LK', cents: 12000 },
  { id: 'ra-confins', operation: 'RA Confins', cents: 13000 },
  { id: 'kfc-sbc-lavacao', operation: 'KFC SBC — Lavação', cents: 13000 },
];
