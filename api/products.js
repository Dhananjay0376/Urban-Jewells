import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { category, collection, featured, slug, id } = req.query;
      let query = supabase.from('products').select(`*, categories(name, slug), collections(name, slug)`);
      
      if (slug) {
        const { data, error } = await query.eq('slug', slug).single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      
      if (id) {
        const { data, error } = await query.eq('id', id).single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      
      if (category) {
        query = query.eq('categories.slug', category);
      }
      if (collection) {
        query = query.eq('collections.slug', collection);
      }
      if (featured === 'true') {
        query = query.eq('featured', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
