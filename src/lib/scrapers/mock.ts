const techRetailers = ['JB Hi-Fi', 'Amazon AU', 'Kmart', 'Big W', 'Officeworks'];
const groceryRetailers = ['Woolworths', 'Coles', 'Aldi', 'IGA', 'Amazon AU'];

const retailerUrls: Record<string, string> = {
  'JB Hi-Fi': 'https://www.jbhifi.com.au',
  'Amazon AU': 'https://www.amazon.com.au',
  'Kmart': 'https://www.kmart.com.au',
  'Big W': 'https://www.bigw.com.au',
  'Officeworks': 'https://www.officeworks.com.au',
  'Woolworths': 'https://www.woolworths.com.au',
  'Coles': 'https://www.coles.com.au',
  'Aldi': 'https://www.aldi.com.au',
  'IGA': 'https://www.iga.com.au',
};

interface CatalogProduct {
  name: string;
  image: string;
  category: string;
  basePrice: number;
  tags: string[]; // search tags for matching
  retailers: string[];
}

function emojiPlaceholder(emoji: string): string {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect fill='%2327272a' width='128' height='128' rx='16'/><text x='64' y='76' text-anchor='middle' font-size='56'>${emoji}</text></svg>`)}`;
}

const productCatalog: CatalogProduct[] = [
  // Audio
  { name: 'Apple AirPods Pro 2nd Gen', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-pro-2-hero-select-202409?fmt=jpeg&w=400', category: 'Audio', basePrice: 399, tags: ['airpods', 'apple', 'earbuds', 'wireless', 'audio'], retailers: techRetailers },
  { name: 'Apple AirPods 4', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-4-hero-select-202409?fmt=jpeg&w=400', category: 'Audio', basePrice: 299, tags: ['airpods', 'apple', 'earbuds', 'wireless', 'audio'], retailers: techRetailers },
  { name: 'Sony WH-1000XM5 Wireless', image: 'https://store.sony.com.au/on/demandware.static/-/Sites-sony-master-catalog/default/dw2e7d7e10/images/WH1000XM5B/WH1000XM5B.png', category: 'Audio', basePrice: 549, tags: ['sony', 'headphones', 'wireless', 'noise cancelling', 'audio'], retailers: techRetailers },
  { name: 'Bose QuietComfort Ultra Headphones', image: 'https://assets.bose.com/content/dam/cloudassets/Bose_DAM/Web/consumer_electronics/global/products/headphones/qc_ultra_headphones/product_silo_images/QUHE_PLB_hero_RGB.png', category: 'Audio', basePrice: 649, tags: ['bose', 'headphones', 'wireless', 'noise cancelling', 'audio'], retailers: techRetailers },
  { name: 'Samsung Galaxy Buds3 Pro', image: 'https://images.samsung.com/au/galaxy-buds3-pro/images/galaxy-buds3-pro-share.jpg', category: 'Audio', basePrice: 379, tags: ['samsung', 'earbuds', 'wireless', 'audio'], retailers: techRetailers },

  // Phones
  { name: 'Apple iPhone 16 Pro 256GB', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-hero-select-202409?fmt=jpeg&w=400', category: 'Phones', basePrice: 1899, tags: ['iphone', 'apple', 'phone', 'mobile'], retailers: techRetailers },
  { name: 'Apple iPhone 16 128GB', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-hero-select-202409?fmt=jpeg&w=400', category: 'Phones', basePrice: 1399, tags: ['iphone', 'apple', 'phone', 'mobile'], retailers: techRetailers },
  { name: 'Samsung Galaxy S25 Ultra 256GB', image: 'https://images.samsung.com/au/smartphones/galaxy-s25-ultra/images/galaxy-s25-ultra-share-image.jpg', category: 'Phones', basePrice: 2199, tags: ['samsung', 'galaxy', 'phone', 'mobile', 'android'], retailers: techRetailers },
  { name: 'Samsung Galaxy S25 128GB', image: 'https://images.samsung.com/au/smartphones/galaxy-s25/images/galaxy-s25-share-image.jpg', category: 'Phones', basePrice: 1349, tags: ['samsung', 'galaxy', 'phone', 'mobile', 'android'], retailers: techRetailers },

  // Laptops
  { name: 'MacBook Air M3 13" 256GB', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-m3-select-202402?fmt=jpeg&w=400', category: 'Laptops', basePrice: 1699, tags: ['macbook', 'apple', 'laptop'], retailers: techRetailers },
  { name: 'Lenovo ThinkPad X1 Carbon Gen 12', image: 'https://p4-ofp.static.pub/fes/cms/2024/01/18/s0kbzf9s8xnpxcmzhmz0cz93e96rwi553610.png', category: 'Laptops', basePrice: 2499, tags: ['lenovo', 'thinkpad', 'laptop', 'windows'], retailers: techRetailers },
  { name: 'Samsung Galaxy Book4 Pro 14"', image: 'https://images.samsung.com/au/galaxy-book4-pro/images/galaxy-book4-pro-share.jpg', category: 'Laptops', basePrice: 1999, tags: ['samsung', 'galaxy', 'laptop', 'windows'], retailers: techRetailers },
  { name: 'ASUS ROG Zephyrus G14', image: 'https://dlcdnwebimgs.asus.com/gain/22022f8c-1d6a-4aeb-b122-ab3a2de0a405/', category: 'Laptops', basePrice: 2799, tags: ['asus', 'rog', 'laptop', 'gaming', 'windows'], retailers: techRetailers },
  { name: 'Dell XPS 15', image: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/silver/notebook-xps-15-9530-t-silver-gallery-1.psd', category: 'Laptops', basePrice: 2299, tags: ['dell', 'xps', 'laptop', 'windows'], retailers: techRetailers },

  // Gaming
  { name: 'PlayStation 5 Slim Console', image: 'https://media.direct.playstation.com/is/image/sierp/ps5-slim-edition-group-image-hero', category: 'Gaming', basePrice: 799, tags: ['playstation', 'ps5', 'console', 'gaming', 'sony'], retailers: techRetailers },
  { name: 'DualSense Wireless Controller', image: 'https://media.direct.playstation.com/is/image/sierp/dualsense-ps5-controller-white-accessory-front', category: 'Gaming', basePrice: 109, tags: ['playstation', 'ps5', 'controller', 'gaming', 'dualsense'], retailers: techRetailers },
  { name: 'Nintendo Switch OLED', image: 'https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.5/c_scale,w_400/ncom/en_US/switch/site-design-update/photo01', category: 'Gaming', basePrice: 539, tags: ['nintendo', 'switch', 'console', 'gaming'], retailers: techRetailers },
  { name: 'Xbox Series X 1TB', image: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4mRni', category: 'Gaming', basePrice: 799, tags: ['xbox', 'microsoft', 'console', 'gaming'], retailers: techRetailers },

  // TVs
  { name: 'Samsung 65" Crystal UHD 4K Smart TV', image: 'https://images.samsung.com/au/tvs/uhd-4k-tv/images/uhd-4k-tv-share-image.jpg', category: 'TVs', basePrice: 1199, tags: ['samsung', 'tv', 'television', '4k', '65 inch'], retailers: techRetailers },
  { name: 'LG 55" C4 OLED evo 4K Smart TV', image: 'https://www.lg.com/au/images/tvs/md08004454/gallery/medium01.jpg', category: 'TVs', basePrice: 2499, tags: ['lg', 'tv', 'television', 'oled', '4k', '55 inch'], retailers: techRetailers },
  { name: 'Sony 75" X90L 4K Smart TV', image: 'https://store.sony.com.au/on/demandware.static/-/Sites-sony-master-catalog/default/dw4c8cf7a9/images/KD75X90L/KD75X90L.png', category: 'TVs', basePrice: 2499, tags: ['sony', 'tv', 'television', '4k', '75 inch'], retailers: techRetailers },

  // Tablets
  { name: 'Apple iPad Air M2 11" 128GB', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-select-202405?fmt=jpeg&w=400', category: 'Tablets', basePrice: 999, tags: ['ipad', 'apple', 'tablet'], retailers: techRetailers },
  { name: 'Samsung Galaxy Tab S9 FE 128GB', image: 'https://images.samsung.com/au/tablets/galaxy-tab-s9-fe/images/galaxy-tab-s9-fe-share-image.jpg', category: 'Tablets', basePrice: 699, tags: ['samsung', 'galaxy', 'tablet', 'android'], retailers: techRetailers },

  // === FOOD & GROCERIES ===
  // Protein
  { name: 'Chicken Breast 1kg', image: emojiPlaceholder('🍗'), category: 'Meat & Poultry', basePrice: 12.50, tags: ['chicken', 'breast', 'meat', 'poultry', 'protein', 'food'], retailers: groceryRetailers },
  { name: 'Beef Mince 500g', image: emojiPlaceholder('🥩'), category: 'Meat & Poultry', basePrice: 7.50, tags: ['beef', 'mince', 'meat', 'protein', 'food'], retailers: groceryRetailers },
  { name: 'Atlantic Salmon Fillets 400g', image: emojiPlaceholder('🐟'), category: 'Seafood', basePrice: 14.00, tags: ['salmon', 'fish', 'seafood', 'food'], retailers: groceryRetailers },
  { name: 'Free Range Eggs 12pk', image: emojiPlaceholder('🥚'), category: 'Dairy & Eggs', basePrice: 6.50, tags: ['eggs', 'free range', 'dairy', 'food', 'breakfast'], retailers: groceryRetailers },
  { name: 'Bacon Rashers 250g', image: emojiPlaceholder('🥓'), category: 'Meat & Poultry', basePrice: 6.00, tags: ['bacon', 'meat', 'pork', 'breakfast', 'food'], retailers: groceryRetailers },

  // Dairy
  { name: 'Full Cream Milk 2L', image: emojiPlaceholder('🥛'), category: 'Dairy & Eggs', basePrice: 3.10, tags: ['milk', 'dairy', 'food', 'drink'], retailers: groceryRetailers },
  { name: 'Bega Tasty Cheese 500g', image: emojiPlaceholder('🧀'), category: 'Dairy & Eggs', basePrice: 7.00, tags: ['cheese', 'bega', 'dairy', 'food'], retailers: groceryRetailers },
  { name: 'Chobani Greek Yoghurt 907g', image: emojiPlaceholder('🥣'), category: 'Dairy & Eggs', basePrice: 8.00, tags: ['yoghurt', 'yogurt', 'chobani', 'greek', 'dairy', 'food'], retailers: groceryRetailers },
  { name: 'Lurpak Butter 250g', image: emojiPlaceholder('🧈'), category: 'Dairy & Eggs', basePrice: 5.50, tags: ['butter', 'lurpak', 'dairy', 'food'], retailers: groceryRetailers },

  // Pantry
  { name: 'Vegemite 380g', image: emojiPlaceholder('🇦🇺'), category: 'Pantry', basePrice: 6.00, tags: ['vegemite', 'spread', 'pantry', 'food', 'breakfast'], retailers: groceryRetailers },
  { name: 'Peanut Butter Smooth 375g', image: emojiPlaceholder('🥜'), category: 'Pantry', basePrice: 4.50, tags: ['peanut butter', 'spread', 'pantry', 'food'], retailers: groceryRetailers },
  { name: 'San Remo Spaghetti 500g', image: emojiPlaceholder('🍝'), category: 'Pantry', basePrice: 2.50, tags: ['pasta', 'spaghetti', 'san remo', 'pantry', 'food'], retailers: groceryRetailers },
  { name: 'Basmati Rice 5kg', image: emojiPlaceholder('🍚'), category: 'Pantry', basePrice: 12.00, tags: ['rice', 'basmati', 'pantry', 'food'], retailers: groceryRetailers },
  { name: 'Weet-Bix 575g', image: emojiPlaceholder('🥣'), category: 'Pantry', basePrice: 4.50, tags: ['weet-bix', 'weetbix', 'cereal', 'breakfast', 'food'], retailers: groceryRetailers },
  { name: 'Nutella 750g', image: emojiPlaceholder('🍫'), category: 'Pantry', basePrice: 8.00, tags: ['nutella', 'chocolate', 'spread', 'pantry', 'food'], retailers: groceryRetailers },

  // Drinks
  { name: 'Coca-Cola 24x375ml Cans', image: emojiPlaceholder('🥤'), category: 'Drinks', basePrice: 21.00, tags: ['coke', 'coca-cola', 'soft drink', 'soda', 'drink', 'food'], retailers: groceryRetailers },
  { name: 'Pepsi Max 24x375ml Cans', image: emojiPlaceholder('🥤'), category: 'Drinks', basePrice: 18.50, tags: ['pepsi', 'soft drink', 'soda', 'drink', 'food'], retailers: groceryRetailers },
  { name: 'Red Bull 4x250ml', image: emojiPlaceholder('⚡'), category: 'Drinks', basePrice: 9.50, tags: ['red bull', 'energy drink', 'drink', 'food'], retailers: groceryRetailers },
  { name: 'Bundaberg Ginger Beer 4x375ml', image: emojiPlaceholder('🍺'), category: 'Drinks', basePrice: 7.50, tags: ['bundaberg', 'ginger beer', 'drink', 'food'], retailers: groceryRetailers },

  // Snacks
  { name: 'Doritos Cheese Supreme 170g', image: emojiPlaceholder('🌮'), category: 'Snacks', basePrice: 4.50, tags: ['doritos', 'chips', 'snack', 'food'], retailers: groceryRetailers },
  { name: 'Tim Tams Original 200g', image: emojiPlaceholder('🍪'), category: 'Snacks', basePrice: 3.65, tags: ['tim tams', 'timtam', 'chocolate', 'biscuit', 'snack', 'food'], retailers: groceryRetailers },
  { name: 'Shapes BBQ 175g', image: emojiPlaceholder('🔶'), category: 'Snacks', basePrice: 3.00, tags: ['shapes', 'bbq', 'crackers', 'snack', 'food'], retailers: groceryRetailers },
  { name: 'Cadbury Dairy Milk Block 180g', image: emojiPlaceholder('🍫'), category: 'Snacks', basePrice: 5.50, tags: ['cadbury', 'chocolate', 'dairy milk', 'snack', 'food'], retailers: groceryRetailers },
  { name: 'Pringles Original 134g', image: emojiPlaceholder('🥔'), category: 'Snacks', basePrice: 4.00, tags: ['pringles', 'chips', 'snack', 'food'], retailers: groceryRetailers },

  // Frozen
  { name: 'McCain Super Fries 900g', image: emojiPlaceholder('🍟'), category: 'Frozen', basePrice: 5.50, tags: ['fries', 'chips', 'mccain', 'frozen', 'food'], retailers: groceryRetailers },
  { name: 'Birds Eye Fish Fingers 375g', image: emojiPlaceholder('🐟'), category: 'Frozen', basePrice: 5.00, tags: ['fish fingers', 'birds eye', 'frozen', 'food'], retailers: groceryRetailers },
  { name: 'Ben & Jerrys Cookie Dough 458ml', image: emojiPlaceholder('🍦'), category: 'Frozen', basePrice: 13.50, tags: ['ice cream', 'ben and jerrys', 'dessert', 'frozen', 'food'], retailers: groceryRetailers },

  // Fresh
  { name: 'Avocados 4pk', image: emojiPlaceholder('🥑'), category: 'Fresh Produce', basePrice: 5.00, tags: ['avocado', 'fruit', 'fresh', 'food', 'produce'], retailers: groceryRetailers },
  { name: 'Bananas 1kg', image: emojiPlaceholder('🍌'), category: 'Fresh Produce', basePrice: 3.50, tags: ['banana', 'bananas', 'fruit', 'fresh', 'food', 'produce'], retailers: groceryRetailers },
  { name: 'Sourdough Bread Loaf', image: emojiPlaceholder('🍞'), category: 'Bakery', basePrice: 5.50, tags: ['bread', 'sourdough', 'bakery', 'food'], retailers: groceryRetailers },

  // Coffee
  { name: 'Nescafe Blend 43 500g', image: emojiPlaceholder('☕'), category: 'Drinks', basePrice: 20.00, tags: ['coffee', 'nescafe', 'instant', 'drink', 'food'], retailers: groceryRetailers },
  { name: 'Lavazza Crema e Gusto Ground 250g', image: emojiPlaceholder('☕'), category: 'Drinks', basePrice: 8.50, tags: ['coffee', 'lavazza', 'ground', 'drink', 'food'], retailers: groceryRetailers },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function generatePriceVariation(basePrice: number, retailer: string): number {
  const seed = retailer.length * 17 + basePrice;
  const variation = ((Math.sin(seed) + 1) / 2) * 0.15 - 0.05;
  return Math.round((basePrice * (1 + variation)) * 100) / 100;
}

function generatePriceHistory(basePrice: number, retailer: string, days: number = 30) {
  const history: { price: number; date: string }[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dayVariation = Math.sin(i * 0.3 + retailer.length) * 0.08;
    const trendVariation = (i / days) * 0.05;
    const price = Math.round((basePrice * (1 + dayVariation + trendVariation)) * 100) / 100;

    history.push({
      price,
      date: date.toISOString().split('T')[0],
    });
  }

  return history;
}

export interface MockProduct {
  name: string;
  slug: string;
  image: string;
  category: string;
  prices: {
    retailer: string;
    price: number;
    url: string;
    history: { price: number; date: string }[];
  }[];
}

function buildProduct(product: CatalogProduct): MockProduct {
  const slug = slugify(product.name);
  return {
    name: product.name,
    slug,
    image: product.image,
    category: product.category,
    prices: product.retailers.map(retailer => ({
      retailer,
      price: generatePriceVariation(product.basePrice, retailer),
      url: `${retailerUrls[retailer]}/search?q=${encodeURIComponent(product.name)}`,
      history: generatePriceHistory(product.basePrice, retailer),
    })),
  };
}

function scoreProduct(product: CatalogProduct, queryWords: string[]): number {
  const nameLower = product.name.toLowerCase();
  let score = 0;

  for (const word of queryWords) {
    // Exact tag match = strong signal
    if (product.tags.includes(word)) score += 10;
    // Name contains the word = good signal
    if (nameLower.includes(word)) score += 5;
    // Partial tag match
    if (product.tags.some(t => t.includes(word) || word.includes(t))) score += 3;
    // Category match
    if (product.category.toLowerCase().includes(word)) score += 2;
  }

  return score;
}

export function searchProducts(query: string): MockProduct[] {
  const queryWords = query.toLowerCase().trim().split(/\s+/).filter(w => w.length > 1);

  if (queryWords.length === 0) return [];

  // Score all products
  const scored = productCatalog
    .map(product => ({ product, score: scoreProduct(product, queryWords) }))
    .filter(({ score }) => score > 0);

  // If multi-word query, require higher relevance (must match multiple terms)
  const threshold = queryWords.length > 1 ? queryWords.length * 3 : 3;
  const filtered = scored.filter(({ score }) => score >= threshold);

  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score);

  return filtered.map(({ product }) => buildProduct(product));
}

export function getProductBySlug(slug: string): MockProduct | null {
  for (const product of productCatalog) {
    if (slugify(product.name) === slug) {
      return buildProduct(product);
    }
  }
  return null;
}
