// Utility for food photography asset mapping

export const FOOD_IMAGES: Record<string, string> = {
  rice: '/images/steamed_basmati_rice.jpg',
  basmati: '/images/steamed_basmati_rice.jpg',
  paneer: '/images/paneer_butter_masala.jpg',
  butter_masala: '/images/paneer_butter_masala.jpg',
  sambar: '/images/vegetable_sambar.jpg',
  dal: '/images/vegetable_sambar.jpg',
  lentil: '/images/vegetable_sambar.jpg',
  salad: '/images/fresh_green_salad.jpg',
  green: '/images/fresh_green_salad.jpg',
  biryani: '/images/chicken_biryani.jpg',
  chicken: '/images/chicken_biryani.jpg',
  curry: '/images/chicken_biryani.jpg',
  gulab_jamun: '/images/gulab_jamun.jpg',
  dessert: '/images/gulab_jamun.jpg',
  sweet: '/images/gulab_jamun.jpg',
  kitchen: '/images/kitchen_hero.jpg'
};

export const getFoodItemImage = (name?: string, category?: string): string => {
  if (!name) return '/images/steamed_basmati_rice.jpg';
  const lower = name.toLowerCase();

  if (lower.includes('biryani') || lower.includes('chicken') || lower.includes('non-veg') || lower.includes('poultry') || lower.includes('meat')) {
    return '/images/chicken_biryani.jpg';
  }
  if (lower.includes('paneer') || lower.includes('masala') || lower.includes('tikka') || lower.includes('gravy')) {
    return '/images/paneer_butter_masala.jpg';
  }
  if (lower.includes('sambar') || lower.includes('dal') || lower.includes('lentil') || lower.includes('soup') || lower.includes('rasam')) {
    return '/images/vegetable_sambar.jpg';
  }
  if (lower.includes('salad') || lower.includes('cucumber') || lower.includes('produce') || lower.includes('green') || lower.includes('vegetable')) {
    return '/images/fresh_green_salad.jpg';
  }
  if (lower.includes('jamun') || lower.includes('gulab') || lower.includes('dessert') || lower.includes('sweet') || lower.includes('halwa') || lower.includes('pudding') || lower.includes('bakery')) {
    return '/images/gulab_jamun.jpg';
  }
  if (lower.includes('rice') || lower.includes('pulao') || lower.includes('khichdi') || lower.includes('grain')) {
    return '/images/steamed_basmati_rice.jpg';
  }

  // Category fallbacks
  if (category) {
    const catLower = category.toLowerCase();
    if (catLower.includes('meat') || catLower.includes('poultry')) return '/images/chicken_biryani.jpg';
    if (catLower.includes('dairy') || catLower.includes('dessert') || catLower.includes('bakery')) return '/images/gulab_jamun.jpg';
    if (catLower.includes('produce') || catLower.includes('salad')) return '/images/fresh_green_salad.jpg';
    if (catLower.includes('grains') || catLower.includes('staples')) return '/images/steamed_basmati_rice.jpg';
    if (catLower.includes('cooked')) return '/images/paneer_butter_masala.jpg';
  }

  return '/images/steamed_basmati_rice.jpg';
};

export const CULINARY_HIGHLIGHTS = [
  {
    name: 'Steamed Basmati Rice',
    category: 'Cooked Meals / Grains',
    image: '/images/steamed_basmati_rice.jpg',
    shelfLife: '1 Day',
    storage: 'Steam Holding > 65°C',
    benchmarkUnitCost: 45.00
  },
  {
    name: 'Paneer Butter Masala',
    category: 'Cooked Meals / Gravy',
    image: '/images/paneer_butter_masala.jpg',
    shelfLife: '2 Days',
    storage: 'Refrigerated < 4°C',
    benchmarkUnitCost: 120.00
  },
  {
    name: 'Vegetable Sambar Dal',
    category: 'Cooked Meals / Soups',
    image: '/images/vegetable_sambar.jpg',
    shelfLife: '1 Day',
    storage: 'Hot Well Holding > 60°C',
    benchmarkUnitCost: 35.00
  },
  {
    name: 'Garden Fresh Salad',
    category: 'Produce & Salads',
    image: '/images/fresh_green_salad.jpg',
    shelfLife: '2 Days',
    storage: 'Cold Line < 5°C',
    benchmarkUnitCost: 55.00
  },
  {
    name: 'Royal Dum Biryani',
    category: 'Cooked Meals / Specials',
    image: '/images/chicken_biryani.jpg',
    shelfLife: '1 Day',
    storage: 'Hot Well Holding > 65°C',
    benchmarkUnitCost: 160.00
  },
  {
    name: 'Gulab Jamun Saffron Sweets',
    category: 'Dairy & Desserts',
    image: '/images/gulab_jamun.jpg',
    shelfLife: '4 Days',
    storage: 'Ambient / Covered Pan',
    benchmarkUnitCost: 90.00
  }
];
