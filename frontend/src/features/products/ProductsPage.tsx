import { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Tag,
  Archive,
  ChevronDown,
  ChevronRight,
  Sparkles,
  X,
  Edit2,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types';

export function ProductsPage() {
  const { products, createProduct, updateProduct, settings } = useSubscription();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({ 'prod-1': true });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Software',
    description: '',
    default_price: '99.00',
    variants: [
      { id: 'v1', sku: '', name: 'Standard Edition', price: '99.00', status: 'active' as const },
    ],
  });

  const categories = ['all', 'Software', 'Add-on', 'Support', 'Hardware'];

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreate = () => {
    const nextNum = (products.length + 1).toString().padStart(2, '0');
    setFormData({
      name: '',
      code: `PROD-NEW-${nextNum}`,
      category: 'Software',
      description: '',
      default_price: '99.00',
      variants: [
        { id: `var-${Date.now()}-1`, sku: `SKU-STD-${nextNum}`, name: 'Standard Edition', price: '99.00', status: 'active' },
        { id: `var-${Date.now()}-2`, sku: `SKU-PRO-${nextNum}`, name: 'Pro Edition', price: '199.00', status: 'active' },
      ],
    });
    setIsCreateOpen(true);
  };

  const handleAddVariantRow = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: `var-${Date.now()}`,
          sku: `${prev.code}-VAR-${prev.variants.length + 1}`,
          name: `Tier ${prev.variants.length + 1}`,
          price: '99.00',
          status: 'active',
        },
      ],
    }));
  };

  const handleRemoveVariantRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    createProduct({
      name: formData.name,
      code: formData.code,
      category: formData.category,
      description: formData.description,
      default_price: formData.default_price,
      status: 'active',
      variants: formData.variants,
    });
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            Product Catalogue & Variants
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Configure standalone products, tier variants, and base pricing structures.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="rounded-xl shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by code, name, or description..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="apple-segmented-container">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn('apple-segmented-item capitalize', categoryFilter === cat && 'active')}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="apple-card p-12 text-center text-text-secondary">
            <Layers className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-base font-semibold text-text-primary">No products found</p>
            <p className="text-xs text-text-tertiary mt-1">Adjust filters or create a new product offering.</p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const isExpanded = !!expandedProducts[prod.id];

            return (
              <div key={prod.id} className="apple-card overflow-hidden">
                {/* Main Product Header Bar */}
                <div
                  onClick={() => toggleExpand(prod.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <button className="p-1 rounded-md text-text-tertiary hover:text-text-primary">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold text-sm shrink-0">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-text-primary">{prod.name}</span>
                        <code className="text-xs font-mono px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border/60">
                          {prod.code}
                        </code>
                        <Badge variant="secondary" className="text-[11px] capitalize">
                          {prod.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 max-w-2xl line-clamp-1">
                        {prod.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs text-text-tertiary">Variants</span>
                      <p className="text-sm font-semibold text-text-primary">
                        {prod.variants?.length || 0} Tier(s)
                      </p>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-text-tertiary">Default Price</span>
                      <p className="text-sm font-bold text-text-primary">
                        {formatCurrency(prod.default_price, settings.currency_symbol)}
                      </p>
                    </div>

                    <Badge variant={prod.status === 'active' ? 'success' : 'outline'}>
                      {prod.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Variants Collapsible Table */}
                {isExpanded && prod.variants && prod.variants.length > 0 && (
                  <div className="border-t border-border/80 bg-surface-secondary/30 px-6 py-4">
                    <div className="flex items-center justify-between pb-2 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        Product Variants & SKU Hierarchy
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {prod.variants.map((v) => (
                        <div
                          key={v.id}
                          className="p-3.5 rounded-xl bg-surface border border-border/80 flex items-center justify-between shadow-xs"
                        >
                          <div>
                            <p className="text-sm font-semibold text-text-primary leading-tight">
                              {v.name}
                            </p>
                            <p className="text-xs font-mono text-text-tertiary mt-0.5">
                              SKU: {v.sku}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-accent">
                              {formatCurrency(v.price, settings.currency_symbol)}
                            </p>
                            <span className="text-[10px] text-text-tertiary uppercase font-medium">
                              Base Price
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Product */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-text-primary">Add Product Offering</h3>
            <p className="text-xs text-text-secondary mt-1">
              Define a new product item and configure its associated tier variants.
            </p>

            <form onSubmit={handleSubmitCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dedicated Compute Node"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Product Code / SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="PROD-NODE"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="Software">Software</option>
                    <option value="Add-on">Add-on</option>
                    <option value="Support">Support</option>
                    <option value="Hardware">Hardware</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Default Base Price</label>
                  <input
                    type="text"
                    value={formData.default_price}
                    onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                    placeholder="99.00"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of capability and audience..."
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Variants Section */}
              <div className="space-y-2 pt-2 border-t border-border/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                    Product Variants ({formData.variants.length})
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddVariantRow} className="rounded-xl text-xs h-7">
                    + Add Variant
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.variants.map((v, idx) => (
                    <div key={v.id} className="p-2.5 rounded-xl bg-surface-secondary/50 border border-border/60 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Variant Name"
                        value={v.name}
                        onChange={(e) => {
                          const updated = [...formData.variants];
                          updated[idx]!.name = e.target.value;
                          setFormData({ ...formData, variants: updated });
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-border text-xs bg-surface text-text-primary"
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        value={v.sku}
                        onChange={(e) => {
                          const updated = [...formData.variants];
                          updated[idx]!.sku = e.target.value;
                          setFormData({ ...formData, variants: updated });
                        }}
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-border text-xs font-mono bg-surface text-text-primary"
                      />
                      <input
                        type="text"
                        placeholder="Price"
                        value={v.price}
                        onChange={(e) => {
                          const updated = [...formData.variants];
                          updated[idx]!.price = e.target.value;
                          setFormData({ ...formData, variants: updated });
                        }}
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-border text-xs bg-surface text-text-primary"
                      />
                      {formData.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-error"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border/80">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-xl shadow-xs">
                  Save Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
