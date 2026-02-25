import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { userId } = req.query;
      let query = supabase.from('orders').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    if (req.method === 'POST') {
      const { userId, fullName, email, phone, address, city, country, province, postalCode, notes, total, items } = req.body;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          full_name: fullName,
          email,
          phone,
          address,
          city,
          country,
          province,
          postal_code: postalCode,
          notes,
          total,
          status: 'Pending'
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      if (items && items.length > 0) {
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size
        }));
        
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;
      }
      
      return res.status(201).json(order);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
