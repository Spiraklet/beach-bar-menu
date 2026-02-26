/**
 * seed-pdf-menu.ts
 *
 * Imports the full Beach Bar PDF menu into the demo client account.
 * Run with:  npx tsx seed-pdf-menu.ts
 */

const BASE_URL = 'http://localhost:3000'
const EMAIL = 'demo@beachbar.com'
const PASSWORD = 'Beach2024!@'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Customization {
  name: string
  price: number
  action: 'ADD' | 'CHANGE' | 'REMOVE'
}

interface ItemWithCustomizations {
  name: string
  price: number
  description: string
  category: string
  customizations: Customization[]
}

interface BulkItem {
  name: string
  price: number
  description: string
  category: string
}

// ---------------------------------------------------------------------------
// Shared customization sets
// ---------------------------------------------------------------------------
const BREAKFAST_EXTRAS: Customization[] = [
  { name: 'Egg', price: 2.50, action: 'ADD' },
  { name: 'Hollandaise', price: 3.00, action: 'ADD' },
  { name: 'Tomato', price: 3.00, action: 'ADD' },
  { name: 'Spinach', price: 3.00, action: 'ADD' },
  { name: 'Housemade Hash Brown', price: 4.00, action: 'ADD' },
  { name: 'Mushrooms', price: 4.00, action: 'ADD' },
  { name: 'Avocado', price: 5.00, action: 'ADD' },
  { name: 'Pork Sausage', price: 5.00, action: 'ADD' },
  { name: 'Bacon', price: 5.00, action: 'ADD' },
  { name: 'Haloumi', price: 5.00, action: 'ADD' },
]

const COFFEE_CUSTOMIZATIONS: Customization[] = [
  { name: 'Oat Milk', price: 0.80, action: 'ADD' },
  { name: 'Almond Milk', price: 0.80, action: 'ADD' },
  { name: 'Soy Milk', price: 0.80, action: 'ADD' },
  { name: 'Zymil', price: 0.80, action: 'ADD' },
  { name: 'Caramel Syrup', price: 0.60, action: 'ADD' },
  { name: 'Vanilla Syrup', price: 0.60, action: 'ADD' },
  { name: 'Hazelnut Syrup', price: 0.60, action: 'ADD' },
  { name: 'Chai Syrup', price: 0.60, action: 'ADD' },
  { name: 'Extra Shot', price: 0.80, action: 'ADD' },
  { name: 'Decaf', price: 0.50, action: 'ADD' },
]

const BURGER_EXTRAS: Customization[] = [
  { name: 'Add Bacon', price: 3.00, action: 'ADD' },
]

const KIDS_EXTRAS: Customization[] = [
  { name: 'Add Vanilla Ice Cream with Topping', price: 3.00, action: 'ADD' },
]

// ---------------------------------------------------------------------------
// Items WITH customizations (single POST each)
// ---------------------------------------------------------------------------
const ITEMS_WITH_CUSTOMIZATIONS: ItemWithCustomizations[] = [
  // ── BREAKFAST ──────────────────────────────────────────────────────────
  { name: 'Toast & Housemade Preserve', price: 10, category: 'Breakfast',
    description: 'Sourdough with choice of marmalade, strawberry jam, vegemite, peanut butter or honey',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Eggs on Toast', price: 15, category: 'Breakfast',
    description: 'Sourdough, tomato chutney, baby spinach',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Turkish Eggs', price: 22, category: 'Breakfast',
    description: 'Spiced labneh, poached eggs, brown chilli butter, confit tomato, flatbread',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Eggs Benny', price: 24, category: 'Breakfast',
    description: 'Bacon or mushroom, poached eggs, spinach, sourdough, hollandaise',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Okonomiyaki', price: 22, category: 'Breakfast',
    description: 'Bacon, tonkatsu sauce, japanese mayo, fried egg, chilli threads, shallot',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Breaky Burger', price: 19, category: 'Breakfast',
    description: 'Bacon, egg, spinach, housemade hash, bbq sauce, toasted bun',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Pumpkin Haloumi Fritters', price: 23, category: 'Breakfast',
    description: 'Rocket, labneh, poached egg, tomato chutney, caramelised onion',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Farmhouse', price: 29, category: 'Breakfast',
    description: 'Eggs, cornbread, shoulder bacon, pork sausage, mushroom, tomato, housemade hash, chutney',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Avocado Hash', price: 24, category: 'Breakfast',
    description: 'Smashed avocado, haloumi, radish, poached egg, chilli oil, pistachio dukkah, pomegranate molasses',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Baked Peaches', price: 22, category: 'Breakfast',
    description: 'Biscoff granola, greek yoghurt, honey, fig, walnuts',
    customizations: BREAKFAST_EXTRAS },

  // ── BREAKFAST — GROMMIES (Kids) ────────────────────────────────────────
  { name: 'Banana Pancakes', price: 13, category: 'Breakfast — Grommies',
    description: 'Fresh fruit, honey (kids 12 & under)',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Bacon & Egg Roll', price: 13, category: 'Breakfast — Grommies',
    description: 'With tomato sauce (kids 12 & under)',
    customizations: BREAKFAST_EXTRAS },
  { name: 'Bacon & Eggs', price: 13, category: 'Breakfast — Grommies',
    description: 'Sourdough, scramble (kids 12 & under)',
    customizations: BREAKFAST_EXTRAS },

  // ── COFFEE & TEA ───────────────────────────────────────────────────────
  { name: 'Black Coffee', price: 4.00, category: 'Coffee & Tea',
    description: 'Espresso or long black',
    customizations: COFFEE_CUSTOMIZATIONS },
  { name: 'White Coffee', price: 4.50, category: 'Coffee & Tea',
    description: 'Small or large white coffee',
    customizations: [
      { name: 'Large', price: 1.00, action: 'ADD' },
      ...COFFEE_CUSTOMIZATIONS,
    ] },
  { name: 'Iced Coffee', price: 6.00, category: 'Coffee & Tea',
    description: 'Iced long black, latte, chai or mocha',
    customizations: COFFEE_CUSTOMIZATIONS },
  { name: 'Mocha', price: 6.50, category: 'Coffee & Tea',
    description: 'Coffee and chocolate',
    customizations: COFFEE_CUSTOMIZATIONS },
  { name: 'Tea', price: 4.00, category: 'Coffee & Tea',
    description: 'English breakfast, earl grey, malabar chai, spring green or peppermint',
    customizations: [
      { name: 'Oat Milk', price: 0.80, action: 'ADD' },
      { name: 'Almond Milk', price: 0.80, action: 'ADD' },
      { name: 'Soy Milk', price: 0.80, action: 'ADD' },
    ] },

  // ── CRAFT BURGERS ──────────────────────────────────────────────────────
  { name: 'Beach Bar Beef Burger', price: 26, category: 'Craft Burgers',
    description: 'Beef patty, bacon jam, swiss cheese, onion rings, bbq, dill aioli. Served with toasted bun, crispy fries & aioli',
    customizations: BURGER_EXTRAS },
  { name: 'Classic American Cheeseburger', price: 25, category: 'Craft Burgers',
    description: 'Beef patty, cheese, lettuce, tomato, mustard, aioli, tomato sauce, pickles. Served with toasted bun, crispy fries & aioli',
    customizations: BURGER_EXTRAS },
  { name: 'Pumpkin & Haloumi Burger', price: 24, category: 'Craft Burgers',
    description: 'Rocket, spiced labneh, tomato, tomato chutney, caramelised onion. Served with toasted bun, crispy fries & aioli',
    customizations: BURGER_EXTRAS },
  { name: 'Grilled Chicken Burger', price: 25, category: 'Craft Burgers',
    description: 'Bacon, swiss cheese, lettuce, tomato, dill aioli, jalapeño jam. Served with toasted bun, crispy fries & aioli',
    customizations: BURGER_EXTRAS },

  // ── OUR FAVOURITES — Poke Bowl (protein choice) ───────────────────────
  { name: 'Poke Bowl', price: 26, category: 'Our Favourites',
    description: 'Coconut rice, slaw, pickled onion, carrot, prawn crackers, cucumber, roasted sesame dressing, ponzu, pickled ginger',
    customizations: [
      { name: 'Add Seared Mahi Mahi', price: 2.00, action: 'ADD' },
      { name: 'Add Crispy Tofu', price: 0.00, action: 'ADD' },
    ] },

  // ── KIDS LUNCH — GROMMIES ──────────────────────────────────────────────
  { name: 'Kids Cheeseburger & Chips', price: 16, category: 'Kids — Grommies',
    description: 'With chips (can be swapped for salad). Kids 12 & under',
    customizations: KIDS_EXTRAS },
  { name: 'Kids Chicken Tenders & Chips', price: 16, category: 'Kids — Grommies',
    description: 'With chips (can be swapped for salad). Kids 12 & under',
    customizations: KIDS_EXTRAS },
  { name: 'Kids Battered Fish & Chips', price: 16, category: 'Kids — Grommies',
    description: 'With chips (can be swapped for salad). Kids 12 & under',
    customizations: KIDS_EXTRAS },
]

// ---------------------------------------------------------------------------
// Items WITHOUT customizations (bulk POST by category)
// ---------------------------------------------------------------------------
const BULK_ITEMS: BulkItem[] = [
  // ── COLD DRINKS ────────────────────────────────────────────────────────
  { name: 'Milkshake', price: 7.00, category: 'Cold Drinks',
    description: 'Chocolate, caramel, vanilla or strawberry. +$2 to make it a thickshake' },
  { name: 'Juice', price: 6.00, category: 'Cold Drinks',
    description: 'Orange, apple, pineapple, guava or cranberry' },
  { name: 'Soft Drink', price: 5.00, category: 'Cold Drinks',
    description: 'Coke, lemonade, diet coke, ginger ale or soda water' },
  { name: 'Bundaberg Ginger Beer', price: 6.00, category: 'Cold Drinks',
    description: 'Bundaberg ginger beer or lemon lime bitters' },
  { name: 'Sparkling Water', price: 8.00, category: 'Cold Drinks',
    description: 'Lentini sparkling 750ml' },
  { name: 'Coconut Water', price: 6.00, category: 'Cold Drinks',
    description: 'Fresh coconut water' },
  { name: 'Kombucha', price: 7.50, category: 'Cold Drinks',
    description: 'Ginger & lemon myrtle' },

  // ── SMOOTHIES ──────────────────────────────────────────────────────────
  { name: 'Banana Smoothie', price: 11, category: 'Smoothies',
    description: 'Banana, cacao nibs, honey, cinnamon, milk' },
  { name: 'Tropical Smoothie', price: 11, category: 'Smoothies',
    description: 'Mango, passionfruit, orange, chia seeds, goji berries, coconut cream, coconut water' },
  { name: 'Peanut Cacao Smoothie', price: 12, category: 'Smoothies',
    description: 'Banana, dates, peanut butter, coconut, cacao, maca, cinnamon, coconut water' },
  { name: 'Green Smoothie', price: 12, category: 'Smoothies',
    description: 'Mango, passionfruit, pineapple, goji berries, kale, cucumber, chia seeds, coconut, maca, honey, mint, coconut water' },

  // ── SHARE PLATES ───────────────────────────────────────────────────────
  { name: 'Seasoned Fries', price: 12, category: 'Share Plates',
    description: 'Rosemary salt, aioli' },
  { name: 'Tuscan Flatbread', price: 14, category: 'Share Plates',
    description: 'Pistachio dukkah, hummus, pomegranate molasses, olive oil' },
  { name: 'Chicken Dumplings', price: 18, category: 'Share Plates',
    description: 'Ponzu, fried shallot, pickled ginger, chilli oil' },
  { name: 'Scallop Ceviche', price: 22, category: 'Share Plates',
    description: 'Apple, pickled fennel, chilli, citrus vinaigrette, avocado, fried tortilla' },
  { name: 'Fish Tacos (2)', price: 18, category: 'Share Plates',
    description: 'Mahi mahi, mango pico, tomatillo salsa, lime' },
  { name: 'Hot Honey Chicken', price: 19, category: 'Share Plates',
    description: 'Fried tenders, pickles, hot honey glaze' },
  { name: 'Calamari', price: 19, category: 'Share Plates',
    description: 'Kaffir lime togarashi, cress, dill aioli, lemon' },
  { name: 'Tofu Satay', price: 18, category: 'Share Plates',
    description: 'Fried shallot, sesame, cress, candied peanuts, chilli' },
  { name: 'Honey Baked Brie', price: 25, category: 'Share Plates',
    description: 'Flatbread, pistachio dukkah, pickles, house preserves' },

  // ── OUR FAVOURITES ─────────────────────────────────────────────────────
  { name: 'Satay Chicken', price: 30, category: 'Our Favourites',
    description: 'Coconut rice, cucumber, peanut sauce, candied nuts, asian salad, roti' },
  { name: 'Fish & Chips', price: 28, category: 'Our Favourites',
    description: 'Battered whiting, mushy peas, malt vinegar, dill aioli' },
  { name: 'Crispy Beef Salad', price: 30, category: 'Our Favourites',
    description: 'Soba noodles, cucumber, carrot, rocket, pickled onion, bean shoots, candied nuts, fresh herbs, soy egg, fried shallot, roasted sesame dressing' },
  { name: 'Moreton Bay Bug Brioche', price: 30, category: 'Our Favourites',
    description: 'Pickled fennel, celery, lettuce, pickled onion, carrot, dill aioli, crispy fries' },
  { name: 'Scallop Risotto', price: 36, category: 'Our Favourites',
    description: 'Seared scallop, peas, pickled fennel, pangrattato, parmesan' },
  { name: 'Thai Calamari Salad', price: 28, category: 'Our Favourites',
    description: 'Fried calamari, rocket, carrot, cabbage, pickled onion, cucumber, candied peanuts, coconut peanut dressing' },
  { name: 'Seared Mahi Mahi', price: 29, category: 'Our Favourites',
    description: 'Watermelon, feta, cress, pistachio dukkah, fennel, apple, radish, mango dressing' },

  // ── COCKTAILS — BEACH BAR BANGAS ───────────────────────────────────────
  { name: 'Cosmopolitan', price: 19, category: 'Cocktails — Beach Bar Bangas',
    description: 'Vodka, triple sec, lime, cranberry' },
  { name: 'Mojito', price: 20, category: 'Cocktails — Beach Bar Bangas',
    description: 'White rum, lime, mint, soda' },
  { name: 'Espresso Martini', price: 22, category: 'Cocktails — Beach Bar Bangas',
    description: 'Tim Adams espresso, vodka, Licor43, Mozart' },
  { name: 'Piña Colada', price: 22, category: 'Cocktails — Beach Bar Bangas',
    description: 'Rum, coconut, pineapple, lime' },
  { name: 'French Martini', price: 20, category: 'Cocktails — Beach Bar Bangas',
    description: 'Vodka, chambord, pineapple' },
  { name: 'Beach Bar Hold Up', price: 22, category: 'Cocktails — Beach Bar Bangas',
    description: 'Vodka, aperol, guava, lime, passionfruit' },
  { name: 'Lychee Martini', price: 20, category: 'Cocktails — Beach Bar Bangas',
    description: 'Vodka, lychee, cloudy apple, lime, aquafaba' },
  { name: 'Long Island Iced Tea', price: 22, category: 'Cocktails — Beach Bar Bangas',
    description: 'Tequila, vodka, white rum, gin, triple sec, lemon, cola' },
  { name: 'Good Juju', price: 22, category: 'Cocktails — Beach Bar Bangas',
    description: 'Blood orange gin, Montenegro, orange, lime, prosecco, aquafaba' },
  { name: 'Pornstar Martini', price: 20, category: 'Cocktails — Beach Bar Bangas',
    description: 'Vanilla vodka, passionfruit, pineapple, lime' },
  { name: 'Into the Future', price: 22, category: 'Cocktails — Beach Bar Bangas',
    description: 'Vodka, watermelon, peach & plum bitters, lime, cranberry' },
  { name: 'Sunshine Parfait Martini', price: 22, category: 'Cocktails — Beach Bar Bangas',
    description: "Sunshine & Sons Parfait Gin, pineapple, passionfruit, mango, lime" },
  { name: "Bee'z Kneez", price: 22, category: 'Cocktails — Beach Bar Bangas',
    description: 'Barrel aged gin, guava, Diddillabah honey, lemon' },

  // ── COCKTAILS — SUNDAZE SPRITZ ─────────────────────────────────────────
  { name: 'Aperol Spritz', price: 18, category: 'Cocktails — Sundaze Spritz',
    description: 'Aperol, prosecco, soda' },
  { name: 'Beach Bar Spritz', price: 18, category: 'Cocktails — Sundaze Spritz',
    description: 'Gin, pomme verte, lemon, blackberry shrub, salt' },
  { name: 'Limoncello Spritz', price: 18, category: 'Cocktails — Sundaze Spritz',
    description: 'Limoncello, lemon, prosecco' },
  { name: 'Umami Spritz', price: 19, category: 'Cocktails — Sundaze Spritz',
    description: 'Sake, guava, lime, yuzu, black walnut' },
  { name: 'Pink Rose Spritz', price: 18, category: 'Cocktails — Sundaze Spritz',
    description: 'Pink gin, strawberry vermouth, sparkling rose, pink grapefruit' },
  { name: 'Mixed Up Mexican Spritz', price: 18, category: 'Cocktails — Sundaze Spritz',
    description: 'Coconut tequila, triple sec, mandarin, pineapple, cherry, brut' },
  { name: "Gentleman's Afternoon Spritz", price: 18, category: 'Cocktails — Sundaze Spritz',
    description: 'Bourbon, peach bitters, dry ginger, mint' },

  // ── COCKTAILS — MARGARITAS ─────────────────────────────────────────────
  { name: 'Classic Margarita', price: 20, category: 'Cocktails — Margaritas',
    description: 'Tequila, triple sec, lime, salt' },
  { name: 'Spicy Margarita', price: 22, category: 'Cocktails — Margaritas',
    description: 'Tequila, triple sec, lime, jalapeño juice, chilli salt' },
  { name: 'Tommys', price: 24, category: 'Cocktails — Margaritas',
    description: 'Cristalino tequila, lime, agave' },
  { name: 'Mango Chilli Margarita', price: 22, category: 'Cocktails — Margaritas',
    description: 'Tequila, triple sec, mango, chilli, lime' },

  // ── MOCKTAILS ──────────────────────────────────────────────────────────
  { name: 'Apple Mojito', price: 13, category: 'Mocktails',
    description: 'Apple, lime, mint, soda' },
  { name: 'Passion, Mango, Coco, Daiquiri', price: 14, category: 'Mocktails',
    description: 'Passionfruit, mango, pineapple, whipped coconut' },
  { name: 'Berry Bramble', price: 13, category: 'Mocktails',
    description: 'Berries, lemon, cranberry, soda' },

  // ── BEER ───────────────────────────────────────────────────────────────
  // Multi-size beers are handled via wine-style customizations below
  // Stone & Wood: $9.50 schooner / $12.50 pint
  // Your Mates 'Larry': $9.50 schooner / $12.50 pint
  // Gage Road 'Beach Bar' Lager: $8.50 / $11.50 / $20 jug
  // Little Dragon Ginger Beer: $11 / $14

  // ── WINE — SPARKLING ───────────────────────────────────────────────────
  // Bottle-only items (no customizations needed)
  { name: 'Jansz Cuvée', price: 70, category: 'Wine — Sparkling',
    description: 'Piper River, TAS — sparkling wine (bottle)' },
  { name: 'Pol Roger Champagne', price: 130, category: 'Wine — Sparkling',
    description: 'Epernay, France — champagne (bottle)' },

  // ── WINE — WHITE ───────────────────────────────────────────────────────
  // Bottle-only
  { name: 'Jim Barry Riesling', price: 48, category: 'Wine — White',
    description: 'Clare Valley, SA (bottle)' },
  { name: "Santolin 'Cosa Nostra' Fruilano", price: 65, category: 'Wine — White',
    description: 'Alpine Valley, VIC (bottle)' },
  { name: "Geoff Merrill 'Reserve' Chardonnay", price: 72, category: 'Wine — White',
    description: 'McLaren Vale, SA (bottle)' },

  // ── WINE — RED ─────────────────────────────────────────────────────────
  // Bottle-only
  { name: 'Mr. Smith Shiraz', price: 50, category: 'Wine — Red',
    description: 'McLaren Vale, VIC (bottle)' },
]

// ---------------------------------------------------------------------------
// Items that need multi-size customizations (wine glass/bottle, beer sizes)
// These are added via the single POST endpoint
// ---------------------------------------------------------------------------
const MULTI_SIZE_ITEMS: ItemWithCustomizations[] = [
  // ── BEER ───────────────────────────────────────────────────────────────
  { name: 'Stone & Wood', price: 9.50, category: 'Beer',
    description: 'Northern Rivers, NSW — Pacific Ale on tap',
    customizations: [{ name: 'Pint', price: 3.00, action: 'ADD' }] },
  { name: "Your Mates 'Larry'", price: 9.50, category: 'Beer',
    description: 'Sunshine Coast, QLD — lager on tap',
    customizations: [{ name: 'Pint', price: 3.00, action: 'ADD' }] },
  { name: "Gage Road 'Beach Bar' Lager", price: 8.50, category: 'Beer',
    description: 'Palmyra, WA',
    customizations: [
      { name: 'Schooner', price: 3.00, action: 'ADD' },
      { name: 'Jug', price: 11.50, action: 'ADD' },
    ] },
  { name: 'Little Dragon Ginger Beer', price: 11.00, category: 'Beer',
    description: 'Northern Rivers, NSW',
    customizations: [{ name: 'Pint', price: 3.00, action: 'ADD' }] },

  // ── WINE — SPARKLING ───────────────────────────────────────────────────
  { name: 'Three Vineyards Brut', price: 9.00, category: 'Wine — Sparkling',
    description: 'Nagambie, VIC',
    customizations: [{ name: 'Bottle', price: 29.00, action: 'ADD' }] },
  { name: 'Vallate Prosecco', price: 12.00, category: 'Wine — Sparkling',
    description: 'Veneto, Italy',
    customizations: [{ name: 'Bottle', price: 38.00, action: 'ADD' }] },
  { name: 'Jansz Sparkling Rose', price: 12.50, category: 'Wine — Sparkling',
    description: 'Pipers River, TAS',
    customizations: [{ name: 'Bottle', price: 57.50, action: 'ADD' }] },

  // ── WINE — ROSÉ ────────────────────────────────────────────────────────
  { name: 'The Hidden Sea Rosé', price: 11.00, category: 'Wine — Rosé',
    description: 'Limestone Coast, SA',
    customizations: [
      { name: 'Large Glass', price: 7.00, action: 'ADD' },
      { name: 'Bottle', price: 33.00, action: 'ADD' },
    ] },
  { name: 'Jardin des Charmes', price: 12.00, category: 'Wine — Rosé',
    description: 'Beziers, France',
    customizations: [
      { name: 'Large Glass', price: 8.00, action: 'ADD' },
      { name: 'Bottle', price: 38.00, action: 'ADD' },
    ] },

  // ── WINE — WHITE ───────────────────────────────────────────────────────
  { name: "McPherson 'Pickles' Sauvignon Blanc", price: 9.00, category: 'Wine — White',
    description: 'Nagambie Lakes, VIC',
    customizations: [
      { name: 'Large Glass', price: 5.50, action: 'ADD' },
      { name: 'Bottle', price: 29.00, action: 'ADD' },
    ] },
  { name: 'Beachwood Sauvignon Blanc', price: 12.00, category: 'Wine — White',
    description: 'Marlborough, New Zealand',
    customizations: [
      { name: 'Large Glass', price: 7.00, action: 'ADD' },
      { name: 'Bottle', price: 36.00, action: 'ADD' },
    ] },
  { name: 'La Vue Moscato', price: 10.00, category: 'Wine — White',
    description: 'Nagambie, VIC',
    customizations: [
      { name: 'Large Glass', price: 6.00, action: 'ADD' },
      { name: 'Bottle', price: 28.00, action: 'ADD' },
    ] },
  { name: "Banfi 'Le Rime' Pinot Grigio", price: 11.00, category: 'Wine — White',
    description: 'Toscana, Italy',
    customizations: [
      { name: 'Large Glass', price: 7.00, action: 'ADD' },
      { name: 'Bottle', price: 35.00, action: 'ADD' },
    ] },
  { name: 'Petal & Stem Pinot Gris', price: 10.50, category: 'Wine — White',
    description: 'Marlborough, New Zealand',
    customizations: [
      { name: 'Large Glass', price: 6.50, action: 'ADD' },
      { name: 'Bottle', price: 33.50, action: 'ADD' },
    ] },
  { name: "McPherson 'Catrionas' Chardonnay", price: 9.00, category: 'Wine — White',
    description: 'Nagambie, VIC',
    customizations: [
      { name: 'Large Glass', price: 5.50, action: 'ADD' },
      { name: 'Bottle', price: 29.00, action: 'ADD' },
    ] },
  { name: "Xanadu 'Circa 77' Chardonnay", price: 12.00, category: 'Wine — White',
    description: 'Margaret River, WA',
    customizations: [
      { name: 'Large Glass', price: 8.00, action: 'ADD' },
      { name: 'Bottle', price: 37.00, action: 'ADD' },
    ] },

  // ── WINE — RED ─────────────────────────────────────────────────────────
  { name: 'The Hidden Sea Pinot Noir', price: 11.00, category: 'Wine — Red',
    description: 'Limestone Coast, SA',
    customizations: [
      { name: 'Large Glass', price: 7.00, action: 'ADD' },
      { name: 'Bottle', price: 33.00, action: 'ADD' },
    ] },
  { name: 'Running with Bulls Grenache', price: 12.00, category: 'Wine — Red',
    description: 'Barossa Valley, SA',
    customizations: [
      { name: 'Large Glass', price: 6.00, action: 'ADD' },
      { name: 'Bottle', price: 43.00, action: 'ADD' },
    ] },
  { name: "McPherson 'Three Vineyards' Shiraz", price: 9.00, category: 'Wine — Red',
    description: 'Nagambie, VIC',
    customizations: [
      { name: 'Large Glass', price: 5.50, action: 'ADD' },
      { name: 'Bottle', price: 29.00, action: 'ADD' },
    ] },
  { name: 'Step by Step Cabernet Sauvignon', price: 10.00, category: 'Wine — Red',
    description: 'Langhorne Creek, SA',
    customizations: [
      { name: 'Large Glass', price: 5.00, action: 'ADD' },
      { name: 'Bottle', price: 35.00, action: 'ADD' },
    ] },
]

// ---------------------------------------------------------------------------
// HTTP helpers (using Node built-in fetch — available in Node 18+)
// ---------------------------------------------------------------------------
let authCookie = ''

async function login(): Promise<void> {
  console.log('🔑 Logging in as demo client...')
  const res = await fetch(`${BASE_URL}/api/auth/client/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) throw new Error('Login failed — no cookie returned')
  // Extract the auth-token-client cookie value
  const match = setCookie.match(/auth-token-client=([^;]+)/)
  if (!match) throw new Error('Login failed — auth-token-client not found in cookie')
  authCookie = `auth-token-client=${match[1]}`
  const data = await res.json() as { success: boolean; error?: string }
  if (!data.success) throw new Error(`Login failed: ${data.error}`)
  console.log('   ✅ Logged in')
}

async function getExistingItems(): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(`${BASE_URL}/api/client/items`, {
    headers: { Cookie: authCookie },
  })
  const data = await res.json() as { success: boolean; data: { items: Array<{ id: string; name: string }> } }
  return data.data?.items ?? []
}

async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/client/items?id=${id}`, {
    method: 'DELETE',
    headers: { Cookie: authCookie },
  })
  const data = await res.json() as { success: boolean; error?: string }
  if (!data.success) throw new Error(`Delete failed for ${id}: ${data.error}`)
}

async function bulkCreate(items: BulkItem[]): Promise<number> {
  const res = await fetch(`${BASE_URL}/api/client/items/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ items }),
  })
  const data = await res.json() as { success: boolean; data?: { count: number }; error?: string }
  if (!data.success) throw new Error(`Bulk create failed: ${data.error}`)
  return data.data?.count ?? 0
}

async function singleCreate(item: ItemWithCustomizations): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/client/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify(item),
  })
  const data = await res.json() as { success: boolean; error?: string }
  if (!data.success) throw new Error(`Create failed for "${item.name}": ${data.error}`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🏖️  Beach Bar PDF Menu Seeder\n')

  // 1. Login
  await login()

  // 2. Delete existing items
  console.log('\n🗑️  Deleting existing items...')
  const existing = await getExistingItems()
  console.log(`   Found ${existing.length} existing item(s)`)
  for (const item of existing) {
    await deleteItem(item.id)
    process.stdout.write(`   Deleted: ${item.name}\n`)
  }
  console.log(`   ✅ Cleared ${existing.length} items`)

  // 3. Bulk insert items without customizations
  console.log('\n📦 Bulk inserting simple items...')
  const bulkCount = await bulkCreate(BULK_ITEMS)
  console.log(`   ✅ Bulk inserted ${bulkCount} items`)

  // 4. Single insert items with customizations
  const allSingleItems = [...ITEMS_WITH_CUSTOMIZATIONS, ...MULTI_SIZE_ITEMS]
  console.log(`\n✨ Inserting ${allSingleItems.length} items with customizations...`)
  let singleCount = 0
  let errorCount = 0
  for (const item of allSingleItems) {
    try {
      await singleCreate(item)
      singleCount++
      process.stdout.write(`   ✅ ${item.name} (${item.category})\n`)
    } catch (err) {
      errorCount++
      process.stdout.write(`   ❌ ${item.name}: ${err}\n`)
    }
  }

  // 5. Summary
  const total = bulkCount + singleCount
  console.log('\n──────────────────────────────────────────────')
  console.log(`🎉 Done! ${total} items created across the menu`)
  console.log(`   Bulk (no customizations): ${bulkCount}`)
  console.log(`   Single (with customizations): ${singleCount}`)
  if (errorCount > 0) console.log(`   ❌ Errors: ${errorCount}`)
  console.log('\n👀 Check your menu at: http://localhost:3000/1234/A1')
  console.log('──────────────────────────────────────────────\n')
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err)
  process.exit(1)
})
