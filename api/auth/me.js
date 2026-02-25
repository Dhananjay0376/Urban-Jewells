import supabase from '../api/_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const { data: session, error } = await supabase
        .from('auth_sessions')
        .select('user_id, auth_users(id, email, created_at)')
        .eq('id', token)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error || !session) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      
      return res.status(200).json({ user: session.auth_users });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
