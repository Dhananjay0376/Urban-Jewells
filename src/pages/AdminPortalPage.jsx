import { useCallback, useEffect, useMemo, useState } from 'react';


function AdminMetricCard({ label, value, formatPrice }) {
  const isMoney = /Revenue|Value/.test(label);
  return (
    <div className="glass-card" style={{padding:'20px 18px'}}>
      <p className="label-tag" style={{marginBottom:'10px',fontSize:'9px'}}>{label}</p>
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'34px',color:'var(--cream)',lineHeight:'1'}}>
        {isMoney ? formatPrice(value) : value}
      </p>
    </div>
  );
}

const getCustomerLookupKey = (entry = {}) => {
  const email = String(entry.email || '').trim().toLowerCase();
  if (email) return `email:${email}`;
  const phone = String(entry.phone || '').trim();
  const normalizedName = String(entry.name || entry.customer_name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (phone) return `phone:${phone}::${normalizedName || 'unknown'}`;
  return `id:${entry.id || ''}`;
};
const toCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const downloadCsv = (filename, headers, rows) => {
  if (typeof window === 'undefined') return;
  const csv = [headers.map(toCsvValue).join(','), ...rows.map(row => row.map(toCsvValue).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function AdminPortalPage({ navigate, deps }) {
  const { useApp, formatPrice, PageBackButton, CatalogLoadingScreen, getAdminProfile, getSupabaseSession, isSupabaseConfigured, onSupabaseAuthChange, signInAdminWithPassword, signOutAdminSession, ORDER_STATUSES, buildDashboardMetrics, deleteCancelledOrder, fetchAdminSnapshot, updateOrderAdminNotes, upsertInventoryRecord, updateOrderStatus } = deps;
  const { products, toast } = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 900 : false;
  const [session, setSession] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authForm, setAuthForm] = useState({ email:'', password:'' });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [snapshot, setSnapshot] = useState({ orders:[], inventory:[], customers:[], orderItems:[], orderStatusHistory:[] });
  const [loadingData, setLoadingData] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [inventoryDrafts, setInventoryDrafts] = useState({});
  const [orderFilter, setOrderFilter] = useState('active');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [adminNoteDraft, setAdminNoteDraft] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [visibleOrderCount, setVisibleOrderCount] = useState(12);
  const [visibleCustomerCount, setVisibleCustomerCount] = useState(12);
  const [visibleInventoryCount, setVisibleInventoryCount] = useState(80);
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) {
      setAuthReady(true);
      return undefined;
    }
    let alive = true;
    getSupabaseSession()
      .then(currentSession => {
        if (alive) {
          setSession(currentSession);
          if (!currentSession) {
            setAdminProfile(null);
            setAuthReady(true);
            return;
          }
          getAdminProfile()
            .then(profile => {
              if (!alive) return;
              setAdminProfile(profile);
              if (!profile) setAuthError('This user is not on the admin allowlist.');
              setAuthReady(true);
            })
            .catch(error => {
              console.error('Failed to read admin profile:', error);
              if (!alive) return;
              setAdminProfile(null);
              setAuthError(error?.message || 'Could not verify admin access.');
              setAuthReady(true);
            });
        }
      })
      .catch(error => {
        console.error('Failed to read admin session:', error);
        if (alive) setAuthReady(true);
      });
    const unsubscribe = onSupabaseAuthChange(nextSession => {
      setSession(nextSession);
      setAuthError('');
      if (!nextSession) {
        setAdminProfile(null);
        setAuthReady(true);
        return;
      }
      getAdminProfile()
        .then(profile => {
          setAdminProfile(profile);
          if (!profile) setAuthError('This user is not on the admin allowlist.');
          setAuthReady(true);
        })
        .catch(error => {
          console.error('Failed to read admin profile:', error);
          setAdminProfile(null);
          setAuthError(error?.message || 'Could not verify admin access.');
          setAuthReady(true);
        });
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [supabaseReady]);

  const loadSnapshot = useCallback(async () => {
    if (!session || !adminProfile || !supabaseReady) return;
    setLoadingData(true);
    try {
      const nextSnapshot = await fetchAdminSnapshot();
      setSnapshot(nextSnapshot);
    } catch (error) {
      console.error('Failed to load admin snapshot:', error);
      toast(error?.message || 'Could not load admin data.', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [adminProfile, session, supabaseReady, toast]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const metrics = useMemo(() => buildDashboardMetrics(snapshot), [snapshot]);
  const customerRows = metrics.summary.customers || [];
  const visibleCustomers = useMemo(() => {
    const q = customerSearchTerm.trim().toLowerCase();
    if (!q) return customerRows;
    return customerRows.filter(customer => [customer.name, customer.phone, customer.email].some(value => String(value || '').toLowerCase().includes(q)));
  }, [customerRows, customerSearchTerm]);
  const orderItemsByOrderId = useMemo(() => snapshot.orderItems?.reduce((map, item) => {
    if (!map.has(item.order_id)) map.set(item.order_id, []);
    map.get(item.order_id).push(item);
    return map;
  }, new Map()) || new Map(), [snapshot.orderItems]);
  const orderHistoryByOrderId = useMemo(() => snapshot.orderStatusHistory?.reduce((map, item) => {
    if (!map.has(item.order_id)) map.set(item.order_id, []);
    map.get(item.order_id).push(item);
    return map;
  }, new Map()) || new Map(), [snapshot.orderStatusHistory]);
  const selectedOrder = useMemo(() => snapshot.orders.find(order => order.id === selectedOrderId) || null, [selectedOrderId, snapshot.orders]);
  const customerOrdersByKey = useMemo(() => snapshot.orders.reduce((map, order) => {
    const key = getCustomerLookupKey(order);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(order);
    return map;
  }, new Map()), [snapshot.orders]);
  const selectedCustomer = useMemo(() => visibleCustomers.find(customer => customer.id === selectedCustomerId) || customerRows.find(customer => customer.id === selectedCustomerId) || null, [customerRows, selectedCustomerId, visibleCustomers]);
  const visibleOrders = useMemo(() => {
    let orders = snapshot.orders;
    if (orderFilter === 'cancelled') orders = orders.filter(order => order.status === 'cancelled');
    else if (orderFilter === 'active') orders = orders.filter(order => order.status !== 'cancelled');
    if (statusFilter !== 'all') orders = orders.filter(order => order.status === statusFilter);
    if (dateFilter !== 'all') {
      const now = new Date();
      const start = new Date(now);
      if (dateFilter === 'today') start.setHours(0, 0, 0, 0);
      if (dateFilter === 'week') start.setDate(now.getDate() - 7);
      if (dateFilter === 'month') start.setMonth(now.getMonth() - 1);
      orders = orders.filter(order => new Date(order.created_at) >= start);
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      orders = orders.filter(order => [order.order_ref, order.customer_name, order.phone, order.email, order.city, order.state].some(value => String(value || '').toLowerCase().includes(q)));
    }
    return orders;
  }, [dateFilter, orderFilter, searchTerm, snapshot.orders, statusFilter]);
  useEffect(() => {
    if (!selectedOrderId && visibleOrders.length) {
      setSelectedOrderId(visibleOrders[0].id);
      return;
    }
    if (selectedOrderId && !visibleOrders.some(order => order.id === selectedOrderId)) {
      setSelectedOrderId(visibleOrders[0]?.id || null);
    }
  }, [selectedOrderId, visibleOrders]);
  useEffect(() => {
    setVisibleOrderCount(12);
  }, [orderFilter, statusFilter, dateFilter, searchTerm]);
  useEffect(() => {
    setAdminNoteDraft(selectedOrder?.admin_notes || '');
  }, [selectedOrder]);
  useEffect(() => {
    if (!selectedCustomerId && visibleCustomers.length) {
      setSelectedCustomerId(visibleCustomers[0].id);
      return;
    }
    if (selectedCustomerId && !visibleCustomers.some(customer => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(visibleCustomers[0]?.id || null);
    }
  }, [selectedCustomerId, visibleCustomers]);
  useEffect(() => {
    setVisibleCustomerCount(12);
  }, [customerSearchTerm]);

  const inventoryRows = useMemo(() => {
    const inventoryMap = new Map(snapshot.inventory.map(item => [`${item.product_id}::${item.variant_id || 'base'}`, item]));
    const rows = [];
    products.forEach(product => {
      if (Array.isArray(product.variants) && product.variants.length) {
        product.variants.forEach(variant => {
          const key = `${product.id}::${variant.id}`;
          const record = inventoryMap.get(key);
          rows.push({
            key,
            product_id: product.id,
            variant_id: variant.id,
            productName: product.name,
            variantLabel: variant.colorName,
            stock_quantity: record?.stock_quantity ?? '',
            low_stock_threshold: record?.low_stock_threshold ?? 2,
            stockStatus: Number(record?.stock_quantity ?? 0) <= 0 ? 'out' : (Number(record?.stock_quantity ?? 0) <= Number(record?.low_stock_threshold ?? 2) ? 'low' : 'healthy'),
          });
        });
      } else {
        const key = `${product.id}::base`;
        const record = inventoryMap.get(key);
        rows.push({
          key,
          product_id: product.id,
          variant_id: 'base',
          productName: product.name,
          variantLabel: 'Base Product',
          stock_quantity: record?.stock_quantity ?? '',
          low_stock_threshold: record?.low_stock_threshold ?? 2,
          stockStatus: Number(record?.stock_quantity ?? 0) <= 0 ? 'out' : (Number(record?.stock_quantity ?? 0) <= Number(record?.low_stock_threshold ?? 2) ? 'low' : 'healthy'),
        });
      }
    });
    return rows;
  }, [products, snapshot.inventory]);
  const visibleInventoryRows = useMemo(() => {
    const q = inventorySearchTerm.trim().toLowerCase();
    const priority = { out: 0, low: 1, healthy: 2 };
    return inventoryRows
      .filter(row => {
        if (inventoryFilter === 'out' && row.stockStatus !== 'out') return false;
        if (inventoryFilter === 'low' && row.stockStatus !== 'low') return false;
        if (inventoryFilter === 'healthy' && row.stockStatus !== 'healthy') return false;
        if (inventoryFilter === 'variant' && row.variant_id === 'base') return false;
        if (inventoryFilter === 'base' && row.variant_id !== 'base') return false;
        if (!q) return true;
        return [row.productName, row.variantLabel, row.product_id, row.variant_id].some(value => String(value || '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const statusDelta = priority[a.stockStatus] - priority[b.stockStatus];
        if (statusDelta !== 0) return statusDelta;
        return a.productName.localeCompare(b.productName);
      });
  }, [inventoryFilter, inventoryRows, inventorySearchTerm]);
  const inventorySummary = useMemo(() => ({
    total: inventoryRows.length,
    variants: inventoryRows.filter(row => row.variant_id !== 'base').length,
    low: inventoryRows.filter(row => row.stockStatus === 'low').length,
    out: inventoryRows.filter(row => row.stockStatus === 'out').length,
  }), [inventoryRows]);
  useEffect(() => {
    setVisibleInventoryCount(80);
  }, [inventorySearchTerm, inventoryFilter]);

  const handleLogin = async () => {
    setAuthSubmitting(true);
    setAuthError('');
    try {
      await signInAdminWithPassword(authForm.email.trim(), authForm.password);
      const profile = await getAdminProfile();
      if (!profile) {
        await signOutAdminSession();
        throw new Error('This user is not on the admin allowlist.');
      }
      setAdminProfile(profile);
      toast('Admin session started.');
    } catch (error) {
      setAuthError(error?.message || 'Could not sign in.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutAdminSession();
      setAdminProfile(null);
      toast('Signed out of admin.');
    } catch (error) {
      toast(error?.message || 'Could not sign out.', 'error');
    }
  };

  const handleOrderStatusChange = async (orderId, status) => {
    setSavingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      await loadSnapshot();
      toast('Order status updated.');
    } catch (error) {
      toast(error?.message || 'Could not update order status.', 'error');
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleDeleteCancelledOrder = async (orderId) => {
    const order = snapshot.orders.find(item => item.id === orderId);
    const shouldDelete = typeof window === 'undefined'
      ? true
      : window.prompt(`Type DELETE to permanently remove ${order?.order_ref || 'this cancelled order'}.`) === 'DELETE';
    if (!shouldDelete) {
      toast('Delete cancelled.');
      return;
    }
    setSavingOrderId(orderId);
    try {
      await deleteCancelledOrder(orderId);
      setSnapshot(prev => ({
        ...prev,
        orders: prev.orders.filter(order => order.id !== orderId),
      }));
      toast('Cancelled order deleted.');
    } catch (error) {
      toast(error?.message || 'Could not delete the order.', 'error');
    } finally {
      setSavingOrderId(null);
    }
  };
  const handleExportOrders = () => {
    downloadCsv('urban-jewells-orders.csv',
      ['Order Ref', 'Created At', 'Customer', 'Phone', 'Email', 'City', 'State', 'Status', 'Subtotal', 'Shipping', 'Total'],
      visibleOrders.map(order => [order.order_ref, order.created_at, order.customer_name, order.phone, order.email, order.city, order.state, order.status, order.subtotal, order.shipping, order.total]));
    toast('Orders CSV downloaded.');
  };
  const handleExportCustomers = () => {
    downloadCsv('urban-jewells-customers.csv',
      ['Name', 'Phone', 'Email', 'Order Count', 'Total Spend', 'Last Order'],
      visibleCustomers.map(customer => [customer.name, customer.phone, customer.email, customer.order_count, customer.total_spend, customer.last_order_at]));
    toast('Customers CSV downloaded.');
  };
  const handleExportInventory = () => {
    downloadCsv('urban-jewells-inventory.csv',
      ['Product', 'Variant', 'Variant Id', 'Stock Quantity', 'Low Stock Threshold', 'Status'],
      visibleInventoryRows.map(row => [row.productName, row.variantLabel, row.variant_id, row.stock_quantity, row.low_stock_threshold, row.stockStatus]));
    toast('Inventory CSV downloaded.');
  };

  const handleAdminNotesSave = async () => {
    if (!selectedOrder) return;
    setSavingOrderId(selectedOrder.id);
    try {
      await updateOrderAdminNotes(selectedOrder.id, adminNoteDraft);
      setSnapshot(prev => ({
        ...prev,
        orders: prev.orders.map(order => order.id === selectedOrder.id ? { ...order, admin_notes: adminNoteDraft.trim() || null } : order),
      }));
      toast('Admin notes saved.');
    } catch (error) {
      toast(error?.message || 'Could not save admin notes.', 'error');
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleInventoryChange = (key, field, value) => {
    setInventoryDrafts(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const handleInventorySave = async (row) => {
    const draft = inventoryDrafts[row.key] || {};
    const nextRecord = {
      product_id: row.product_id,
      variant_id: row.variant_id,
      stock_quantity: draft.stock_quantity ?? row.stock_quantity ?? 0,
      low_stock_threshold: draft.low_stock_threshold ?? row.low_stock_threshold ?? 2,
    };
    setSavingOrderId(row.key);
    try {
      await upsertInventoryRecord(nextRecord);
      toast('Inventory updated.');
      setInventoryDrafts(prev => {
        const copy = { ...prev };
        delete copy[row.key];
        return copy;
      });
      await loadSnapshot();
    } catch (error) {
      toast(error?.message || 'Could not update inventory.', 'error');
    } finally {
      setSavingOrderId(null);
    }
  };
  const handleInventorySaveAll = async () => {
    const keys = Object.keys(inventoryDrafts);
    if (!keys.length) {
      toast('No inventory edits to save yet.');
      return;
    }
    setSavingOrderId('inventory-bulk');
    try {
      for (const row of inventoryRows) {
        const draft = inventoryDrafts[row.key];
        if (!draft) continue;
        await upsertInventoryRecord({
          product_id: row.product_id,
          variant_id: row.variant_id,
          stock_quantity: draft.stock_quantity ?? row.stock_quantity ?? 0,
          low_stock_threshold: draft.low_stock_threshold ?? row.low_stock_threshold ?? 2,
        });
      }
      setInventoryDrafts({});
      await loadSnapshot();
      toast('All inventory edits saved.');
    } catch (error) {
      toast(error?.message || 'Could not save all inventory changes.', 'error');
    } finally {
      setSavingOrderId(null);
    }
  };

  if (!supabaseReady) {
    return (
      <div style={{background:'var(--ink)',minHeight:'100vh',paddingTop:'70px'}}>
        <div style={{maxWidth:'960px',margin:'0 auto',padding:isMobile?'28px 20px 44px':'48px'}}>
          <PageBackButton onClick={()=>navigate('home')} label="Back"/>
          <div className="glass-card" style={{padding:isMobile?'28px 20px':'36px 32px'}}>
            <p className="label-tag" style={{marginBottom:'12px'}}>ADMIN PORTAL</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(34px,5vw,56px)',color:'var(--cream)',marginBottom:'14px'}}>Supabase setup required</h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'15px',color:'rgba(250,250,245,.46)',lineHeight:'1.85',marginBottom:'18px'}}>
              The admin portal is built, but it needs Supabase credentials and tables before it can capture orders or show metrics.
            </p>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'var(--mint)',lineHeight:'1.8'}}>
              1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env` and Vercel.
              <br/>2. Run the SQL in `supabase/schema.sql`.
              <br/>3. Create an admin user in Supabase Auth.
              <br/>4. Reopen `#/admin`.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!authReady) return <CatalogLoadingScreen label="Loading admin portal"/>;

  if (!session || !adminProfile) {
    return (
      <div style={{background:'var(--ink)',minHeight:'100vh',paddingTop:'70px'}}>
        <div style={{maxWidth:'540px',margin:'0 auto',padding:isMobile?'28px 20px 44px':'56px 24px'}}>
          <PageBackButton onClick={()=>navigate('home')} label="Back"/>
          <div className="glass-card" style={{padding:isMobile?'28px 20px':'36px 32px'}}>
            <p className="label-tag" style={{marginBottom:'12px'}}>ADMIN ACCESS</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(34px,5vw,52px)',color:'var(--cream)',marginBottom:'12px'}}>Sign in</h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.42)',lineHeight:'1.8',marginBottom:'24px'}}>
              Use your admin email and password from Supabase Auth to open the operations dashboard.
            </p>
            <div style={{display:'grid',gap:'14px'}}>
              <div>
                <label style={{display:'block',fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.35)',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:'8px'}}>Email</label>
                <input value={authForm.email} onChange={e=>setAuthForm(prev => ({ ...prev, email:e.target.value }))} className="dark-field" placeholder="admin@urbanjewells.in" />
              </div>
              <div>
                <label style={{display:'block',fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.35)',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:'8px'}}>Password</label>
                <input type="password" value={authForm.password} onChange={e=>setAuthForm(prev => ({ ...prev, password:e.target.value }))} className="dark-field" placeholder="••••••••" />
              </div>
              {authError && <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'#F87171'}}>{authError}</p>}
              <button className="btn-luxury" onClick={handleLogin} disabled={authSubmitting} style={{justifyContent:'center',opacity:authSubmitting?0.65:1,cursor:authSubmitting?'not-allowed':'none'}}>
                {authSubmitting ? 'SIGNING IN...' : 'OPEN ADMIN PORTAL'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{background:'var(--ink)',minHeight:'100vh',paddingTop:'70px'}}>
      <div style={{maxWidth:'1320px',margin:'0 auto',padding:isMobile?'28px 20px 44px':'40px 48px 56px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:isMobile?'flex-start':'center',gap:'16px',flexDirection:isMobile?'column':'row',marginBottom:'28px'}}>
          <div>
            <p className="label-tag" style={{marginBottom:'10px'}}>ADMIN PORTAL</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(34px,5vw,56px)',color:'var(--cream)',lineHeight:'1'}}>Store Operations</h1>
          </div>
          <div style={{display:'flex',gap:'10px',width:isMobile?'100%':'auto',flexWrap:'wrap'}}>
            <button className="btn-ghost-luxury" onClick={loadSnapshot} style={{justifyContent:'center',width:isMobile?'100%':'auto'}}>{loadingData ? 'REFRESHING...' : 'REFRESH DATA'}</button>
            <button className="btn-luxury" onClick={handleLogout} style={{justifyContent:'center',width:isMobile?'100%':'auto'}}>SIGN OUT</button>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(3,minmax(0,1fr))',gap:'14px',marginBottom:'28px'}}>
          {metrics.cards.map(card => <AdminMetricCard key={card.label} {...card} formatPrice={formatPrice} />)}
        </div>

        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.2fr .8fr',gap:'18px',marginBottom:'18px'}}>
          <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',gap:'12px',flexWrap:'wrap'}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)'}}>Recent Orders</h2>
              <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.32)',letterSpacing:'.12em'}}>AUTO-CAPTURED FROM CHECKOUT</p>
                <button className="btn-ghost-luxury" onClick={handleExportOrders} style={{padding:'8px 12px',fontSize:'10px'}}>EXPORT CSV</button>
                <input
                  className="dark-field"
                  value={searchTerm}
                  onChange={e=>setSearchTerm(e.target.value)}
                  placeholder="Search order, customer, phone"
                  style={{minWidth:isMobile?'100%':'220px'}}
                />
                <select
                  value={orderFilter}
                  onChange={e=>setOrderFilter(e.target.value)}
                  style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'8px 10px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.72)',outline:'none',cursor:'none'}}
                >
                  <option value="active">ACTIVE ONLY</option>
                  <option value="all">ALL ORDERS</option>
                  <option value="cancelled">CANCELLED ONLY</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={e=>setStatusFilter(e.target.value)}
                  style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'8px 10px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.72)',outline:'none',cursor:'none'}}
                >
                  <option value="all">ANY STATUS</option>
                  {ORDER_STATUSES.map(status => <option key={status} value={status}>{status.toUpperCase()}</option>)}
                </select>
                <select
                  value={dateFilter}
                  onChange={e=>setDateFilter(e.target.value)}
                  style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'8px 10px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.72)',outline:'none',cursor:'none'}}
                >
                  <option value="all">ALL DATES</option>
                  <option value="today">TODAY</option>
                  <option value="week">LAST 7 DAYS</option>
                  <option value="month">LAST 30 DAYS</option>
                </select>
              </div>
            </div>
            <div style={{display:'grid',gap:'12px'}}>
              {visibleOrders.slice(0, visibleOrderCount).map(order => (
                <div key={order.id} onClick={()=>setSelectedOrderId(order.id)} style={{padding:'14px',border:`1px solid ${selectedOrderId===order.id?'rgba(201,168,76,.28)':'rgba(168,230,207,.08)'}`,borderRadius:'10px',background:selectedOrderId===order.id?'rgba(201,168,76,.05)':'rgba(255,255,255,.02)',cursor:'none'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px',flexWrap:'wrap',marginBottom:'10px'}}>
                    <div>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'var(--mint)',letterSpacing:'.08em'}}>{order.order_ref}</p>
                      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'15px',color:'rgba(250,250,245,.86)',marginTop:'4px'}}>{order.customer_name}</p>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.32)',marginTop:'4px'}}>{order.phone}</p>
                    </div>
                    <div style={{textAlign:isMobile?'left':'right'}}>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:'13px',color:'var(--gold)'}}>{formatPrice(order.total)}</p>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',marginTop:'4px'}}>{new Date(order.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'12px',color:'rgba(250,250,245,.42)'}}>
                      {order.city}, {order.state} • {order.pincode}
                    </p>
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                      <select
                        value={order.status}
                        onChange={e=>handleOrderStatusChange(order.id, e.target.value)}
                        disabled={savingOrderId === order.id}
                        style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'8px 10px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.72)',outline:'none',cursor:'none'}}
                      >
                        {ORDER_STATUSES.map(status => <option key={status} value={status}>{status.toUpperCase()}</option>)}
                      </select>
                      {order.status === 'cancelled' && (
                        <button
                          className="btn-ghost-luxury"
                          onClick={()=>handleDeleteCancelledOrder(order.id)}
                          disabled={savingOrderId === order.id}
                          style={{padding:'8px 12px',fontSize:'10px',letterSpacing:'.1em',color:'#FCA5A5',borderColor:'rgba(248,113,113,.28)'}}
                        >
                          {savingOrderId === order.id ? 'DELETING...' : 'DELETE'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {visibleOrders.length > visibleOrderCount && (
                <button className="btn-ghost-luxury" onClick={()=>setVisibleOrderCount(count => count + 12)} style={{justifyContent:'center'}}>
                  LOAD MORE ORDERS
                </button>
              )}
              {!visibleOrders.length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>No orders in this view yet.</p>}
            </div>
          </div>

          <div style={{display:'grid',gap:'18px'}}>
            <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)',marginBottom:'12px'}}>Order Detail</h2>
              {selectedOrder ? (
                <div style={{display:'grid',gap:'14px'}}>
                  <div style={{paddingBottom:'10px',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'var(--mint)'}}>{selectedOrder.order_ref}</p>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'16px',color:'rgba(250,250,245,.84)',marginTop:'6px'}}>{selectedOrder.customer_name}</p>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',marginTop:'6px'}}>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Customer</p>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.72)',lineHeight:'1.8'}}>{selectedOrder.phone}</p>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.72)',lineHeight:'1.8'}}>{selectedOrder.email || 'No email'}</p>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.52)',lineHeight:'1.8',marginTop:'4px'}}>
                      {[selectedOrder.address_line_1, selectedOrder.address_line_2, `${selectedOrder.city}, ${selectedOrder.state} ${selectedOrder.pincode}`].filter(Boolean).join(', ')}
                    </p>
                    {selectedOrder.notes && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.52)',lineHeight:'1.8',marginTop:'8px'}}>Note: {selectedOrder.notes}</p>}
                  </div>
                  <div>
                    <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Items</p>
                    <div style={{display:'grid',gap:'10px'}}>
                      {(orderItemsByOrderId.get(selectedOrder.id) || []).map(item => (
                        <div key={item.id} style={{padding:'10px 0',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.82)'}}>{item.product_name}</p>
                          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',marginTop:'4px'}}>
                            {[item.variant_color_name ? `Color: ${item.variant_color_name}` : null, item.size ? `Size: ${item.size}` : null, `Qty: ${item.quantity}`].filter(Boolean).join(' • ')}
                          </p>
                          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'var(--gold)',marginTop:'6px'}}>{formatPrice(item.line_total)}</p>
                        </div>
                      ))}
                      {!(orderItemsByOrderId.get(selectedOrder.id) || []).length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.45)'}}>No items found for this order.</p>}
                    </div>
                  </div>
                  <div>
                    <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Status History</p>
                    <div style={{display:'grid',gap:'10px'}}>
                      {(orderHistoryByOrderId.get(selectedOrder.id) || []).slice(0, 8).map(entry => (
                        <div key={entry.id} style={{display:'flex',justifyContent:'space-between',gap:'10px',padding:'10px 0',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.78)'}}>{entry.previous_status ? `${entry.previous_status} -> ${entry.next_status}` : entry.next_status}</p>
                          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)'}}>{new Date(entry.changed_at).toLocaleString('en-IN')}</p>
                        </div>
                      ))}
                      {!(orderHistoryByOrderId.get(selectedOrder.id) || []).length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.45)'}}>No status history yet.</p>}
                    </div>
                  </div>
                  <div>
                    <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Admin Notes</p>
                    <textarea
                      className="dark-field"
                      value={adminNoteDraft}
                      onChange={e=>setAdminNoteDraft(e.target.value)}
                      placeholder="Internal notes for payment, dispatch, customer requests..."
                      rows={4}
                      style={{resize:'vertical',minHeight:'110px'}}
                    />
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'10px',marginTop:'10px',flexWrap:'wrap'}}>
                      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'12px',color:'rgba(250,250,245,.42)'}}>
                        Internal only. Customers do not see these notes.
                      </p>
                      <button
                        className="btn-ghost-luxury"
                        onClick={handleAdminNotesSave}
                        disabled={savingOrderId === selectedOrder.id}
                        style={{padding:'10px 14px',fontSize:'10px'}}
                      >
                        {savingOrderId === selectedOrder.id ? 'SAVING...' : 'SAVE NOTES'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.45)'}}>Select an order to inspect full details.</p>}
            </div>
            <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)',marginBottom:'12px'}}>Operations</h2>
              <div style={{display:'grid',gap:'10px'}}>
                {[
                  { label:'Orders This Week', value: metrics.summary.weekOrders.length },
                  { label:'Orders This Year', value: metrics.summary.yearOrders.length },
                  { label:'Low Stock SKUs', value: metrics.summary.lowStock.length },
                  { label:'Out of Stock SKUs', value: metrics.summary.outOfStock.length },
                  { label:'Repeat Customers', value: metrics.summary.repeatCustomers.length },
                  { label:'Cancellation Rate', value: `${metrics.summary.cancellationRate}%` },
                ].map(item => (
                  <div key={item.label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.45)'}}>{item.label}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:'13px',color:'var(--mint)'}}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px',flexWrap:'wrap',marginBottom:'12px'}}>
                <div>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)'}}>Customers</h2>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',marginTop:'6px'}}>
                    {visibleCustomers.length} shown • {customerRows.length} total
                  </p>
                </div>
                <input
                  className="dark-field"
                  value={customerSearchTerm}
                  onChange={e=>setCustomerSearchTerm(e.target.value)}
                  placeholder="Search name, phone, email"
                  style={{minWidth:isMobile?'100%':'220px'}}
                />
                <button className="btn-ghost-luxury" onClick={handleExportCustomers} style={{padding:'8px 12px',fontSize:'10px'}}>EXPORT CSV</button>
              </div>
              {customerRows.length ? (
                <div style={{display:'grid',gap:'14px'}}>
                  <div style={{display:'grid',gap:'10px',maxHeight:isMobile?'none':'420px',overflowY:isMobile?'visible':'auto',paddingRight:isMobile?0:'4px'}}>
                    {visibleCustomers.slice(0, visibleCustomerCount).map(customer => (
                      <button
                        key={customer.id}
                        onClick={()=>setSelectedCustomerId(customer.id)}
                        style={{
                          textAlign:'left',
                          padding:'12px',
                          border:`1px solid ${selectedCustomerId===customer.id?'rgba(201,168,76,.28)':'rgba(168,230,207,.08)'}`,
                          borderRadius:'10px',
                          background:selectedCustomerId===customer.id?'rgba(201,168,76,.05)':'rgba(255,255,255,.02)',
                          cursor:'none'
                        }}
                      >
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.82)'}}>{customer.name}</p>
                        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',marginTop:'4px'}}>{customer.phone || customer.email || 'No contact'}</p>
                        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',marginTop:'6px'}}>
                          {customer.order_count} orders • {formatPrice(customer.total_spend || 0)}
                        </p>
                      </button>
                    ))}
                  </div>
                  {visibleCustomers.length > visibleCustomerCount && (
                    <button className="btn-ghost-luxury" onClick={()=>setVisibleCustomerCount(count => count + 12)} style={{justifyContent:'center'}}>
                      LOAD MORE CUSTOMERS
                    </button>
                  )}
                  {selectedCustomer && (
                    <div style={{paddingTop:'6px',borderTop:'1px solid rgba(168,230,207,.06)',display:'grid',gap:'10px'}}>
                      <div>
                        <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Customer Detail</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'15px',color:'rgba(250,250,245,.86)'}}>{selectedCustomer.name}</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.62)',marginTop:'4px'}}>{selectedCustomer.phone || 'No phone'}</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.52)',marginTop:'2px'}}>{selectedCustomer.email || 'No email'}</p>
                        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',marginTop:'8px'}}>
                          Last order: {selectedCustomer.last_order_at ? new Date(selectedCustomer.last_order_at).toLocaleString('en-IN') : 'No orders yet'}
                        </p>
                      </div>
                      <div>
                        <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Recent Orders</p>
                        <div style={{display:'grid',gap:'10px'}}>
                          {(customerOrdersByKey.get(selectedCustomer.id) || []).slice(0, 5).map(order => (
                            <button
                              key={order.id}
                              onClick={()=>setSelectedOrderId(order.id)}
                              style={{textAlign:'left',padding:'10px 0',borderBottom:'1px solid rgba(168,230,207,.06)',background:'transparent',cursor:'none'}}
                            >
                              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)'}}>{order.order_ref}</p>
                              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.72)',marginTop:'4px'}}>
                                {formatPrice(order.total)} • {order.status}
                              </p>
                            </button>
                          ))}
                          {!(customerOrdersByKey.get(selectedCustomer.id) || []).length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.45)'}}>No orders tied to this customer yet.</p>}
                        </div>
                      </div>
                    </div>
                  )}
                  {!visibleCustomers.length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>No customers match this search yet.</p>}
                </div>
              ) : <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>Customer profiles will appear once orders are captured.</p>}
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,minmax(0,1fr))',gap:'18px',marginBottom:'18px'}}>
          <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)',marginBottom:'12px'}}>Top Products</h2>
            <div style={{display:'grid',gap:'12px'}}>
              {metrics.summary.topProducts.map(product => (
                <div key={product.id} style={{paddingBottom:'10px',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.84)'}}>{product.name}</p>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',marginTop:'4px'}}>{product.units} units sold</p>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'var(--gold)',marginTop:'6px'}}>{formatPrice(product.revenue)}</p>
                </div>
              ))}
              {!metrics.summary.topProducts.length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>Top products will appear once orders are captured.</p>}
            </div>
          </div>

          <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)',marginBottom:'12px'}}>Top Variants</h2>
            <div style={{display:'grid',gap:'12px'}}>
              {metrics.summary.topVariants.map(variant => (
                <div key={variant.id} style={{paddingBottom:'10px',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.84)'}}>{variant.name}</p>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',marginTop:'4px'}}>{variant.variant}</p>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',marginTop:'6px'}}>{variant.units} units • {formatPrice(variant.revenue)}</p>
                </div>
              ))}
              {!metrics.summary.topVariants.length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>Variant performance will appear once variant orders are captured.</p>}
            </div>
          </div>

          <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)',marginBottom:'12px'}}>Pending Ageing</h2>
            <div style={{display:'grid',gap:'10px'}}>
              {[
                { label:'Fresh under 24h', value: metrics.summary.ageing.fresh, color:'var(--mint)' },
                { label:'Over 24h', value: metrics.summary.ageing.over24, color:'#FBBF24' },
                { label:'Over 72h', value: metrics.summary.ageing.over72, color:'#F87171' },
              ].map(item => (
                <div key={item.label} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.5)'}}>{item.label}</span>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:'13px',color:item.color}}>{item.value}</span>
                </div>
              ))}
            </div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'12px',color:'rgba(250,250,245,.38)',lineHeight:'1.8',marginTop:'14px'}}>
              Tracks how long `new`, `pending`, and `confirmed` orders have been waiting without a final outcome.
            </p>
          </div>
        </div>

        <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',gap:'12px',flexWrap:'wrap'}}>
            <div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)'}}>Inventory</h2>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',letterSpacing:'.1em',marginTop:'6px'}}>MANUAL STOCK CONTROL</p>
            </div>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              <button className="btn-ghost-luxury" onClick={handleExportInventory} style={{justifyContent:'center',padding:'12px 18px',fontSize:'10px'}}>EXPORT CSV</button>
              <button
                className="btn-ghost-luxury"
                onClick={handleInventorySaveAll}
                disabled={savingOrderId === 'inventory-bulk' || !Object.keys(inventoryDrafts).length}
                style={{justifyContent:'center',padding:'12px 18px',opacity:(savingOrderId === 'inventory-bulk' || !Object.keys(inventoryDrafts).length) ? 0.5 : 1}}
              >
                {savingOrderId === 'inventory-bulk' ? 'SAVING ALL...' : `SAVE ALL${Object.keys(inventoryDrafts).length ? ` (${Object.keys(inventoryDrafts).length})` : ''}`}
              </button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(4,minmax(0,1fr))',gap:'10px',marginBottom:'16px'}}>
            {[
              { label:'Tracked SKUs', value:inventorySummary.total, tone:'rgba(250,250,245,.82)' },
              { label:'Variant Rows', value:inventorySummary.variants, tone:'var(--mint)' },
              { label:'Low Stock', value:inventorySummary.low, tone:'#FBBF24' },
              { label:'Out of Stock', value:inventorySummary.out, tone:'#F87171' },
            ].map(item => (
              <div key={item.label} style={{padding:'14px 12px',border:'1px solid rgba(168,230,207,.08)',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.32)',letterSpacing:'.08em'}}>{item.label}</p>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:item.tone,marginTop:'8px',lineHeight:'1'}}>{item.value}</p>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'16px',alignItems:'center'}}>
            <input
              className="dark-field"
              value={inventorySearchTerm}
              onChange={e=>setInventorySearchTerm(e.target.value)}
              placeholder="Search product or variant"
              style={{minWidth:isMobile?'100%':'220px'}}
            />
            <select
              value={inventoryFilter}
              onChange={e=>setInventoryFilter(e.target.value)}
              style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'8px 10px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.72)',outline:'none',cursor:'none'}}
            >
              <option value="all">ALL STOCK</option>
              <option value="out">OUT OF STOCK</option>
              <option value="low">LOW STOCK</option>
              <option value="healthy">HEALTHY</option>
              <option value="variant">VARIANTS ONLY</option>
              <option value="base">BASE PRODUCTS</option>
            </select>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',letterSpacing:'.08em'}}>
              {visibleInventoryRows.length} rows in this view
            </p>
          </div>
          <div style={{display:'grid',gap:'12px'}}>
            {visibleInventoryRows.slice(0, visibleInventoryCount).map(row => {
              const draft = inventoryDrafts[row.key] || {};
              const badge = row.stockStatus === 'out'
                ? { label:'OUT', color:'#FCA5A5', border:'rgba(248,113,113,.24)' }
                : row.stockStatus === 'low'
                  ? { label:'LOW', color:'#FBBF24', border:'rgba(251,191,36,.22)' }
                  : { label:'OK', color:'var(--mint)', border:'rgba(168,230,207,.18)' };
              return (
                <div key={row.key} style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.4fr .7fr .7fr .7fr auto',gap:'10px',alignItems:'center',padding:'12px',border:`1px solid ${badge.border}`,borderRadius:'10px',background:row.stockStatus==='out'?'rgba(248,113,113,.04)':(row.stockStatus==='low'?'rgba(251,191,36,.04)':'rgba(255,255,255,.02)')}}>
                  <div>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.84)'}}>{row.productName}</p>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',marginTop:'4px'}}>{row.variantLabel}</p>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:badge.color,marginTop:'6px',letterSpacing:'.08em'}}>{badge.label}</p>
                  </div>
                  <input
                    className="dark-field"
                    value={draft.stock_quantity ?? row.stock_quantity}
                    onChange={e=>handleInventoryChange(row.key, 'stock_quantity', e.target.value)}
                    placeholder="Stock"
                  />
                  <input
                    className="dark-field"
                    value={draft.low_stock_threshold ?? row.low_stock_threshold}
                    onChange={e=>handleInventoryChange(row.key, 'low_stock_threshold', e.target.value)}
                    placeholder="Low stock"
                  />
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.35)',lineHeight:'1.6'}}>
                    <div>SKU: {row.variant_id === 'base' ? 'BASE' : row.variant_id}</div>
                    <div>Threshold: {draft.low_stock_threshold ?? row.low_stock_threshold}</div>
                  </div>
                  <button className="btn-ghost-luxury" onClick={()=>handleInventorySave(row)} style={{justifyContent:'center',padding:'12px 18px'}} disabled={savingOrderId === row.key || savingOrderId === 'inventory-bulk'}>
                    {savingOrderId === row.key ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              );
            })}
            {visibleInventoryRows.length > visibleInventoryCount && (
              <button className="btn-ghost-luxury" onClick={()=>setVisibleInventoryCount(count => count + 40)} style={{justifyContent:'center'}}>
                LOAD MORE INVENTORY ROWS
              </button>
            )}
            {!visibleInventoryRows.length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>No inventory rows match this filter yet.</p>}
          </div>
        </div>
      </div>
    </div>

  );
}
