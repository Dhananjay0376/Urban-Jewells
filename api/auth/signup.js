import crypto from 'crypto';
import supabase from '../api/_supabase.js';

function hashPassword(password) {
  const salt = crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
  return salt.toString('hex') + ':' + key.toString('hex');
}

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
      const { email, password, name } = req.body;
      
      const hashedPassword = hashPassword(password);
      
      const { data: user, error } = await supabase
        .from('auth_users')
        .insert({ email, password_hash: hashedPassword })
        .select('id, email, created_at')
        .single();
      
      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        throw error;
      }
      
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      await supabase.from('auth_sessions').insert({
        id: token,
        user_id: user.id,
        expires_at: expiresAt
      });
      
      return res.status(201).json({ user, token });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
