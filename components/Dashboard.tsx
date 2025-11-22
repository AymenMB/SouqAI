
import React, { useEffect, useState } from 'react';
import { ProductListing, User, Language, Organization } from '../types';
import { dbService } from '../services/dbService';
import { translations } from '../i18n';

interface DashboardProps {
  user: User;
  lang: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ user, lang }) => {
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newOrgName, setNewOrgName] = useState('');
  const [showOrgModal, setShowOrgModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [items, organizations] = await Promise.all([
      dbService.getUserProducts(user.id),
      dbService.getOrganizations(user.id)
    ]);
    setProducts(items);
    setOrgs(organizations);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(lang === 'ar' ? 'متأكد تحب تفسخ هذا؟' : 'Are you sure you want to delete this?')) {
      setDeletingId(id);
      const { error } = await dbService.deleteProduct(id);
      if (!error) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Error deleting product');
      }
      setDeletingId(null);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    const newOrg = await dbService.createOrganization(newOrgName, user.id);
    if (newOrg) {
      setOrgs(prev => [...prev, newOrg]);
      setNewOrgName('');
      setShowOrgModal(false);
    }
  };

  const totalViews = products.reduce((sum, item) => sum + (item.views || 0), 0);
  const totalValue = products.reduce((sum, item) => sum + Number(item.price), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in pb-12">
      {/* Welcome Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {lang === 'ar' ? `مرحباً, ${user.name}` : `Welcome back, ${user.name}`}
          </h1>
          <p className="text-slate-500 mt-1">
            {lang === 'ar' ? 'هذي الإحصائيات متاعك' : 'Overview of your shop performance.'}
          </p>
        </div>
        <button 
          onClick={() => setShowOrgModal(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          {lang === 'ar' ? '+ اصنع شركة' : '+ New Organization'}
        </button>
      </div>

      {/* Organizations List */}
      {orgs.length > 0 && (
        <div className="mb-8">
           <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">{lang === 'ar' ? 'شركاتك' : 'Your Organizations'}</h3>
           <div className="flex gap-4 overflow-x-auto pb-2">
             {orgs.map(org => (
               <div key={org.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm min-w-[200px]">
                 <img src={org.logoUrl} className="w-10 h-10 rounded-lg" alt="" />
                 <span className="font-bold text-slate-800">{org.name}</span>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">📦</div>
           <div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{lang === 'ar' ? 'المنتجات' : 'Products'}</p>
             <h3 className="text-2xl font-bold text-slate-900">{products.length}</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-2xl">👁️</div>
           <div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{lang === 'ar' ? 'المشاهدات' : 'Total Views'}</p>
             <h3 className="text-2xl font-bold text-slate-900">{totalViews}</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-2xl">💰</div>
           <div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{lang === 'ar' ? 'القيمة' : 'Value'}</p>
             <h3 className="text-2xl font-bold text-slate-900">{totalValue} <span className="text-sm font-normal text-slate-400">TND</span></h3>
           </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">{lang === 'ar' ? 'سلعتك' : 'Inventory'}</h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
             <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">∅</div>
             <p className="text-slate-500 font-medium">{lang === 'ar' ? 'ما عندك حتى شي للبيع' : 'No products listed yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th className="px-6 py-4">{lang === 'ar' ? 'الشركة' : 'Organization'}</th>
                  <th className="px-6 py-4">{lang === 'ar' ? 'السوم' : 'Price'}</th>
                  <th className="px-6 py-4 text-right">{lang === 'ar' ? 'تاريخ' : 'Date'}</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                        <div>
                          <p className="font-bold text-slate-900">{product.title}</p>
                          <p className="text-xs text-slate-400">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       {product.sellerName !== user.name ? (
                         <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">{product.sellerName}</span>
                       ) : (
                         <span className="text-xs text-slate-400">Personal</span>
                       )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{product.price} TND</td>
                    <td className="px-6 py-4 text-right text-sm text-slate-400">{new Date(product.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        {deletingId === product.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : "🗑️"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Org Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-bold mb-4">{lang === 'ar' ? 'اصنع شركة جديدة' : 'Create Organization'}</h3>
              <p className="text-sm text-slate-500 mb-4">{lang === 'ar' ? 'اسم الشركة (مثال: MyTek)' : 'Enter the name of your shop/company.'}</p>
              <form onSubmit={handleCreateOrg}>
                <input 
                  type="text" 
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Organization Name"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mb-4 outline-none focus:border-red-500"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowOrgModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium">Create</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
