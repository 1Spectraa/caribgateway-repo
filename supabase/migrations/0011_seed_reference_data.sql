-- =============================================================================
-- Migration 0011: Seed reference data
-- Countries, destinations, and categories. All UUIDs are stable so that
-- foreign key references in later seeds (businesses, images) are predictable.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Countries
-- ---------------------------------------------------------------------------

INSERT INTO countries (id, name, iso_code, iso_code_3, slug, flag_emoji, capital, currency_code, languages, timezone, description) VALUES

  ('11111111-0000-0000-0000-000000000001', 'Jamaica',
   'JM', 'JAM', 'jamaica', '🇯🇲', 'Kingston', 'JMD',
   ARRAY['English'], 'America/Jamaica',
   'The island of springs — home to reggae, jerk cuisine, and cascading waterfalls.'),

  ('11111111-0000-0000-0000-000000000002', 'Barbados',
   'BB', 'BRB', 'barbados', '🇧🇧', 'Bridgetown', 'BBD',
   ARRAY['English'], 'America/Barbados',
   'The Gem of the Caribbean, renowned for stunning beaches, rum distilleries, and vibrant coral reefs.'),

  ('11111111-0000-0000-0000-000000000003', 'Trinidad and Tobago',
   'TT', 'TTO', 'trinidad-and-tobago', '🇹🇹', 'Port of Spain', 'TTD',
   ARRAY['English'], 'America/Port_of_Spain',
   'Carnival capital of the world with unmatched biodiversity and a melting-pot culinary tradition.'),

  ('11111111-0000-0000-0000-000000000004', 'Saint Lucia',
   'LC', 'LCA', 'saint-lucia', '🇱🇨', 'Castries', 'XCD',
   ARRAY['English', 'Saint Lucian Creole'], 'America/St_Lucia',
   'The Helen of the West Indies — famed for its twin Piton peaks, sulphur springs, and lush rainforest.'),

  ('11111111-0000-0000-0000-000000000005', 'Antigua and Barbuda',
   'AG', 'ATG', 'antigua-and-barbuda', '🇦🇬', 'Saint John''s', 'XCD',
   ARRAY['English'], 'America/Antigua',
   '365 beaches — one for every day of the year — plus world-class sailing and colonial history.'),

  ('11111111-0000-0000-0000-000000000006', 'Cayman Islands',
   'KY', 'CYM', 'cayman-islands', '🇰🇾', 'George Town', 'KYD',
   ARRAY['English'], 'America/Cayman',
   'World-class diving, pristine Seven Mile Beach, and a reputation for outstanding hospitality.'),

  ('11111111-0000-0000-0000-000000000007', 'The Bahamas',
   'BS', 'BHS', 'the-bahamas', '🇧🇸', 'Nassau', 'BSD',
   ARRAY['English'], 'America/Nassau',
   '700+ islands of turquoise shallows, pink-sand beaches, and vibrant Nassau street art.'),

  ('11111111-0000-0000-0000-000000000008', 'Saint Kitts and Nevis',
   'KN', 'KNA', 'saint-kitts-and-nevis', '🇰🇳', 'Basseterre', 'XCD',
   ARRAY['English'], 'America/St_Kitts',
   'The "mother colony" of the British Caribbean, with a volcanic interior and unspoilt beaches.'),

  ('11111111-0000-0000-0000-000000000009', 'Grenada',
   'GD', 'GRD', 'grenada', '🇬🇩', 'Saint George''s', 'XCD',
   ARRAY['English'], 'America/Grenada',
   'The Isle of Spice — nutmeg, cocoa, and some of the Caribbean''s most spectacular waterfalls.'),

  ('11111111-0000-0000-0000-000000000010', 'Dominican Republic',
   'DO', 'DOM', 'dominican-republic', '🇩🇴', 'Santo Domingo', 'DOP',
   ARRAY['Spanish'], 'America/Santo_Domingo',
   'Home to the Caribbean''s highest peak, oldest colonial city, and 1,600 km of coastline.');

-- ---------------------------------------------------------------------------
-- Destinations (islands / major regions)
-- ---------------------------------------------------------------------------

INSERT INTO destinations (id, country_id, name, slug, destination_type, short_description, latitude, longitude, is_featured, sort_order) VALUES

  -- Jamaica
  ('22222222-0000-0000-0000-000000000001',
   '11111111-0000-0000-0000-000000000001',
   'Jamaica', 'jamaica', 'island',
   'Reggae rhythms, lush rainforests, cascading waterfalls, and legendary island hospitality.',
   18.1096, -77.2975, true, 1),

  -- Barbados
  ('22222222-0000-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   'Barbados', 'barbados', 'island',
   'Crystal-clear waters, world-class coral reefs, and vibrant local culture.',
   13.1939, -59.5432, true, 2),

  -- Trinidad & Tobago
  ('22222222-0000-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   'Trinidad', 'trinidad', 'island',
   'Carnival capital of the world with vibrant festivals, diverse cuisine, and stunning rainforests.',
   10.6918, -61.2225, true, 3),

  ('22222222-0000-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000003',
   'Tobago', 'tobago', 'island',
   'Unspoilt reef systems, leatherback turtles, and the oldest protected rainforest in the Western Hemisphere.',
   11.1743, -60.6680, true, 4),

  -- Saint Lucia
  ('22222222-0000-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000004',
   'Saint Lucia', 'saint-lucia', 'island',
   'Dramatic volcanic peaks, lush rainforests, and secluded luxury retreats.',
   13.9094, -60.9789, true, 5),

  -- Antigua and Barbuda
  ('22222222-0000-0000-0000-000000000006',
   '11111111-0000-0000-0000-000000000005',
   'Antigua', 'antigua', 'island',
   'A beach for every day of the year, from secluded coves to lively shores and world-class sailing.',
   17.0747, -61.8175, true, 6),

  -- Cayman Islands
  ('22222222-0000-0000-0000-000000000007',
   '11111111-0000-0000-0000-000000000006',
   'Grand Cayman', 'grand-cayman', 'island',
   'Pristine Seven Mile Beach, world-renowned stingray encounters, and world-class diving.',
   19.3133, -81.2546, true, 7),

  -- The Bahamas
  ('22222222-0000-0000-0000-000000000008',
   '11111111-0000-0000-0000-000000000007',
   'Nassau and New Providence', 'nassau', 'town',
   'Vibrant Nassau street scenes, colonial architecture, and the legendary Atlantis resort.',
   25.0443, -77.3504, true, 8),

  -- Grenada
  ('22222222-0000-0000-0000-000000000009',
   '11111111-0000-0000-0000-000000000009',
   'Grenada', 'grenada', 'island',
   'The Isle of Spice — nutmeg, cocoa, and spectacular underwater sculpture gardens.',
   12.1165, -61.6790, false, 9),

  -- Dominican Republic
  ('22222222-0000-0000-0000-000000000010',
   '11111111-0000-0000-0000-000000000010',
   'Punta Cana', 'punta-cana', 'area',
   'Powder-white beaches and all-inclusive luxury resorts on the easternmost tip of Hispaniola.',
   18.5820, -68.4055, true, 10);

-- ---------------------------------------------------------------------------
-- Categories (top-level — maps to business_type enum)
-- ---------------------------------------------------------------------------

INSERT INTO categories (id, parent_id, name, slug, icon, color, description, sort_order) VALUES

  ('33333333-0000-0000-0000-000000000001', NULL,
   'Hotels & Accommodation', 'hotels-accommodation', '🏨', '#1f476c',
   'Places to stay: hotels, resorts, villas, guesthouses, and boutique properties.', 1),

  ('33333333-0000-0000-0000-000000000002', NULL,
   'Restaurants & Dining', 'restaurants-dining', '🍽️', '#1f8a8a',
   'Restaurants, cafes, bars, beach shacks, and fine dining experiences.', 2),

  ('33333333-0000-0000-0000-000000000003', NULL,
   'Attractions', 'attractions', '🎭', '#f37e5b',
   'Tourist attractions, historical sites, nature parks, and entertainment.', 3),

  ('33333333-0000-0000-0000-000000000004', NULL,
   'Tour Operators', 'tour-operators', '🗺️', '#1f476c',
   'Guided tours, excursions, and curated travel packages.', 4),

  ('33333333-0000-0000-0000-000000000005', NULL,
   'Transportation', 'transportation', '🚗', '#8a9dab',
   'Car rentals, taxis, ferries, airport transfers, and water taxis.', 5);

-- ---------------------------------------------------------------------------
-- Sub-categories (child entries)
-- ---------------------------------------------------------------------------

INSERT INTO categories (id, parent_id, name, slug, icon, description, sort_order) VALUES

  -- Hotels children
  ('33333333-0000-0000-0001-000000000001',
   '33333333-0000-0000-0000-000000000001',
   'All-Inclusive Resorts', 'all-inclusive-resorts', '🏖️',
   'Full-service resorts with meals, drinks, and activities included.', 1),

  ('33333333-0000-0000-0001-000000000002',
   '33333333-0000-0000-0000-000000000001',
   'Boutique Hotels', 'boutique-hotels', '🏡',
   'Small, independently-run properties with unique character and service.', 2),

  ('33333333-0000-0000-0001-000000000003',
   '33333333-0000-0000-0000-000000000001',
   'Villas & Vacation Rentals', 'villas-vacation-rentals', '🏠',
   'Private villas, apartments, and holiday homes for self-catering stays.', 3),

  ('33333333-0000-0000-0001-000000000004',
   '33333333-0000-0000-0000-000000000001',
   'Guesthouses & B&Bs', 'guesthouses-bnbs', '🛏️',
   'Intimate, locally-run accommodation with a personal touch.', 4),

  -- Restaurants children
  ('33333333-0000-0000-0002-000000000001',
   '33333333-0000-0000-0000-000000000002',
   'Fine Dining', 'fine-dining', '🍷',
   'Upscale restaurants with chef-driven menus and exceptional service.', 1),

  ('33333333-0000-0000-0002-000000000002',
   '33333333-0000-0000-0000-000000000002',
   'Seafood', 'seafood', '🦞',
   'Fresh catch restaurants, fish fries, and seafood specialists.', 2),

  ('33333333-0000-0000-0002-000000000003',
   '33333333-0000-0000-0000-000000000002',
   'Local & Street Food', 'local-street-food', '🌮',
   'Authentic Caribbean flavours — jerk, roti, doubles, and more.', 3),

  ('33333333-0000-0000-0002-000000000004',
   '33333333-0000-0000-0000-000000000002',
   'Bars & Rum Shops', 'bars-rum-shops', '🍹',
   'Beach bars, rum shops, cocktail bars, and nightlife venues.', 4),

  -- Attractions children
  ('33333333-0000-0000-0003-000000000001',
   '33333333-0000-0000-0000-000000000003',
   'Beaches & Nature', 'beaches-nature', '🌊',
   'Public beaches, nature reserves, botanical gardens, and wildlife sanctuaries.', 1),

  ('33333333-0000-0000-0003-000000000002',
   '33333333-0000-0000-0000-000000000003',
   'Historical Sites', 'historical-sites', '🏰',
   'Colonial forts, plantation houses, UNESCO sites, and cultural monuments.', 2),

  ('33333333-0000-0000-0003-000000000003',
   '33333333-0000-0000-0000-000000000003',
   'Water Sports & Diving', 'water-sports-diving', '🤿',
   'Snorkelling, scuba diving, surfing, kitesurfing, and water parks.', 3),

  ('33333333-0000-0000-0003-000000000004',
   '33333333-0000-0000-0000-000000000003',
   'Adventure Activities', 'adventure-activities', '🧗',
   'Zip-lining, hiking, ATV tours, and adrenaline experiences.', 4),

  -- Tour operators children
  ('33333333-0000-0000-0004-000000000001',
   '33333333-0000-0000-0000-000000000004',
   'Island Tours', 'island-tours', '🗺️',
   'Guided half-day and full-day island exploration tours.', 1),

  ('33333333-0000-0000-0004-000000000002',
   '33333333-0000-0000-0000-000000000004',
   'Sailing & Boat Charters', 'sailing-boat-charters', '⛵',
   'Private charters, catamaran cruises, and sunset sailing trips.', 2),

  ('33333333-0000-0000-0004-000000000003',
   '33333333-0000-0000-0000-000000000004',
   'Cultural & Heritage Tours', 'cultural-heritage-tours', '🎭',
   'Immersive tours of local history, culture, art, and cuisine.', 3),

  -- Transportation children
  ('33333333-0000-0000-0005-000000000001',
   '33333333-0000-0000-0000-000000000005',
   'Car Rentals', 'car-rentals', '🚗',
   'Self-drive car and jeep rentals for independent exploration.', 1),

  ('33333333-0000-0000-0005-000000000002',
   '33333333-0000-0000-0000-000000000005',
   'Airport Transfers', 'airport-transfers', '✈️',
   'Private and shared transfers between airports and hotels.', 2),

  ('33333333-0000-0000-0005-000000000003',
   '33333333-0000-0000-0000-000000000005',
   'Ferries & Water Taxis', 'ferries-water-taxis', '⛴️',
   'Inter-island ferries, water taxis, and coastal shuttle services.', 3);

-- ---------------------------------------------------------------------------
-- Starter tags
-- ---------------------------------------------------------------------------

INSERT INTO tags (name, slug, color) VALUES
  ('Pet Friendly',      'pet-friendly',      '#1f8a8a'),
  ('Family Friendly',   'family-friendly',   '#1f476c'),
  ('Adults Only',       'adults-only',       '#f37e5b'),
  ('Eco Certified',     'eco-certified',     '#2d8a4e'),
  ('Wheelchair Access', 'wheelchair-access', '#8a9dab'),
  ('LGBTQ+ Friendly',   'lgbtq-friendly',    '#9b59b6'),
  ('Budget Pick',       'budget-pick',       '#e67e22'),
  ('Editor''s Choice',  'editors-choice',    '#f37e5b'),
  ('New Opening',       'new-opening',       '#1f8a8a'),
  ('Award Winning',     'award-winning',     '#f1c40f');
