import React, { useEffect, useState } from 'react';
import { Package, Plus, Layers, Tag, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/loading-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

export function CataloguePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Product Modal
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [productType, setProductType] = useState('software');
  const [salesPrice, setSalesPrice] = useState('2500.00');
  const [costPrice, setCostPrice] = useState('800.00');
  const [notes, setNotes] = useState('');

  // Add Variant Modal
  const [addVariantOpen, setAddVariantOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [variantName, setVariantName] = useState('Brand: Odoo Edition');
  const [variantSku, setVariantSku] = useState('VAR-BRAND-ODOO-NEW');
  const [priceModifier, setPriceModifier] = useState('560.00');

  const fetchCatalogue = () => {
    setLoading(true);
    api.get<any>('/catalogue/products/')
      .then((res) => {
        const results = res.results || res;
        setProducts(results);
      })
      .catch(() => {
        setProducts([
          {
            id: '1',
            name: 'Brightloop Core Business Software',
            sku: 'PROD-CORE-001',
            product_type: 'software',
            sales_price: '2500.00',
            cost_price: '800.00',
            tax_rate: '18.00',
            notes: 'Flagship multi-module cloud subscription suite',
            variants: [
              {
                id: 'v1',
                name: 'Brand: Odoo Edition',
                sku: 'VAR-BRAND-ODOO',
                price_modifier: '560.00',
                effective_price: '3060.00',
              },
            ],
          },
          {
            id: '2',
            name: 'High-Speed Cloud Storage (500GB)',
            sku: 'PROD-ADDON-STORAGE',
            product_type: 'addon',
            sales_price: '499.00',
            cost_price: '150.00',
            tax_rate: '18.00',
            notes: 'Customer on/off toggle storage add-on',
            variants: [],
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCatalogue();
  }, []);

  const handleCreateProduct = async () => {
    try {
      await api.post('/catalogue/products/', {
        name,
        sku: sku || `PROD-${Date.now().toString().slice(-4)}`,
        product_type: productType,
        sales_price: salesPrice,
        cost_price: costPrice,
        notes,
      });
      setAddProductOpen(false);
      fetchCatalogue();
    } catch {
      setAddProductOpen(false);
      fetchCatalogue();
    }
  };

  const handleCreateVariant = async () => {
    if (!selectedProduct) return;
    try {
      await api.post('/catalogue/variants/', {
        product: selectedProduct.id,
        name: variantName,
        sku: variantSku,
        price_modifier: priceModifier,
      });
      setAddVariantOpen(false);
      fetchCatalogue();
    } catch {
      setAddVariantOpen(false);
      fetchCatalogue();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Catalogue"
        description="Configure subscription products, cost pricing, taxes, and price-modifying variants like brand editions."
        actions={
          <Button onClick={() => setAddProductOpen(true)} className="gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        }
      />

      <div className="grid gap-6">
        {loading ? (
          <LoadingState rows={3} />
        ) : (
          products.map((prod) => (
            <Card key={prod.id} className="shadow-xs overflow-hidden">
              <CardHeader className="bg-surface-secondary/30 pb-4 border-b border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-text-primary">{prod.name}</h3>
                      <Badge variant="outline" className="text-xs uppercase font-medium">
                        {prod.product_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">SKU: {prod.sku}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Base Sales Price</p>
                      <p className="text-lg font-bold text-text-primary">
                        ₹{Number(prod.sales_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(prod);
                        setVariantName('Brand: Odoo Edition');
                        setVariantSku(`VAR-${prod.sku}-ODOO`);
                        setPriceModifier('560.00');
                        setAddVariantOpen(true);
                      }}
                      className="h-8 gap-1 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Variant
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {prod.notes && (
                  <p className="text-xs text-text-secondary leading-relaxed">{prod.notes}</p>
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
                    Available Variants & Price Modifiers
                  </h4>
                  {prod.variants && prod.variants.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {prod.variants.map((v: any) => (
                        <div
                          key={v.id}
                          className="p-3 rounded-lg border border-border bg-surface flex justify-between items-center text-xs"
                        >
                          <div>
                            <p className="font-medium text-text-primary">{v.name}</p>
                            <p className="text-text-tertiary text-[11px] mt-0.5">SKU: {v.sku}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-accent">
                              +{Number(v.price_modifier).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <p className="text-[10px] text-text-tertiary">
                              = ₹{Number(v.effective_price || (Number(prod.sales_price) + Number(v.price_modifier))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-tertiary italic">
                      No variants configured yet. Base product price applies.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Product Modal */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Catalogue Product</DialogTitle>
            <DialogDescription>
              Create a new product with default pricing and tax classifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Product Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Analytics Add-on" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">SKU / Code</label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="PROD-002" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Type</label>
                <select
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                >
                  <option value="software">Software Service</option>
                  <option value="addon">Add-on</option>
                  <option value="service">Professional Service</option>
                  <option value="physical">Physical Item</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Sales Price (₹)</label>
                <Input type="number" step="0.01" value={salesPrice} onChange={(e) => setSalesPrice(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Cost Price (₹)</label>
                <Input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Notes</label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Product description..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProductOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProduct} disabled={!name}>Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Variant Modal */}
      <Dialog open={addVariantOpen} onOpenChange={setAddVariantOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Product Variant</DialogTitle>
            <DialogDescription>
              Add a variant attribute to <b>{selectedProduct?.name}</b> with an optional price modifier.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Variant Name</label>
              <Input
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="e.g. Brand: Odoo Edition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Variant SKU</label>
                <Input
                  value={variantSku}
                  onChange={(e) => setVariantSku(e.target.value)}
                  placeholder="VAR-SKU-001"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Price Modifier (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceModifier}
                  onChange={(e) => setPriceModifier(e.target.value)}
                  placeholder="+560.00"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddVariantOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateVariant} disabled={!variantName}>Save Variant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
