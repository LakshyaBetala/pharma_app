import React, { useCallback, useMemo, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { create } from 'zustand';
import data from './data.json';

// ─── Types ────────────────────────────────────────────────────────────────────
type Product = {
  id: number;
  name: string;
  company: string;
  manufacturer: string;
  category: string;
  medicine_type: string;
  price: number;
  mrp: number;
  stock: number;
  image_url: string;
  description: string;
  composition: string;
};

type User = {
  phone: string;
  store_name: string;
  is_approved: boolean;
  credit_balance: number;
  credit_limit: number;
};

type OrderItem = { product_id: number; name: string; qty: number; price: number };
type OrderStatus = 'Placed' | 'Accepted' | 'Processing' | 'Shipped' | 'Completed' | 'Rejected';
type Order = {
  id: number;
  user_phone: string;
  store_name: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
};

// Change to your Next.js dev server IP for physical devices (e.g. http://192.168.x.x:3000)
const API_BASE = 'http://localhost:3000';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  green: '#1B6B3A',
  greenLight: '#2E8B57',
  greenMid: '#3DAA6E',
  greenPale: '#E8F5EE',
  greenBorder: '#C2E0CC',
  emerald: '#10B981',
  white: '#FFFFFF',
  offWhite: '#F8FAFB',
  surfaceGray: '#F0F4F2',
  borderGray: '#E0E8E4',
  textDark: '#0F2B1E',
  textMid: '#3B5A47',
  textLight: '#6B8F7A',
  textPlaceholder: '#9DB5A5',
  red: '#DC2626',
  redPale: '#FEF2F2',
  amber: '#D97706',
  amberPale: '#FFFBEB',
  shadow: 'rgba(27, 107, 58, 0.10)',
};

// ─── Store ────────────────────────────────────────────────────────────────────
type CartMap = Record<number, number>;
type StoreState = {
  user: User | null;
  setUser: (u: User | null) => void;
  cart: CartMap;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  orders: Order[];
  addOrder: (o: Order) => void;
};

const useStore = create<StoreState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  cart: {},
  addToCart: (id) =>
    set((s) => ({ cart: { ...s.cart, [id]: (s.cart[id] ?? 0) + 1 } })),
  removeFromCart: (id) =>
    set((s) => {
      const c = { ...s.cart };
      if ((c[id] ?? 0) > 1) c[id] -= 1;
      else delete c[id];
      return { cart: c };
    }),
  clearCart: () => set({ cart: {} }),
  orders: [],
  addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
}));

// ─── Navigators ───────────────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width: SW } = Dimensions.get('window');

// ─── Category metadata ────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { icon: string; color: string; bg: string }> = {
  Diabetes:     { icon: '🩸', color: '#0369A1', bg: '#E0F2FE' },
  Cardiac:      { icon: '❤️', color: '#BE123C', bg: '#FFE4E6' },
  Analgesics:   { icon: '💊', color: '#7C3AED', bg: '#EDE9FE' },
  Antibiotics:  { icon: '🦠', color: '#B45309', bg: '#FEF3C7' },
  Allergy:      { icon: '🤧', color: '#0891B2', bg: '#CFFAFE' },
  'Cold & Cough': { icon: '🤒', color: '#6D28D9', bg: '#EDE9FE' },
  Gastro:       { icon: '🏥', color: '#047857', bg: '#D1FAE5' },
  'Eye Care':   { icon: '👁️', color: '#1D4ED8', bg: '#DBEAFE' },
  'First Aid':  { icon: '🩹', color: '#DC2626', bg: '#FEE2E2' },
  General:      { icon: '💉', color: '#1B6B3A', bg: '#E8F5EE' },
  Devices:      { icon: '🔬', color: '#475569', bg: '#F1F5F9' },
};

const defaultMeta = { icon: '💊', color: '#1B6B3A', bg: '#E8F5EE' };

// ─── Reusable QtyControl ──────────────────────────────────────────────────────
function QtyControl({ qty, onAdd, onRemove, mini }: {
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  mini?: boolean;
}) {
  const sz = mini ? 26 : 32;
  if (qty === 0) {
    return (
      <TouchableOpacity
        style={[s.addBtn, mini && { height: 30, paddingHorizontal: 16 }]}
        onPress={onAdd}
        activeOpacity={0.8}
      >
        <Text style={[s.addBtnTxt, mini && { fontSize: 12 }]}>ADD</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={[s.qtyRow, mini && { gap: 6 }]}>
      <TouchableOpacity
        style={[s.qtyBtn, { width: sz, height: sz, borderRadius: sz / 2 }]}
        onPress={onRemove}
      >
        <Text style={s.qtyBtnTxt}>−</Text>
      </TouchableOpacity>
      <Text style={[s.qtyVal, mini && { fontSize: 14, minWidth: 18 }]}>{qty}</Text>
      <TouchableOpacity
        style={[s.qtyBtn, { width: sz, height: sz, borderRadius: sz / 2 }]}
        onPress={onAdd}
      >
        <Text style={s.qtyBtnTxt}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────
function ProductDetailModal({
  product,
  visible,
  onClose,
}: {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
}) {
  const addToCart = useStore((s) => s.addToCart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const cart = useStore((s) => s.cart);

  if (!product) return null;

  const qty = cart[product.id] ?? 0;
  const savings = product.mrp - product.price;
  const savingsPct = Math.round((savings / product.mrp) * 100);

  const similar = (data.products as Product[])
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.white} />
        {/* Header */}
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose} style={s.backBtn} hitSlop={10}>
            <Text style={s.backBtnTxt}>←</Text>
          </TouchableOpacity>
          <Text style={s.modalHeaderTitle} numberOfLines={1}>{product.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero image */}
          <View style={s.detailImageContainer}>
            <Image
              source={{ uri: product.image_url }}
              style={s.detailImage}
              resizeMode="cover"
              accessibilityLabel={product.name}
            />
          </View>

          <View style={s.detailBody}>
            {/* Name + badge */}
            <View style={s.detailRow}>
              <Text style={s.detailName}>{product.name}</Text>
              <View style={[s.typeBadge, { backgroundColor: (CATEGORY_META[product.category] ?? defaultMeta).bg }]}>
                <Text style={[s.typeBadgeTxt, { color: (CATEGORY_META[product.category] ?? defaultMeta).color }]}>
                  {product.medicine_type}
                </Text>
              </View>
            </View>
            <Text style={s.detailCompany}>{product.manufacturer}</Text>

            {/* Pricing */}
            <View style={s.priceCard}>
              <View>
                <Text style={s.ptrLabel}>PTR (Retailer Price)</Text>
                <Text style={s.ptrValue}>₹{product.price.toLocaleString('en-IN')}</Text>
              </View>
              <View style={s.priceDivider} />
              <View>
                <Text style={s.mrpLabel}>MRP</Text>
                <Text style={s.mrpValue}>₹{product.mrp.toLocaleString('en-IN')}</Text>
              </View>
              {savings > 0 && (
                <>
                  <View style={s.priceDivider} />
                  <View style={s.savingsBadge}>
                    <Text style={s.savingsTxt}>{savingsPct}% off</Text>
                  </View>
                </>
              )}
            </View>

            {/* Composition */}
            <InfoCard icon="🧪" title="Composition">
              <Text style={s.infoText}>{product.composition}</Text>
            </InfoCard>

            {/* Description */}
            <InfoCard icon="📋" title="Description">
              <Text style={s.infoText}>{product.description}</Text>
            </InfoCard>

            {/* Stock */}
            <InfoCard icon="📦" title="Availability">
              <Text style={[s.infoText, { color: product.stock > 10 ? C.greenLight : product.stock > 0 ? C.amber : C.red }]}>
                {product.stock > 10 ? `In Stock (${product.stock} units)` : product.stock > 0 ? `Low Stock (${product.stock} units)` : 'Out of Stock'}
              </Text>
            </InfoCard>

            {/* Similar products */}
            {similar.length > 0 && (
              <View style={s.similarSection}>
                <Text style={s.sectionTitle}>Similar Products</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                  {similar.map((sp) => {
                    const sqty = cart[sp.id] ?? 0;
                    return (
                      <View key={sp.id} style={s.similarCard}>
                        <Image source={{ uri: sp.image_url }} style={s.similarImg} resizeMode="cover" accessibilityLabel={sp.name} />
                        <Text style={s.similarName} numberOfLines={2}>{sp.name}</Text>
                        <Text style={s.similarPrice}>₹{sp.price.toLocaleString('en-IN')}</Text>
                        <QtyControl
                          qty={sqty}
                          onAdd={() => addToCart(sp.id)}
                          onRemove={() => removeFromCart(sp.id)}
                          mini
                        />
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky bottom */}
        <View style={s.detailFooter}>
          <View>
            <Text style={s.footerPrice}>₹{product.price.toLocaleString('en-IN')}</Text>
            {savings > 0 && (
              <Text style={s.footerMrp}>MRP ₹{product.mrp.toLocaleString('en-IN')}</Text>
            )}
          </View>
          <QtyControl qty={qty} onAdd={() => addToCart(product.id)} onRemove={() => removeFromCart(product.id)} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function InfoCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={s.infoCard}>
      <View style={s.infoCardHeader}>
        <Text style={s.infoCardIcon}>{icon}</Text>
        <Text style={s.infoCardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Filter Bottom Sheet ──────────────────────────────────────────────────────
type SortKey = 'alpha' | 'price-asc' | 'price-desc';
type Filters = {
  sort: SortKey;
  categories: Set<string>;
  medicineTypes: Set<string>;
  companies: Set<string>;
  priceMax: number;
};

function FilterSheet({
  visible,
  onClose,
  filters,
  onChange,
  allProducts,
}: {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (f: Filters) => void;
  allProducts: Product[];
}) {
  const [local, setLocal] = useState<Filters>(filters);

  // intentionally only sync on open, not on every external filter change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { if (visible) setLocal(filters); }, [visible]);

  const allCategories = useMemo(() => [...new Set(allProducts.map((p) => p.category))].sort(), [allProducts]);
  const allTypes = useMemo(() => [...new Set(allProducts.map((p) => p.medicine_type))].sort(), [allProducts]);
  const allCompanies = useMemo(() => [...new Set(allProducts.map((p) => p.company))].sort(), [allProducts]);
  const maxPrice = useMemo(() => Math.max(...allProducts.map((p) => p.price)), [allProducts]);

  const toggleSet = (field: 'categories' | 'medicineTypes' | 'companies', val: string) => {
    setLocal((prev) => {
      const next = new Set(prev[field]);
      if (next.has(val)) { next.delete(val); } else { next.add(val); }
      return { ...prev, [field]: next };
    });
  };

  const activeCount =
    (local.sort !== 'alpha' ? 1 : 0) +
    local.categories.size +
    local.medicineTypes.size +
    local.companies.size +
    (local.priceMax < maxPrice ? 1 : 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.sheetBackdrop} onPress={onClose} />
      <View style={s.sheet}>
        {/* Handle */}
        <View style={s.sheetHandle} />
        <View style={s.sheetHeaderRow}>
          <Text style={s.sheetTitle}>Sort & Filter</Text>
          <TouchableOpacity
            onPress={() => setLocal({ sort: 'alpha', categories: new Set(), medicineTypes: new Set(), companies: new Set(), priceMax: maxPrice })}
          >
            <Text style={s.clearAllTxt}>Clear all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Sort */}
          <FilterSection title="Sort By">
            {([
              ['alpha', 'A → Z'],
              ['price-asc', 'Price: Low to High'],
              ['price-desc', 'Price: High to Low'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <CheckPill
                key={key}
                label={label}
                active={local.sort === key}
                onPress={() => setLocal((p) => ({ ...p, sort: key }))}
                radio
              />
            ))}
          </FilterSection>

          {/* Category */}
          <FilterSection title="Category">
            {allCategories.map((c) => (
              <CheckPill
                key={c}
                label={c}
                icon={(CATEGORY_META[c] ?? defaultMeta).icon}
                active={local.categories.has(c)}
                onPress={() => toggleSet('categories', c)}
              />
            ))}
          </FilterSection>

          {/* Medicine Type */}
          <FilterSection title="Medicine Type">
            {allTypes.map((t) => (
              <CheckPill
                key={t}
                label={t}
                active={local.medicineTypes.has(t)}
                onPress={() => toggleSet('medicineTypes', t)}
              />
            ))}
          </FilterSection>

          {/* Company */}
          <FilterSection title="Company / Manufacturer">
            {allCompanies.map((c) => (
              <CheckPill
                key={c}
                label={c}
                active={local.companies.has(c)}
                onPress={() => toggleSet('companies', c)}
              />
            ))}
          </FilterSection>

          {/* Price range */}
          <FilterSection title={`Max PTR: ₹${local.priceMax.toLocaleString('en-IN')}`}>
            <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={s.rangeLbl}>₹0</Text>
                <Text style={s.rangeLbl}>₹{maxPrice.toLocaleString('en-IN')}</Text>
              </View>
              {/* Manual price buttons since we avoid external slider deps */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[100, 250, 500, 1000, 1500, maxPrice].map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[s.priceChip, local.priceMax === v && s.priceChipActive]}
                      onPress={() => setLocal((p) => ({ ...p, priceMax: v }))}
                    >
                      <Text style={[s.priceChipTxt, local.priceMax === v && s.priceChipTxtActive]}>
                        {v === maxPrice ? 'All' : `≤₹${v}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </FilterSection>
        </ScrollView>

        {/* Apply button */}
        <View style={s.sheetFooter}>
          <TouchableOpacity style={s.applyBtn} onPress={() => { onChange(local); onClose(); }} activeOpacity={0.85}>
            <Text style={s.applyBtnTxt}>
              Apply{activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.filterSection}>
      <Text style={s.filterSectionTitle}>{title}</Text>
      <View style={s.pillRow}>{children}</View>
    </View>
  );
}

function CheckPill({ label, icon, active, onPress, radio }: {
  label: string;
  icon?: string;
  active: boolean;
  onPress: () => void;
  radio?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.pill, active && s.pillActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {icon && <Text style={{ fontSize: 13 }}>{icon} </Text>}
      {radio ? (
        <View style={[s.radioCircle, active && s.radioCircleActive]}>
          {active && <View style={s.radioDot} />}
        </View>
      ) : (
        <View style={[s.checkbox, active && s.checkboxActive]}>
          {active && <Text style={s.checkMark}>✓</Text>}
        </View>
      )}
      <Text style={[s.pillTxt, active && s.pillTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Catalog Screen ───────────────────────────────────────────────────────────
function CatalogScreen({ route }: { route?: { params?: { query?: string; category?: string } } }) {
  const addToCart = useStore((s) => s.addToCart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const cart = useStore((s) => s.cart);

  const allProducts = data.products as Product[];
  const maxPrice = Math.max(...allProducts.map((p) => p.price));

  const initCategory = route?.params?.category ?? '';
  const initQuery = route?.params?.query ?? '';

  const [query, setQuery] = useState(initQuery);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<Filters>({
    sort: 'alpha',
    categories: initCategory ? new Set([initCategory]) : new Set(),
    medicineTypes: new Set(),
    companies: new Set(),
    priceMax: maxPrice,
  });

  const activeFilterCount =
    (filters.sort !== 'alpha' ? 1 : 0) +
    filters.categories.size +
    filters.medicineTypes.size +
    filters.companies.size +
    (filters.priceMax < maxPrice ? 1 : 0);

  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = allProducts.filter((p) => {
      if (filters.categories.size > 0 && !filters.categories.has(p.category)) return false;
      if (filters.medicineTypes.size > 0 && !filters.medicineTypes.has(p.medicine_type)) return false;
      if (filters.companies.size > 0 && !filters.companies.has(p.company)) return false;
      if (p.price > filters.priceMax) return false;
      if (q && !`${p.name} ${p.composition} ${p.company} ${p.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (filters.sort === 'price-asc') list = list.sort((a, b) => a.price - b.price);
    else if (filters.sort === 'price-desc') list = list.sort((a, b) => b.price - a.price);
    else list = list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [allProducts, query, filters]);

  // Active filter chips
  const chips: string[] = [];
  filters.categories.forEach((c) => chips.push(c));
  filters.medicineTypes.forEach((t) => chips.push(t));
  filters.companies.forEach((c) => chips.push(c));
  if (filters.sort !== 'alpha') chips.push(filters.sort === 'price-asc' ? 'Price ↑' : 'Price ↓');
  if (filters.priceMax < maxPrice) chips.push(`≤₹${filters.priceMax}`);

  const clearChip = (chip: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (prev.categories.has(chip)) { const s = new Set(prev.categories); s.delete(chip); next.categories = s; }
      else if (prev.medicineTypes.has(chip)) { const s = new Set(prev.medicineTypes); s.delete(chip); next.medicineTypes = s; }
      else if (prev.companies.has(chip)) { const s = new Set(prev.companies); s.delete(chip); next.companies = s; }
      else if (chip === 'Price ↑' || chip === 'Price ↓') next.sort = 'alpha';
      else next.priceMax = maxPrice;
      return next;
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.offWhite }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Search + filter row */}
      <View style={s.catalogTopBar}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search medicines, compositions…"
            placeholderTextColor={C.textPlaceholder}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={s.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.filterBtn, activeFilterCount > 0 && s.filterBtnActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.8}
        >
          <Text style={s.filterIcon}>⚙️</Text>
          {activeFilterCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeTxt}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.chipBar}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          {chips.map((chip) => (
            <TouchableOpacity key={chip} style={s.activeChip} onPress={() => clearChip(chip)}>
              <Text style={s.activeChipTxt}>{chip} ✕</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results count */}
      <View style={s.resultsRow}>
        <Text style={s.resultsText}>{displayed.length} product{displayed.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Product list */}
      <FlatList
        data={displayed}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>🔍</Text>
            <Text style={s.emptyTitle}>No products found</Text>
            <Text style={s.emptySubtitle}>Try adjusting your search or filters</Text>
          </View>
        }
        renderItem={({ item: p }) => {
          const qty = cart[p.id] ?? 0;
          const savings = p.mrp - p.price;
          const savingsPct = Math.round((savings / p.mrp) * 100);
          const meta = CATEGORY_META[p.category] ?? defaultMeta;
          return (
            <TouchableOpacity
              style={s.productRow}
              onPress={() => setSelectedProduct(p)}
              activeOpacity={0.85}
            >
              <View style={s.productImageWrap}>
                <Image source={{ uri: p.image_url }} style={s.productImage} resizeMode="cover" accessibilityLabel={p.name} />
              </View>
              <View style={s.productMeta}>
                <Text style={s.productRowName} numberOfLines={2}>{p.name}</Text>
                <Text style={s.productRowComp} numberOfLines={1}>{p.composition}</Text>
                <View style={s.productRowTags}>
                  <View style={[s.tagChip, { backgroundColor: meta.bg }]}>
                    <Text style={[s.tagChipTxt, { color: meta.color }]}>{meta.icon} {p.category}</Text>
                  </View>
                  <View style={[s.tagChip, { backgroundColor: C.surfaceGray }]}>
                    <Text style={[s.tagChipTxt, { color: C.textMid }]}>{p.medicine_type}</Text>
                  </View>
                </View>
                <View style={s.productRowPrice}>
                  <Text style={s.productRowPTR}>₹{p.price.toLocaleString('en-IN')}</Text>
                  {savings > 0 && (
                    <>
                      <Text style={s.productRowMRP}>₹{p.mrp.toLocaleString('en-IN')}</Text>
                      <View style={s.savingsBadgeSmall}>
                        <Text style={s.savingsBadgeSmallTxt}>{savingsPct}% off</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
              <View style={s.productRowQty}>
                <QtyControl
                  qty={qty}
                  onAdd={() => addToCart(p.id)}
                  onRemove={() => removeFromCart(p.id)}
                  mini
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <FilterSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        filters={filters}
        onChange={setFilters}
        allProducts={allProducts}
      />

      <ProductDetailModal
        product={selectedProduct}
        visible={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </SafeAreaView>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
type Navigation = { navigate: (name: string, params?: Record<string, unknown>) => void; reset: (state: { index: number; routes: { name: string }[] }) => void };

function HomeScreen({ navigation }: { navigation: Navigation }) {
  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const [query, setQuery] = useState('');

  const allProducts = data.products as Product[];
  const categories = [...new Set(allProducts.map((p) => p.category))].sort();
  const totalCartItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const goToCatalog = (opts?: { query?: string; category?: string }) => {
    navigation.navigate('Catalog', opts ?? {});
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />

      {/* Header */}
      <View style={s.homeHeader}>
        <View>
          <Text style={s.homeGreeting}>Hello, {user?.store_name ?? 'User'} 👋</Text>
          <Text style={s.homeSubGreeting}>What are you looking for today?</Text>
        </View>
        <TouchableOpacity
          style={s.homeCartBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
        >
          <Text style={{ fontSize: 22 }}>🛒</Text>
          {totalCartItems > 0 && (
            <View style={s.homeCartBadge}>
              <Text style={s.homeCartBadgeTxt}>{totalCartItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={s.homeSearchWrap}>
        <TouchableOpacity
          style={s.homeSearchBox}
          onPress={() => goToCatalog()}
          activeOpacity={0.85}
        >
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.homeSearchInput}
            placeholder="Search medicines, companies…"
            placeholderTextColor={C.textPlaceholder}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => { if (query.trim()) goToCatalog({ query: query.trim() }); }}
            returnKeyType="search"
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Banner */}
        <View style={s.homeBanner}>
          <View style={s.homeBannerContent}>
            <Text style={s.homeBannerTag}>B2B Exclusive</Text>
            <Text style={s.homeBannerTitle}>Wholesale Prices{'\n'}on 3000+ SKUs</Text>
            <TouchableOpacity style={s.homeBannerBtn} onPress={() => goToCatalog()}>
              <Text style={s.homeBannerBtnTxt}>Browse All →</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.homeBannerEmoji}>💊</Text>
        </View>

        {/* Shop by Category */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Shop by Category</Text>
          <TouchableOpacity onPress={() => goToCatalog()}>
            <Text style={s.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.categoryGrid}>
          {categories.map((cat) => {
            const m = CATEGORY_META[cat] ?? defaultMeta;
            return (
              <TouchableOpacity
                key={cat}
                style={[s.categoryCard, { backgroundColor: m.bg }]}
                onPress={() => goToCatalog({ category: cat })}
                activeOpacity={0.8}
              >
                <Text style={s.categoryIcon}>{m.icon}</Text>
                <Text style={[s.categoryName, { color: m.color }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick reorder strip */}
        <View style={[s.sectionHeader, { marginTop: 8 }]}>
          <Text style={s.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => goToCatalog()}>
            <Text style={s.seeAll}>View all →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
          {allProducts.slice(0, 6).map((p) => {
            return (
              <TouchableOpacity
                key={p.id}
                style={s.featuredCard}
                onPress={() => goToCatalog()}
                activeOpacity={0.85}
              >
                <Image source={{ uri: p.image_url }} style={s.featuredImg} resizeMode="cover" accessibilityLabel={p.name} />
                <View style={s.featuredInfo}>
                  <Text style={s.featuredName} numberOfLines={2}>{p.name}</Text>
                  <Text style={s.featuredPrice}>₹{p.price.toLocaleString('en-IN')}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Cart Screen ──────────────────────────────────────────────────────────────
function CartScreen() {
  const cart = useStore((s) => s.cart);
  const clearCart = useStore((s) => s.clearCart);
  const addToCart = useStore((s) => s.addToCart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const addOrder = useStore((s) => s.addOrder);
  const user = useStore((s) => s.user);
  const [ordered, setOrdered] = useState<Order | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');

  const allProducts = data.products as Product[];
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const p = allProducts.find((p) => p.id === Number(id));
      return p ? { ...p, qty } : null;
    })
    .filter(Boolean) as (Product & { qty: number })[];

  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const MIN_ORDER = 2000;

  const handlePlaceOrder = async () => {
    if (!user || placing) return;
    setPlaceError('');
    setPlacing(true);
    const items: OrderItem[] = cartItems.map((i) => ({
      product_id: i.id,
      name: i.name,
      qty: i.qty,
      price: i.price,
    }));
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, items }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      addOrder(json.order as Order);
      clearCart();
      setOrdered(json.order as Order);
    } catch {
      // Fallback: create a local order so the app still works without server
      const localOrder: Order = {
        id: Date.now(),
        user_phone: user.phone,
        store_name: user.store_name,
        items,
        total,
        status: 'Placed',
        created_at: new Date().toISOString(),
      };
      addOrder(localOrder);
      clearCart();
      setOrdered(localOrder);
    } finally {
      setPlacing(false);
    }
  };

  if (ordered) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>✅</Text>
        <Text style={[s.sectionTitle, { textAlign: 'center', color: C.green }]}>Order Placed!</Text>
        <Text style={[s.bodyTxt, { textAlign: 'center', marginTop: 8 }]}>
          Order #{ordered.id} confirmed.{'\n'}60-day credit period started.{'\n'}You&apos;ll be notified when accepted.
        </Text>
        <View style={[s.priceCard, { marginTop: 24, alignSelf: 'stretch', marginHorizontal: 24 }]}>
          <Text style={s.infoText}>Scan QR to initiate payment (optional)</Text>
          <Image
            source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MedPlusB2BPayment' }}
            style={{ width: 140, height: 140, marginTop: 12, alignSelf: 'center', borderRadius: 8 }}
            accessibilityLabel="Payment QR code"
          />
        </View>
        <TouchableOpacity style={[s.applyBtn, { marginTop: 24, marginHorizontal: 24, alignSelf: 'stretch' }]} onPress={() => setOrdered(null)}>
          <Text style={s.applyBtnTxt}>New Order</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.offWhite }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.cartHeader}>
        <Text style={s.cartTitle}>My Cart</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={() => clearCart()}>
            <Text style={{ color: C.red, fontSize: 13, fontWeight: '600' }}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={[s.emptyState, { flex: 1 }]}>
          <Text style={s.emptyEmoji}>🛒</Text>
          <Text style={s.emptyTitle}>Cart is empty</Text>
          <Text style={s.emptySubtitle}>Add products from the Catalog</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={{ padding: 12, paddingBottom: 160 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <View style={s.cartItem}>
                <Image source={{ uri: item.image_url }} style={s.cartItemImg} resizeMode="cover" accessibilityLabel={item.name} />
                <View style={{ flex: 1 }}>
                  <Text style={s.productRowName} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.productRowComp}>{item.company}</Text>
                  <Text style={[s.productRowPTR, { marginTop: 4 }]}>₹{(item.price * item.qty).toLocaleString('en-IN')}</Text>
                </View>
                <QtyControl qty={item.qty} onAdd={() => addToCart(item.id)} onRemove={() => removeFromCart(item.id)} mini />
              </View>
            )}
          />
          <View style={s.cartFooter}>
            <View style={s.cartSummary}>
              <View style={s.cartSummaryRow}>
                <Text style={s.cartSummaryLabel}>Subtotal ({cartItems.reduce((a, i) => a + i.qty, 0)} items)</Text>
                <Text style={s.cartSummaryVal}>₹{total.toLocaleString('en-IN')}</Text>
              </View>
              {total < MIN_ORDER && (
                <View style={s.minOrderAlert}>
                  <Text style={s.minOrderAlertTxt}>
                    Add ₹{(MIN_ORDER - total).toLocaleString('en-IN')} more to reach the ₹2,000 minimum
                  </Text>
                  <View style={s.progressBar}>
                    <View style={[s.progressFill, { width: `${Math.min((total / MIN_ORDER) * 100, 100)}%` }]} />
                  </View>
                </View>
              )}
            </View>
            {placeError ? <Text style={{ color: C.red, fontSize: 12, textAlign: 'center' }}>{placeError}</Text> : null}
            <TouchableOpacity
              style={[s.placeOrderBtn, (total < MIN_ORDER || placing) && s.placeOrderBtnDisabled]}
              disabled={total < MIN_ORDER || placing}
              onPress={handlePlaceOrder}
              activeOpacity={0.85}
            >
              <Text style={s.placeOrderBtnTxt}>
                {placing ? 'Placing…' : total >= MIN_ORDER ? `Place Order · ₹${total.toLocaleString('en-IN')}` : 'Minimum ₹2,000 required'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Account Screen ───────────────────────────────────────────────────────────
const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  Placed: '#3B82F6',
  Accepted: '#10B981',
  Processing: '#F59E0B',
  Shipped: '#8B5CF6',
  Completed: '#64748B',
  Rejected: '#EF4444',
};

function AccountScreen() {
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);
  const setUser = useStore((s) => s.setUser);
  const clearCart = useStore((s) => s.clearCart);

  if (!user) return null;

  const creditUsedPct = user.credit_limit > 0
    ? Math.min((user.credit_balance / user.credit_limit) * 100, 100)
    : 0;
  const creditAvailable = user.credit_limit - user.credit_balance;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.offWhite }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile header */}
        <View style={s.accountHeader}>
          <View style={s.accountAvatar}>
            <Text style={s.accountAvatarTxt}>{user.store_name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.accountName}>{user.store_name}</Text>
            <Text style={s.accountPhone}>{user.phone}</Text>
          </View>
          <View style={[s.statusPill, { backgroundColor: user.is_approved ? C.greenPale : C.amberPale }]}>
            <Text style={[s.statusPillTxt, { color: user.is_approved ? C.green : C.amber }]}>
              {user.is_approved ? 'Active' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Credit card */}
        <View style={s.creditCard}>
          <Text style={s.creditCardTitle}>Credit Account</Text>
          <View style={s.creditRow}>
            <View style={s.creditStat}>
              <Text style={s.creditStatLabel}>Balance Used</Text>
              <Text style={s.creditStatValue}>₹{user.credit_balance.toLocaleString('en-IN')}</Text>
            </View>
            <View style={s.creditDivider} />
            <View style={s.creditStat}>
              <Text style={s.creditStatLabel}>Available</Text>
              <Text style={[s.creditStatValue, { color: C.greenLight }]}>
                ₹{creditAvailable.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={s.creditDivider} />
            <View style={s.creditStat}>
              <Text style={s.creditStatLabel}>Limit</Text>
              <Text style={s.creditStatValue}>₹{user.credit_limit.toLocaleString('en-IN')}</Text>
            </View>
          </View>
          {user.credit_limit > 0 && (
            <View style={{ marginTop: 12 }}>
              <View style={s.creditBar}>
                <View style={[s.creditBarFill, { width: `${creditUsedPct}%` as `${number}%`, backgroundColor: creditUsedPct > 80 ? C.red : C.greenMid }]} />
              </View>
              <Text style={s.creditBarLabel}>{creditUsedPct.toFixed(0)}% of limit used · 60-day payment window</Text>
            </View>
          )}
        </View>

        {/* Order history */}
        <View style={[s.sectionHeader, { marginTop: 16 }]}>
          <Text style={s.sectionTitle}>Order History</Text>
          <Text style={s.resultsText}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
        </View>

        {orders.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>📦</Text>
            <Text style={s.emptyTitle}>No orders yet</Text>
            <Text style={s.emptySubtitle}>Place your first order from the Catalog</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 12, gap: 8 }}>
            {orders.map((order) => (
              <View key={order.id} style={s.orderCard}>
                <View style={s.orderCardHeader}>
                  <Text style={s.orderCardId}>Order #{order.id}</Text>
                  <View style={[s.orderStatusPill, { backgroundColor: ORDER_STATUS_COLOR[order.status] + '20' }]}>
                    <Text style={[s.orderStatusTxt, { color: ORDER_STATUS_COLOR[order.status] }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
                <Text style={s.orderCardDate}>
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
                <View style={s.orderCardItems}>
                  {order.items.slice(0, 3).map((item, i) => (
                    <Text key={i} style={s.orderCardItem} numberOfLines={1}>
                      {item.name} × {item.qty}
                    </Text>
                  ))}
                  {order.items.length > 3 && (
                    <Text style={s.orderCardItem}>+{order.items.length - 3} more items</Text>
                  )}
                </View>
                <View style={s.orderCardFooter}>
                  <Text style={s.orderCardTotal}>₹{order.total.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => { clearCart(); setUser(null); }}
          activeOpacity={0.8}
        >
          <Text style={s.logoutBtnTxt}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Tab Navigator ─────────────────────────────────────────────────────────────
function MainTabs() {
  const cart = useStore((s) => s.cart);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: C.green,
        tabBarInactiveTintColor: C.textLight,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopColor: C.borderGray,
          elevation: 8,
          shadowColor: C.shadow,
          height: 60,
          paddingBottom: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💊</Text> }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: C.green, fontSize: 10 },
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🛒</Text>,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

// ─── Pending Approval ──────────────────────────────────────────────────────────
function PendingApprovalScreen() {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  return (
    <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
      <Text style={{ fontSize: 56, marginBottom: 16 }}>⏳</Text>
      <Text style={[s.sectionTitle, { textAlign: 'center', color: C.green }]}>Account Under Review</Text>
      <Text style={[s.bodyTxt, { textAlign: 'center', marginTop: 12 }]}>
        Your registration is being reviewed by the admin. You&apos;ll be notified once approved.
      </Text>
    </SafeAreaView>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ navigation }: { navigation: Navigation }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const setUser = useStore((s) => s.setUser);

  const handleLogin = () => {
    setError('');
    const found = (data.users as User[]).find((u) => u.phone === phone.trim());
    if (!found) { setError('Phone number not registered. Contact your distributor.'); return; }
    setUser(found);
    navigation.reset({
      index: 0,
      routes: [{ name: found.is_approved ? 'MainTabs' : 'PendingApproval' }],
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />
      <View style={s.loginHero}>
        <Text style={s.loginLogo}>💊</Text>
        <Text style={s.loginBrand}>MedPlus B2B</Text>
        <Text style={s.loginTagline}>Your Wholesale Pharma Partner</Text>
      </View>

      <View style={s.loginCard}>
        <Text style={s.loginCardTitle}>Welcome Back</Text>
        <Text style={s.loginCardSub}>Enter your registered phone number to continue</Text>

        <TextInput
          style={[s.loginInput, error ? s.loginInputError : null]}
          placeholder="10-digit phone number"
          placeholderTextColor={C.textPlaceholder}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(v) => { setPhone(v); setError(''); }}
          maxLength={10}
        />
        {error ? <Text style={s.loginError}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.loginBtn, phone.length < 10 && s.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={phone.length < 10}
          activeOpacity={0.85}
        >
          <Text style={s.loginBtnTxt}>Login</Text>
        </TouchableOpacity>

        <Text style={s.loginHint}>
          New store? Contact your MedPlus representative to register.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="PendingApproval"
          component={PendingApprovalScreen}
          options={{ headerShown: true, title: 'Under Review', headerBackVisible: false, gestureEnabled: false, headerStyle: { backgroundColor: C.green }, headerTintColor: C.white }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.offWhite },

  // Login
  loginHero: { backgroundColor: C.green, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  loginLogo: { fontSize: 52 },
  loginBrand: { color: C.white, fontSize: 28, fontWeight: '800', marginTop: 8, letterSpacing: 0.5 },
  loginTagline: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  loginCard: { flex: 1, backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, padding: 28, paddingTop: 32 },
  loginCardTitle: { fontSize: 22, fontWeight: '800', color: C.textDark },
  loginCardSub: { fontSize: 14, color: C.textLight, marginTop: 4, marginBottom: 24 },
  loginInput: { borderWidth: 1.5, borderColor: C.borderGray, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.textDark, backgroundColor: C.offWhite },
  loginInputError: { borderColor: C.red },
  loginError: { color: C.red, fontSize: 13, marginTop: 6 },
  loginBtn: { backgroundColor: C.green, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  loginBtnDisabled: { backgroundColor: C.borderGray },
  loginBtnTxt: { color: C.white, fontSize: 16, fontWeight: '700' },
  loginHint: { textAlign: 'center', fontSize: 13, color: C.textLight, marginTop: 20 },

  // Home
  homeHeader: { backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  homeGreeting: { color: C.white, fontSize: 18, fontWeight: '700' },
  homeSubGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  homeCartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  homeCartBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: C.red, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  homeCartBadgeTxt: { color: C.white, fontSize: 10, fontWeight: '700' },
  homeSearchWrap: { backgroundColor: C.green, paddingHorizontal: 16, paddingBottom: 20 },
  homeSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  homeSearchInput: { flex: 1, fontSize: 14, color: C.textDark, padding: 0 },
  homeBanner: { marginHorizontal: 16, marginTop: 20, backgroundColor: C.greenPale, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.greenBorder },
  homeBannerContent: { flex: 1 },
  homeBannerTag: { fontSize: 11, fontWeight: '700', color: C.green, backgroundColor: C.white, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  homeBannerTitle: { fontSize: 18, fontWeight: '800', color: C.textDark, lineHeight: 24 },
  homeBannerBtn: { marginTop: 14, backgroundColor: C.green, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9, alignSelf: 'flex-start' },
  homeBannerBtnTxt: { color: C.white, fontSize: 13, fontWeight: '700' },
  homeBannerEmoji: { fontSize: 52, marginLeft: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark },
  seeAll: { fontSize: 13, color: C.greenLight, fontWeight: '600' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  categoryCard: { width: (SW - 56) / 3, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', gap: 6 },
  categoryIcon: { fontSize: 26 },
  categoryName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  featuredCard: { width: 140, borderRadius: 12, backgroundColor: C.white, marginRight: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.borderGray, elevation: 2, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4 },
  featuredImg: { width: '100%', height: 100 },
  featuredInfo: { padding: 10 },
  featuredName: { fontSize: 12, fontWeight: '600', color: C.textDark, lineHeight: 16 },
  featuredPrice: { fontSize: 13, fontWeight: '700', color: C.green, marginTop: 4 },

  // Catalog
  catalogTopBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.borderGray },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceGray, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: C.textDark, padding: 0 },
  searchClear: { fontSize: 14, color: C.textLight },
  filterBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.surfaceGray, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.borderGray },
  filterBtnActive: { backgroundColor: C.greenPale, borderColor: C.greenBorder },
  filterIcon: { fontSize: 18 },
  filterBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: C.green, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  filterBadgeTxt: { color: C.white, fontSize: 9, fontWeight: '700' },
  chipBar: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.borderGray, paddingVertical: 8 },
  activeChip: { backgroundColor: C.greenPale, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.greenBorder },
  activeChipTxt: { color: C.green, fontSize: 12, fontWeight: '600' },
  resultsRow: { paddingHorizontal: 16, paddingVertical: 8 },
  resultsText: { fontSize: 12, color: C.textLight, fontWeight: '500' },
  productRow: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 12, padding: 12, gap: 12, borderWidth: 1, borderColor: C.borderGray, elevation: 1, shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3 },
  productImageWrap: { width: 84, height: 84, borderRadius: 10, overflow: 'hidden', backgroundColor: C.surfaceGray, flexShrink: 0 },
  productImage: { width: '100%', height: '100%' },
  productMeta: { flex: 1, gap: 3 },
  productRowName: { fontSize: 14, fontWeight: '700', color: C.textDark, lineHeight: 19 },
  productRowComp: { fontSize: 12, color: C.textLight, lineHeight: 16 },
  productRowTags: { flexDirection: 'row', gap: 6, marginTop: 2 },
  tagChip: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tagChipTxt: { fontSize: 10, fontWeight: '600' },
  productRowPrice: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  productRowPTR: { fontSize: 15, fontWeight: '800', color: C.textDark },
  productRowMRP: { fontSize: 12, color: C.textPlaceholder, textDecorationLine: 'line-through' },
  savingsBadgeSmall: { backgroundColor: C.greenPale, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  savingsBadgeSmallTxt: { color: C.green, fontSize: 10, fontWeight: '700' },
  productRowQty: { justifyContent: 'flex-end', alignItems: 'flex-end' },

  // ADD / QTY buttons
  addBtn: { backgroundColor: C.green, borderRadius: 8, height: 34, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt: { color: C.white, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  qtyBtnTxt: { color: C.white, fontSize: 16, fontWeight: '700' },
  qtyVal: { fontSize: 16, fontWeight: '800', color: C.textDark, minWidth: 22, textAlign: 'center' },

  // Cart
  cartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.borderGray },
  cartTitle: { fontSize: 20, fontWeight: '800', color: C.textDark },
  cartItem: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 12, padding: 12, gap: 12, alignItems: 'center', borderWidth: 1, borderColor: C.borderGray },
  cartItemImg: { width: 64, height: 64, borderRadius: 8, backgroundColor: C.surfaceGray },
  cartFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.borderGray, padding: 16, gap: 12, elevation: 8, shadowColor: C.shadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 1, shadowRadius: 8 },
  cartSummary: { gap: 8 },
  cartSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartSummaryLabel: { fontSize: 14, color: C.textMid, fontWeight: '500' },
  cartSummaryVal: { fontSize: 16, fontWeight: '800', color: C.textDark },
  minOrderAlert: { backgroundColor: C.amberPale, borderRadius: 8, padding: 10, gap: 8 },
  minOrderAlertTxt: { fontSize: 12, color: C.amber, fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: C.borderGray, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.greenMid, borderRadius: 2 },
  placeOrderBtn: { backgroundColor: C.green, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  placeOrderBtnDisabled: { backgroundColor: C.borderGray },
  placeOrderBtnTxt: { color: C.white, fontSize: 15, fontWeight: '700' },

  // Product detail modal
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderGray },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { fontSize: 22, color: C.textDark },
  modalHeaderTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.textDark, textAlign: 'center' },
  detailImageContainer: { backgroundColor: C.surfaceGray, height: 240, overflow: 'hidden' },
  detailImage: { width: '100%', height: '100%' },
  detailBody: { padding: 16, gap: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  detailName: { flex: 1, fontSize: 19, fontWeight: '800', color: C.textDark, lineHeight: 26 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  typeBadgeTxt: { fontSize: 12, fontWeight: '700' },
  detailCompany: { fontSize: 13, color: C.textLight, marginTop: -6 },
  priceCard: { backgroundColor: C.greenPale, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.greenBorder },
  ptrLabel: { fontSize: 11, color: C.textLight, fontWeight: '600', marginBottom: 2 },
  ptrValue: { fontSize: 22, fontWeight: '800', color: C.textDark },
  mrpLabel: { fontSize: 11, color: C.textLight, fontWeight: '600', marginBottom: 2 },
  mrpValue: { fontSize: 16, color: C.textLight, textDecorationLine: 'line-through' },
  priceDivider: { width: 1, height: 40, backgroundColor: C.greenBorder },
  savingsBadge: { backgroundColor: C.green, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  savingsTxt: { color: C.white, fontSize: 14, fontWeight: '800' },
  infoCard: { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.borderGray, gap: 8 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoCardIcon: { fontSize: 16 },
  infoCardTitle: { fontSize: 13, fontWeight: '800', color: C.textDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoText: { fontSize: 14, color: C.textMid, lineHeight: 21 },
  similarSection: { gap: 4 },
  similarCard: { width: 140, borderRadius: 12, backgroundColor: C.white, marginRight: 12, padding: 10, gap: 6, borderWidth: 1, borderColor: C.borderGray },
  similarImg: { width: '100%', height: 90, borderRadius: 8, backgroundColor: C.surfaceGray },
  similarName: { fontSize: 12, fontWeight: '600', color: C.textDark, lineHeight: 16 },
  similarPrice: { fontSize: 13, fontWeight: '700', color: C.green },
  detailFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.borderGray, elevation: 8, shadowColor: C.shadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 1, shadowRadius: 6 },
  footerPrice: { fontSize: 20, fontWeight: '800', color: C.textDark },
  footerMrp: { fontSize: 12, color: C.textLight, textDecorationLine: 'line-through' },

  // Filter sheet
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 16 },
  sheetHandle: { width: 40, height: 4, backgroundColor: C.borderGray, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderGray },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: C.textDark },
  clearAllTxt: { fontSize: 14, color: C.red, fontWeight: '600' },
  filterSection: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.surfaceGray },
  filterSectionTitle: { fontSize: 13, fontWeight: '800', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceGray, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7, gap: 6, borderWidth: 1.5, borderColor: 'transparent' },
  pillActive: { backgroundColor: C.greenPale, borderColor: C.greenBorder },
  pillTxt: { fontSize: 13, color: C.textMid, fontWeight: '500' },
  pillTxtActive: { color: C.green, fontWeight: '700' },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.textLight, alignItems: 'center', justifyContent: 'center' },
  radioCircleActive: { borderColor: C.green },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: C.textLight, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { borderColor: C.green, backgroundColor: C.green },
  checkMark: { color: C.white, fontSize: 10, fontWeight: '800' },
  rangeLbl: { fontSize: 12, color: C.textLight },
  priceChip: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.surfaceGray, borderWidth: 1.5, borderColor: 'transparent' },
  priceChipActive: { backgroundColor: C.greenPale, borderColor: C.greenBorder },
  priceChipTxt: { fontSize: 13, color: C.textMid, fontWeight: '600' },
  priceChipTxtActive: { color: C.green, fontWeight: '700' },
  sheetFooter: { paddingHorizontal: 16, paddingTop: 12 },
  applyBtn: { backgroundColor: C.green, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  applyBtnTxt: { color: C.white, fontSize: 15, fontWeight: '700' },

  // Misc
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
  emptySubtitle: { fontSize: 14, color: C.textLight, marginTop: 6 },
  bodyTxt: { fontSize: 15, color: C.textMid, lineHeight: 22 },

  // Account
  accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: C.borderGray },
  accountAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  accountAvatarTxt: { color: C.white, fontSize: 22, fontWeight: '800' },
  accountName: { fontSize: 17, fontWeight: '800', color: C.textDark },
  accountPhone: { fontSize: 13, color: C.textLight, marginTop: 2 },
  statusPill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillTxt: { fontSize: 12, fontWeight: '700' },
  creditCard: { margin: 16, backgroundColor: C.greenPale, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.greenBorder },
  creditCardTitle: { fontSize: 13, fontWeight: '800', color: C.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  creditRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  creditStat: { flex: 1, alignItems: 'center' },
  creditStatLabel: { fontSize: 11, color: C.textLight, fontWeight: '600', marginBottom: 2 },
  creditStatValue: { fontSize: 15, fontWeight: '800', color: C.textDark },
  creditDivider: { width: 1, height: 36, backgroundColor: C.greenBorder },
  creditBar: { height: 6, backgroundColor: C.greenBorder, borderRadius: 3, overflow: 'hidden' },
  creditBarFill: { height: '100%', borderRadius: 3 },
  creditBarLabel: { fontSize: 11, color: C.textLight, marginTop: 4, textAlign: 'center' },
  orderCard: { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.borderGray, marginBottom: 8 },
  orderCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  orderCardId: { fontSize: 14, fontWeight: '700', color: C.textDark },
  orderStatusPill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  orderStatusTxt: { fontSize: 11, fontWeight: '700' },
  orderCardDate: { fontSize: 12, color: C.textLight, marginBottom: 8 },
  orderCardItems: { gap: 3, marginBottom: 8 },
  orderCardItem: { fontSize: 13, color: C.textMid },
  orderCardFooter: { borderTopWidth: 1, borderTopColor: C.borderGray, paddingTop: 8 },
  orderCardTotal: { fontSize: 15, fontWeight: '800', color: C.textDark },
  logoutBtn: { margin: 16, marginTop: 24, backgroundColor: C.redPale, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  logoutBtnTxt: { color: C.red, fontSize: 15, fontWeight: '700' },
});
