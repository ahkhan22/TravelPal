import type { Expense, Trip } from './types';

// ---------------------------------------------------------------------------
// Sample trip. This is what the app opens to today; it stands in for data that
// will later come from real photos, email receipts and card charges.
// ---------------------------------------------------------------------------

export const SAMPLE_TRIP: Trip = {
  id: 'lahore-2026',
  title: 'Lahore, Pakistan',
  destination: 'Lahore',
  subtitle: 'Six days of old-city walls, rooftop karahi, and family — March 2026',
  route: 'SFO ✈ DOH · DOH ✈ LHE · Qatar Airways',
  coverGradient: 7,
  homeCurrency: 'USD',
  photosKept: 184,
  days: [
    {
      index: 1,
      dateLabel: 'Thu · Mar 12',
      title: 'Landing in Lahore',
      heroes: [
        { caption: 'Touchdown at Allama Iqbal Intl', gradient: 2 },
        { caption: 'Midnight nihari, Lakshmi Chowk', gradient: 3 },
      ],
      meals: [
        {
          id: 'm1',
          name: 'Waris Nihari',
          location: 'Lakshmi Chowk · 11:40pm',
          dish: 'Beef **nihari** + kulcha',
          rating: 5,
          gradient: 3,
          receipt: {
            items: [
              { label: 'Beef Nihari ×2', price: '900' },
              { label: 'Kulcha ×4', price: '320' },
              { label: 'Doodh Patti ×2', price: '180' },
            ],
            total: 'PKR 1,400',
            usd: '$5',
            source: 'scan',
          },
        },
      ],
      places: [
        { id: 'p1', name: 'Johar Town', note: 'A slow midnight walk to shake off 22 hours of flying.', gradient: 6 },
      ],
      gallery: ['Landing at LHE', 'Family at arrivals', 'The drive into town', 'Nihari pot on the fire', 'Kulcha off the tandoor', 'Street chai stand'],
      photoCount: 9,
    },
    {
      index: 2,
      dateLabel: 'Fri · Mar 13',
      title: 'Into the Walled City',
      heroes: [
        { caption: 'Badshahi Mosque, golden hour', gradient: 7 },
        { caption: 'Sheesh Mahal mirror work', gradient: 0 },
      ],
      meals: [
        {
          id: 'm2',
          name: 'Andaaz Restaurant',
          location: 'Food Street · rooftop',
          dish: '**Seekh kebab** & **dal makhani**',
          rating: 4,
          gradient: 2,
          receipt: {
            items: [
              { label: 'Chicken Seekh Kebab', price: '1,800' },
              { label: 'Dal Makhani', price: '1,400' },
              { label: 'Butter Naan ×3', price: '450' },
              { label: 'Kashmiri Chai ×2', price: '700' },
              { label: 'Service 10%', price: '435' },
            ],
            total: 'PKR 5,600',
            usd: '$20',
            source: 'email',
          },
        },
      ],
      places: [
        { id: 'p2', name: 'Badshahi Mosque', note: 'Walked the whole courtyard barefoot at sunset.', gradient: 1 },
        { id: 'p3', name: 'Lahore Fort', note: 'Sheesh Mahal — the Mughal hall of mirrors.', gradient: 3 },
      ],
      gallery: ['Badshahi archway', 'Courtyard at dusk', 'Minaret detail', 'Fort ramparts', 'Sheesh Mahal ceiling', 'Naulakha Pavilion', 'Rooftop dinner view', 'Food Street lights'],
      photoCount: 41,
    },
    {
      index: 3,
      dateLabel: 'Sat · Mar 14',
      title: 'Tiles & rooftops',
      heroes: [
        { caption: 'Wazir Khan tilework, up close', gradient: 4 },
        { caption: 'Charred mutton karahi', gradient: 1 },
      ],
      meals: [
        {
          id: 'm3',
          name: 'Butt Karahi',
          location: 'Lakshmi Chowk',
          dish: '**Mutton karahi** + garlic naan',
          rating: 5,
          gradient: 1,
          receipt: {
            items: [
              { label: 'Mutton Karahi 1kg', price: '2,400' },
              { label: 'Garlic Naan ×4', price: '240' },
              { label: 'Fresh Lime Soda ×2', price: '360' },
              { label: 'Salad & Raita', price: '200' },
            ],
            total: 'PKR 3,200',
            usd: '$11',
            source: 'scan',
          },
        },
      ],
      places: [
        { id: 'p4', name: 'Wazir Khan Mosque', note: 'The kashi-kari tiles are unreal in person.', gradient: 4 },
        { id: 'p5', name: 'Delhi Gate bazaar', note: 'Wandered the old spice lanes on the way in.', gradient: 5 },
      ],
      gallery: ['Wazir Khan facade', 'Tile calligraphy', 'Prayer hall arches', 'Karahi on the flame', 'Naan being slapped', 'Old city rooftops'],
      photoCount: 28,
    },
    {
      index: 4,
      dateLabel: 'Sun · Mar 15',
      title: 'Minar & Anarkali',
      heroes: [
        { caption: 'Me in front of Minar-e-Pakistan', gradient: 6, favorite: true },
        { caption: 'Anarkali bazaar colour', gradient: 3 },
      ],
      meals: [
        {
          id: 'm4',
          name: 'Anarkali street food',
          location: 'Anarkali Bazaar',
          dish: '**Gol gappay** & falooda',
          rating: 4,
          gradient: 3,
          receipt: {
            items: [
              { label: 'Gol Gappay ×2', price: '300' },
              { label: 'Falooda', price: '280' },
              { label: 'Fresh Pomegranate', price: '220' },
            ],
            total: 'PKR 800',
            usd: '$3',
            source: 'scan',
          },
        },
      ],
      places: [
        { id: 'p6', name: 'Minar-e-Pakistan', note: 'Iqbal Park. The shot I actually printed and framed.', gradient: 6, favorite: true },
      ],
      gallery: ['Minar from the base', 'Iqbal Park lawns', 'Anarkali fabric stalls', 'Bangles wall', 'Falooda glass', 'Rickshaw ride home'],
      photoCount: 35,
    },
    {
      index: 5,
      dateLabel: 'Mon · Mar 16',
      title: 'Gardens & the border',
      heroes: [
        { caption: 'Shalimar water channels', gradient: 5 },
        { caption: 'Wagah flag ceremony', gradient: 2 },
      ],
      meals: [
        {
          id: 'm5',
          name: "Salt'n Pepper Village",
          location: 'The Mall',
          dish: 'Buffet — **haleem**, biryani, kheer',
          rating: 4,
          gradient: 0,
          receipt: {
            items: [
              { label: 'Village Buffet ×2', price: '3,200' },
              { label: 'Soft Drinks', price: '360' },
              { label: 'Tax', price: '440' },
            ],
            total: 'PKR 4,000',
            usd: '$14',
            source: 'email',
          },
        },
      ],
      places: [
        { id: 'p7', name: 'Shalimar Gardens', note: 'Terraced Mughal gardens, nearly empty at 8am.', gradient: 5 },
        { id: 'p8', name: 'Wagah Border', note: 'The evening flag-lowering. Louder than any stadium.', gradient: 2 },
      ],
      gallery: ['Shalimar terrace', 'Fountain channel', 'Marble pavilion', 'Wagah crowd', 'The gate at dusk', 'Guards high-kicking'],
      photoCount: 30,
    },
    {
      index: 6,
      dateLabel: 'Tue · Mar 17',
      title: 'Farewell & fly home',
      heroes: [
        { caption: "Last handi at Cooco's Den", gradient: 5 },
        { caption: 'Departures, LHE', gradient: 2 },
      ],
      meals: [
        {
          id: 'm6',
          name: "Cooco's Den & Café",
          location: 'Roshnai Gate',
          dish: '**Chicken handi** under the mosque',
          rating: 4,
          gradient: 5,
          receipt: {
            items: [
              { label: 'Chicken Handi', price: '2,600' },
              { label: 'Tandoori Roti ×4', price: '280' },
              { label: 'Kashmiri Chai ×2', price: '700' },
              { label: 'Service', price: '520' },
            ],
            total: 'PKR 4,100',
            usd: '$15',
            source: 'email',
          },
        },
      ],
      places: [
        { id: 'p9', name: 'Roshnai Gate walk', note: 'One last loop of the old city before the airport.', gradient: 1 },
      ],
      gallery: ["Cooco's Den courtyard", 'String lights & qawwali', 'Badshahi lit at night', 'Packed bags', 'Boarding pass', 'Wheels up over Lahore'],
      photoCount: 11,
    },
  ],
};

// Seed expenses. Flights & hotel are trip-wide (dayIndex null); the rest are
// attributed to the day they happened on.
export const SAMPLE_EXPENSES: Expense[] = [
  { id: 'e-flights', tripId: 'lahore-2026', dayIndex: null, label: 'Qatar Airways · SFO–LHE', category: 'Flights', amountHome: 920, source: 'email' },
  { id: 'e-hotel', tripId: 'lahore-2026', dayIndex: null, label: 'Nishat Hotel · 5 nights', category: 'Hotel', amountHome: 590, source: 'email' },

  { id: 'e1a', tripId: 'lahore-2026', dayIndex: 1, label: 'Airport taxi — Careem', category: 'Transport', amountHome: 8, source: 'scan' },
  { id: 'e1b', tripId: 'lahore-2026', dayIndex: 1, label: 'Waris Nihari', category: 'Food', amountHome: 5, source: 'scan' },
  { id: 'e1c', tripId: 'lahore-2026', dayIndex: 1, label: 'Water & snacks', category: 'Other', amountHome: 2, source: 'card' },

  { id: 'e2a', tripId: 'lahore-2026', dayIndex: 2, label: 'Andaaz Restaurant', category: 'Food', amountHome: 20, source: 'email' },
  { id: 'e2b', tripId: 'lahore-2026', dayIndex: 2, label: 'Fort + mosque tickets', category: 'Activities', amountHome: 4, source: 'scan' },
  { id: 'e2c', tripId: 'lahore-2026', dayIndex: 2, label: 'Careem rides ×3', category: 'Transport', amountHome: 6, source: 'scan' },
  { id: 'e2d', tripId: 'lahore-2026', dayIndex: 2, label: 'Tile magnet souvenir', category: 'Shopping', amountHome: 15, source: 'scan' },

  { id: 'e3a', tripId: 'lahore-2026', dayIndex: 3, label: 'Bazaar textiles', category: 'Shopping', amountHome: 62, source: 'scan' },
  { id: 'e3b', tripId: 'lahore-2026', dayIndex: 3, label: 'Butt Karahi', category: 'Food', amountHome: 11, source: 'scan' },
  { id: 'e3c', tripId: 'lahore-2026', dayIndex: 3, label: 'Careem rides', category: 'Transport', amountHome: 5, source: 'scan' },
  { id: 'e3d', tripId: 'lahore-2026', dayIndex: 3, label: 'Wazir Khan donation', category: 'Other', amountHome: 2, source: 'card' },

  { id: 'e4a', tripId: 'lahore-2026', dayIndex: 4, label: 'Anarkali clothes', category: 'Shopping', amountHome: 120, source: 'scan' },
  { id: 'e4b', tripId: 'lahore-2026', dayIndex: 4, label: 'Chai & sweets', category: 'Food', amountHome: 8, source: 'scan' },
  { id: 'e4c', tripId: 'lahore-2026', dayIndex: 4, label: 'Gol gappay + falooda', category: 'Food', amountHome: 3, source: 'scan' },
  { id: 'e4d', tripId: 'lahore-2026', dayIndex: 4, label: 'Rickshaw', category: 'Transport', amountHome: 2, source: 'scan' },
  { id: 'e4e', tripId: 'lahore-2026', dayIndex: 4, label: 'Minar tickets', category: 'Activities', amountHome: 2, source: 'scan' },

  { id: 'e5a', tripId: 'lahore-2026', dayIndex: 5, label: 'Handicrafts', category: 'Shopping', amountHome: 53, source: 'scan' },
  { id: 'e5b', tripId: 'lahore-2026', dayIndex: 5, label: 'Wagah round-trip taxi', category: 'Transport', amountHome: 20, source: 'scan' },
  { id: 'e5c', tripId: 'lahore-2026', dayIndex: 5, label: "Salt'n Pepper buffet", category: 'Food', amountHome: 14, source: 'email' },
  { id: 'e5d', tripId: 'lahore-2026', dayIndex: 5, label: 'Garden tickets', category: 'Activities', amountHome: 3, source: 'scan' },

  { id: 'e6a', tripId: 'lahore-2026', dayIndex: 6, label: 'Gifts & sweets for home', category: 'Shopping', amountHome: 41, source: 'scan' },
  { id: 'e6b', tripId: 'lahore-2026', dayIndex: 6, label: "Cooco's Den", category: 'Food', amountHome: 15, source: 'email' },
  { id: 'e6c', tripId: 'lahore-2026', dayIndex: 6, label: 'Airport Careem', category: 'Transport', amountHome: 9, source: 'scan' },
];
