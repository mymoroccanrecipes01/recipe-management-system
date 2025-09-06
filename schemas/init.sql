-- Supprimer les tables si elles existent
DROP TABLE IF EXISTS recipe_tags;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS newsletter_subscribers;

-- Table des catégories
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des recettes
CREATE TABLE recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- JSON avec ingrédients, instructions, etc.
    category_id INTEGER,
    image_url TEXT,
    prep_time INTEGER, -- en minutes
    cook_time INTEGER, -- en minutes
    servings INTEGER,
    difficulty TEXT CHECK(difficulty IN ('facile', 'moyen', 'difficile')),
    rating REAL DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- Table des tags de recettes
CREATE TABLE recipe_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER,
    tag TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
);

-- Table newsletter
CREATE TABLE newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_published ON recipes(is_published);
CREATE INDEX idx_recipes_featured ON recipes(is_featured);
CREATE INDEX idx_recipes_category ON recipes(category_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_recipe_tags_recipe ON recipe_tags(recipe_id);

-- Données de test
INSERT INTO categories (slug, name, description, image_url) VALUES
('tagines', 'Tagines', 'Plats mijotés traditionnels dans un tagine', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop'),
('couscous', 'Couscous', 'Variations du plat national marocain', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop'),
('patisseries', 'Pâtisseries', 'Desserts et douceurs marocaines', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop'),
('soupes', 'Soupes', 'Soupes et potages traditionnels', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&h=200&fit=crop'),
('salades', 'Salades', 'Salades fraîches et mezze', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop');

-- Recettes d'exemple
INSERT INTO recipes (slug, title, description, content, category_id, image_url, prep_time, cook_time, servings, difficulty, rating, is_published, is_featured) VALUES
('tagine-poulet-citron', 'Tagine de Poulet au Citron Confit', 'Un tagine savoureux avec du poulet tendre et des citrons confits', '{"ingredients":[{"group":"Viande","items":[{"text":"1 poulet entier découpé"},{"text":"2 cuillères à soupe d''huile d''olive"}]},{"group":"Légumes","items":[{"text":"2 citrons confits"},{"text":"1 oignon émincé"},{"text":"2 gousses d''ail"}]}],"instructions":[{"name":"Préparation","text":"Faire chauffer l''huile dans le tagine et dorer le poulet de tous côtés."},{"name":"Cuisson","text":"Ajouter les légumes et laisser mijoter 45 minutes à feu doux."}]}', 1, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop', 20, 45, 6, 'moyen', 4.8, true, true),
('couscous-legumes', 'Couscous aux Légumes', 'Couscous traditionnel avec un mélange de légumes de saison', '{"ingredients":[{"group":"Base","items":[{"text":"500g de semoule de couscous"},{"text":"3 cuillères à soupe d''huile d''olive"}]},{"group":"Légumes","items":[{"text":"2 courgettes"},{"text":"2 carottes"},{"text":"1 navet"}]}],"instructions":[{"name":"Préparation semoule","text":"Préparer la semoule selon les instructions traditionnelles."},{"name":"Cuisson légumes","text":"Faire cuire les légumes dans un bouillon parfumé."}]}', 2, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop', 30, 60, 8, 'facile', 4.6, true, true);