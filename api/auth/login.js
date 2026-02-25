import crypto from 'crypto';
import supabase from '../api/_supabase.js';

function verifyPassword(password, storedHash) {
  const [saltHex, keyHex] = storedHash.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const key = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
  return key.toString('hex') === keyHex;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { email, password } = req.body;
      
      const { data: user, error } = await supabase
        .from('auth_users')
        .select('id, email, password_hash, created_at')
        .eq('email', email)
        .single();
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      if (!verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      await supabase.from('auth_sessions').insert({
        id: token,
        user_id: user.id,
        expires_at: expiresAt
      });
      
      const { password_hash, ...userWithoutPassword } = user;
      return res.status(200).json({ user: userWithoutPassword, token });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
