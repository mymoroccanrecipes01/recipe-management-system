export async function onRequest(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        if (request.method === 'GET') {
            const { results } = await env.DB.prepare(`
                SELECT c.*, COUNT(r.id) as recipe_count
                FROM categories c
                LEFT JOIN recipes r ON c.id = r.category_id AND r.is_published = true
                GROUP BY c.id
                ORDER BY c.name
            `).all();
            
            return new Response(JSON.stringify({
                success: true,
                categories: results
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
            status: 405,
            headers: corsHeaders
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}