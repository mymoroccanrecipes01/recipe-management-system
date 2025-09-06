export async function onRequest(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const [recipeCount, categoryCount] = await Promise.all([
            env.DB.prepare('SELECT COUNT(*) as count FROM recipes WHERE is_published = true').first(),
            env.DB.prepare('SELECT COUNT(*) as count FROM categories').first()
        ]);
        
        return new Response(JSON.stringify({
            success: true,
            totalRecipes: recipeCount.count,
            totalCategories: categoryCount.count,
            averageRating: 4.8,
            averageTime: 30
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}