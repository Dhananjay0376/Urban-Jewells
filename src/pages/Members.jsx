import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Heart, Package, Settings, LogOut, MapPin } from 'lucide-react';
import { useAuthStore, useWishlistStore } from '../lib/store';
import { useLenis } from '../lib/hooks';
import ProductCard from '../components/ProductCard';

const Members = () => {
  const { user, token, logout, isAuthenticated } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useLenis();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchOrders();
  }, [user, token, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#FAFAF7] pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#A8E6CF] to-[#2D5016] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-semibold text-[#1A1A1A]">{user?.email}</h2>
              </div>

              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#A8E6CF]/30 text-[#2D5016]'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-2xl shadow-sm"
            >
              {activeTab === 'overview' && (
                <>
                  <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-6">
                    Welcome back!
                  </h1>
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div className="p-6 bg-[#A8E6CF]/10 rounded-xl">
                      <p className="text-3xl font-bold text-[#2D5016]">{orders.length}</p>
                      <p className="text-gray-600">Orders</p>
                    </div>
                    <div className="p-6 bg-[#A8E6CF]/10 rounded-xl">
                      <p className="text-3xl font-bold text-[#2D5016]">{wishlistItems.length}</p>
                      <p className="text-gray-600">Wishlist Items</p>
                    </div>
                    <div className="p-6 bg-[#A8E6CF]/10 rounded-xl">
                      <p className="text-3xl font-bold text-[#2D5016]">0</p>
                      <p className="text-gray-600">Saved Addresses</p>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'orders' && (
                <>
                  <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-6">
                    Order History
                  </h1>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No orders yet</p>
                      <Link to="/collections" className="text-[#2D5016] hover:underline mt-2 inline-block">
                        Start shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-[#1A1A1A]">Order #{order.id}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[#2D5016]">
                                R{parseFloat(order.total).toLocaleString()}
                              </p>
                              <span className={`text-sm px-2 py-1 rounded-full ${
                                order.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'wishlist' && (
                <>
                  <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-6">
                    My Wishlist
                  </h1>
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Your wishlist is empty</p>
                      <Link to="/collections" className="text-[#2D5016] hover:underline mt-2 inline-block">
                        Discover our collections
                      </Link>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlistItems.map((item, index) => (
                        <ProductCard key={item.id} product={item} index={index} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'addresses' && (
                <>
                  <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-6">
                    Saved Addresses
                  </h1>
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No saved addresses yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Add addresses during checkout for faster ordering
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'settings' && (
                <>
                  <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-6">
                    Account Settings
                  </h1>
                  <form className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      To change your email or password, please contact support.
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Members;
