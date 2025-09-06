export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // GET /api/recipes - Liste des recettes
        if (request.method === 'GET' && path === '/api/recipes') {
            return await getRecipes(request, env, corsHeaders);
        }
        
        // GET /api/recipes/[slug] - Détail d'une recette
        if (request.method === 'GET' && path.startsWith('/api/recipes/')) {
            const slug = path.split('/').pop();
            return await getRecipe(slug, env, corsHeaders);
        }
        
        // POST /api/recipes - Créer une recette
        if (request.method === 'POST' && path === '/api/recipes') {
            return await createRecipe(request, env, corsHeaders);
        }
        
        return new Response(JSON.stringify({ error: 'Route non trouvée' }), {
            status: 404,
            headers: corsHeaders
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

async function getRecipes(request, env, corsHeaders) {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 12;
    const offset = (page - 1) * limit;
    
    const category = url.searchParams.get('category');
    const difficulty = url.searchParams.get('difficulty');
    const search = url.searchParams.get('search');
    const featured = url.searchParams.get('featured');
    
    let query = `
        SELECT r.*, c.name as category_name, c.slug as category_slug
        FROM recipes r 
        LEFT JOIN categories c ON r.category_id = c.id 
        WHERE r.is_published = true
    `;
    const params = [];
    
    if (category) {
        query += ` AND c.slug = ?`;
        params.push(category);
    }
    
    if (difficulty) {
        query += ` AND r.difficulty = ?`;
        params.push(difficulty);
    }
    
    if (search) {
        query += ` AND (r.title LIKE ? OR r.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }
    
    if (featured === 'true') {
        query += ` AND r.is_featured = true`;
    }
    
    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const { results } = await env.DB.prepare(query).bind(...params).all();
    
    // Compter le total pour la pagination
    let countQuery = `SELECT COUNT(*) as total FROM recipes r LEFT JOIN categories c ON r.category_id = c.id WHERE r.is_published = true`;
    const countParams = [];
    
    if (category) {
        countQuery += ` AND c.slug = ?`;
        countParams.push(category);
    }
    
    if (difficulty) {
        countQuery += ` AND r.difficulty = ?`;
        countParams.push(difficulty);
    }
    
    if (search) {
        countQuery += ` AND (r.title LIKE ? OR r.description LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const { total } = await env.DB.prepare(countQuery).bind(...countParams).first();
    
    // Parser le contenu JSON
    const recipes = results.map(recipe => ({
        ...recipe,
        content: recipe.content ? JSON.parse(recipe.content) : null
    }));
    
    return new Response(JSON.stringify({
        success: true,
        recipes,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getRecipe(slug, env, corsHeaders) {
    const recipe = await env.DB.prepare(`
        SELECT r.*, c.name as category_name, c.slug as category_slug
        FROM recipes r 
        LEFT JOIN categories c ON r.category_id = c.id 
        WHERE r.slug = ? AND r.is_published = true
    `).bind(slug).first();
    
    if (!recipe) {
        return new Response(JSON.stringify({ error: 'Recette non trouvée' }), {
            status: 404,
            headers: corsHeaders
        });
    }
    
    // Parser le contenu JSON
    recipe.content = recipe.content ? JSON.parse(recipe.content) : null;
    
    return new Response(JSON.stringify({
        success: true,
        recipe
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function createRecipe(request, env, corsHeaders) {
    const data = await request.json();
    
    const result = await env.DB.prepare(`
        INSERT INTO recipes (
            slug, title, description, content, category_id, 
            image_url, prep_time, cook_time, servings, difficulty,
            is_published, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        data.slug,
        data.title,
        data.description,
        JSON.stringify(data.content),
        data.category_id,
        data.image_url,
        data.prep_time,
        data.cook_time,
        data.servings,
        data.difficulty,
        data.is_published || false,
        data.is_featured || false
    ).run();
    
    return new Response(JSON.stringify({
        success: true,
        id: result.meta.last_row_id,
        message: 'Recette créée avec succès'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
