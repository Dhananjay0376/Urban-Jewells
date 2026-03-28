import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const ensureClient = () => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');
  return client;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfWeek = (date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  return startOfDay(new Date(copy.setDate(diff)));
};
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);

export const ORDER_STATUSES = ['new', 'pending', 'confirmed', 'paid', 'dispatched', 'delivered', 'cancelled'];

export async function createOrderRequest({ orderRef, customer, cart, subtotal, shipping, total }) {
  const client = ensureClient();
  const phone = customer.whatsapp.trim();

  const orderPayload = {
    order_ref: orderRef,
    created_at: new Date().toISOString(),
    customer_name: customer.fullName.trim(),
    phone,
    email: customer.email.trim() || null,
    address_line_1: customer.address1.trim(),
    address_line_2: customer.address2.trim() || null,
    city: customer.city.trim(),
    state: customer.province.trim(),
    pincode: customer.postalCode.trim(),
    notes: customer.notes.trim() || null,
    subtotal,
    shipping,
    total,
    status: 'new',
    payment_method: 'whatsapp',
    source: 'website',
    whatsapp_sent: true,
  };

  const { data: orderData, error: orderError } = await client
    .from('orders')
    .insert(orderPayload)
    .select('id, order_ref')
    .single();
  if (orderError) throw orderError;

  const orderItemsPayload = cart.map(item => ({
    order_id: orderData.id,
    product_id: item.id,
    product_name: item.name,
    product_slug: item.slug,
    variant_id: item.selectedVariantId || null,
    variant_color_name: item.selectedColorName || null,
    size: item.size || null,
    quantity: item.quantity,
    unit_price: item.price,
    line_total: item.price * item.quantity,
  }));

  const { error: itemsError } = await client.from('order_items').insert(orderItemsPayload);
  if (itemsError) throw itemsError;

  return orderData;
}

export async function fetchAdminSnapshot() {
  const client = ensureClient();
  const [{ data: orders, error: ordersError }, { data: inventory, error: inventoryError }, { data: customers, error: customersError }] = await Promise.all([
    client.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
    client.from('inventory').select('*').order('updated_at', { ascending: false }),
    client.from('customers').select('*').order('last_order_at', { ascending: false }).limit(500),
  ]);

  if (ordersError) throw ordersError;
  if (inventoryError) throw inventoryError;
  if (customersError) throw customersError;

  return {
    orders: Array.isArray(orders) ? orders : [],
    inventory: Array.isArray(inventory) ? inventory : [],
    customers: Array.isArray(customers) ? customers : [],
  };
}

async function applyInventoryAdjustmentForOrder(client, orderId) {
  const { data: orderItems, error: itemsError } = await client
    .from('order_items')
    .select('product_id, variant_id, quantity')
    .eq('order_id', orderId);
  if (itemsError) throw itemsError;

  for (const item of orderItems || []) {
    const variantId = item.variant_id || 'base';
    const quantity = Number(item.quantity || 0);
    const { data: inventoryRow, error: inventoryError } = await client
      .from('inventory')
      .select('id, stock_quantity, low_stock_threshold')
      .eq('product_id', item.product_id)
      .eq('variant_id', variantId)
      .maybeSingle();
    if (inventoryError) throw inventoryError;

    const nextStock = Math.max(0, Number(inventoryRow?.stock_quantity || 0) - quantity);
    if (inventoryRow?.id) {
      const { error: updateInventoryError } = await client
        .from('inventory')
        .update({
          stock_quantity: nextStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inventoryRow.id);
      if (updateInventoryError) throw updateInventoryError;
    } else {
      const { error: insertInventoryError } = await client
        .from('inventory')
        .insert({
          product_id: item.product_id,
          variant_id: variantId,
          stock_quantity: 0,
          low_stock_threshold: 2,
          updated_at: new Date().toISOString(),
        });
      if (insertInventoryError) throw insertInventoryError;
    }
  }
}

export function buildDashboardMetrics({ orders = [], inventory = [], customers = [] }) {
  const now = new Date();
  const activeOrders = orders.filter(order => order.status !== 'cancelled');
  const sumRevenue = (items) => items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  const after = (items, boundary) => items.filter(item => new Date(item.created_at) >= boundary);

  const todayOrders = after(activeOrders, todayStart);
  const weekOrders = after(activeOrders, weekStart);
  const monthOrders = after(activeOrders, monthStart);
  const yearOrders = after(activeOrders, yearStart);

  const derivedCustomers = customers.length ? customers : Array.from(activeOrders.reduce((map, order) => {
    const key = order.phone || order.email || order.id;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: order.customer_name,
        phone: order.phone,
        email: order.email,
        created_at: order.created_at,
        last_order_at: order.created_at,
        order_count: 0,
        total_spend: 0,
      });
    }
    const entry = map.get(key);
    entry.order_count += 1;
    entry.total_spend += Number(order.total || 0);
    if (new Date(order.created_at) > new Date(entry.last_order_at)) entry.last_order_at = order.created_at;
    return map;
  }, new Map()).values());
  const lowStock = inventory.filter(item => Number(item.stock_quantity || 0) > 0 && Number(item.stock_quantity || 0) <= Number(item.low_stock_threshold || 0));
  const outOfStock = inventory.filter(item => Number(item.stock_quantity || 0) <= 0);
  const repeatCustomers = derivedCustomers.filter(item => Number(item.order_count || 0) > 1);

  return {
    cards: [
      { label: 'Orders Today', value: todayOrders.length },
      { label: 'Revenue Today', value: sumRevenue(todayOrders) },
      { label: 'Orders This Month', value: monthOrders.length },
      { label: 'Revenue This Month', value: sumRevenue(monthOrders) },
      { label: 'Average Order Value', value: activeOrders.length ? Math.round(sumRevenue(activeOrders) / activeOrders.length) : 0 },
      { label: 'Pending Orders', value: orders.filter(order => ['new', 'pending', 'confirmed'].includes(order.status)).length },
    ],
    summary: {
      todayOrders,
      weekOrders,
      monthOrders,
      yearOrders,
      lowStock,
      outOfStock,
      repeatCustomers,
      customers: derivedCustomers,
    },
  };
}

export async function updateOrderStatus(orderId, status) {
  const client = ensureClient();
  const { data: order, error: orderLookupError } = await client
    .from('orders')
    .select('id, status, inventory_adjusted')
    .eq('id', orderId)
    .single();
  if (orderLookupError) throw orderLookupError;

  if (status === 'paid' && !order.inventory_adjusted) {
    await applyInventoryAdjustmentForOrder(client, orderId);
  }

  const { error } = await client
    .from('orders')
    .update({
      status,
      inventory_adjusted: order.inventory_adjusted || status === 'paid',
    })
    .eq('id', orderId);
  if (error) throw error;
}

export async function upsertInventoryRecord(record) {
  const client = ensureClient();
  const payload = {
    product_id: record.product_id,
    variant_id: record.variant_id || null,
    stock_quantity: Number(record.stock_quantity || 0),
    low_stock_threshold: Number(record.low_stock_threshold || 0),
    updated_at: new Date().toISOString(),
  };
  const { error } = await client
    .from('inventory')
    .upsert(payload, { onConflict: 'product_id,variant_id' });
  if (error) throw error;
}

export function buildWhatsAppOrderMessage({ orderRef, customer, cart, subtotal, shipping, total, formatPrice }) {
  let msg = `Order reference: ${orderRef}\n`;
  msg += `Name: ${customer.fullName}\n`;
  msg += `Email: ${customer.email}\n`;
  msg += `WhatsApp: ${customer.whatsapp}\n`;
  msg += `Address 1: ${customer.address1}\n`;
  if (customer.address2) msg += `Address 2: ${customer.address2}\n`;
  msg += `City: ${customer.city}\n`;
  if (customer.province) msg += `Province/State: ${customer.province}\n`;
  msg += `Postal Code: ${customer.postalCode}\n`;
  msg += `Country: ${customer.country}\n`;
  if (customer.notes) msg += `Notes: ${customer.notes}\n`;
  msg += '\nItems:\n';
  cart.forEach(item => {
    msg += `- ${item.name}`;
    if (item.selectedColorName) msg += ` (color: ${item.selectedColorName})`;
    if (item.size) msg += ` (size: ${item.size})`;
    msg += ` x${item.quantity} = ${formatPrice(item.price * item.quantity)}\n`;
  });
  msg += `\nSubtotal: ${formatPrice(subtotal)}`;
  msg += `\nShipping: ${shipping === 0 ? 'FREE' : formatPrice(shipping)}`;
  msg += `\nTotal: ${formatPrice(total)}`;
  return msg;
}

export function isAdminDataAvailable() {
  return isSupabaseConfigured();
}
