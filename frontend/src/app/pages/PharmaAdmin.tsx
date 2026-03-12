import { useState, useRef } from "react";
import {
  Plus, Search, Edit2, Trash2, X, Check, Package,
  AlertTriangle, TrendingUp, ChevronDown, Filter, Download,
  Pill, Stethoscope, FlaskConical, HeartPulse, ShieldPlus,
  RefreshCw, ArrowUpDown,
} from "lucide-react";

type Category = "Diabetes" | "Cholesterol" | "Blood Pressure" | "Antibiotic" | "Pain Relief" | "Supplement" | "Cardiac" | "Thyroid" | "Antacid" | "Other";
type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

interface Medicine {
  id: number;
  name: string;
  brand: string;
  category: Category;
  dose: string;
  form: string;
  price: number;
  stock: number;
  minStock: number;
  manufacturer: string;
  expiry: string;
  prescription: boolean;
}

const CATEGORIES: Category[] = [
  "Diabetes", "Cholesterol", "Blood Pressure", "Antibiotic",
  "Pain Relief", "Supplement", "Cardiac", "Thyroid", "Antacid", "Other",
];

const FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Drops", "Cream", "Inhaler", "Powder"];

const categoryIcons: Record<Category, React.ReactNode> = {
  Diabetes: <Stethoscope className="w-3.5 h-3.5" />,
  Cholesterol: <HeartPulse className="w-3.5 h-3.5" />,
  "Blood Pressure": <TrendingUp className="w-3.5 h-3.5" />,
  Antibiotic: <ShieldPlus className="w-3.5 h-3.5" />,
  "Pain Relief": <Pill className="w-3.5 h-3.5" />,
  Supplement: <FlaskConical className="w-3.5 h-3.5" />,
  Cardiac: <HeartPulse className="w-3.5 h-3.5" />,
  Thyroid: <FlaskConical className="w-3.5 h-3.5" />,
  Antacid: <Pill className="w-3.5 h-3.5" />,
  Other: <Package className="w-3.5 h-3.5" />,
};

const categoryColors: Record<Category, string> = {
  Diabetes: "bg-blue-50 text-blue-700",
  Cholesterol: "bg-rose-50 text-rose-700",
  "Blood Pressure": "bg-purple-50 text-purple-700",
  Antibiotic: "bg-amber-50 text-amber-700",
  "Pain Relief": "bg-orange-50 text-orange-700",
  Supplement: "bg-emerald-50 text-emerald-700",
  Cardiac: "bg-pink-50 text-pink-700",
  Thyroid: "bg-teal-50 text-teal-700",
  Antacid: "bg-cyan-50 text-cyan-700",
  Other: "bg-slate-50 text-slate-600",
};

const SEED_MEDICINES: Medicine[] = [
  { id: 1, name: "Metformin", brand: "Glyciphage", category: "Diabetes", dose: "500mg", form: "Tablet", price: 48, stock: 240, minStock: 50, manufacturer: "Franco-Indian", expiry: "2027-06", prescription: true },
  { id: 2, name: "Atorvastatin", brand: "Atorva", category: "Cholesterol", dose: "20mg", form: "Tablet", price: 85, stock: 18, minStock: 40, manufacturer: "Zydus", expiry: "2026-12", prescription: true },
  { id: 3, name: "Telmisartan", brand: "Telma", category: "Blood Pressure", dose: "40mg", form: "Tablet", price: 112, stock: 0, minStock: 30, manufacturer: "Glenmark", expiry: "2027-03", prescription: true },
  { id: 4, name: "Vitamin D3", brand: "Calcirol", category: "Supplement", dose: "60,000 IU", form: "Capsule", price: 65, stock: 90, minStock: 20, manufacturer: "Cadila", expiry: "2027-09", prescription: false },
  { id: 5, name: "Amoxicillin", brand: "Mox", category: "Antibiotic", dose: "500mg", form: "Capsule", price: 95, stock: 55, minStock: 30, manufacturer: "Ranbaxy", expiry: "2026-11", prescription: true },
  { id: 6, name: "Paracetamol", brand: "Calpol", category: "Pain Relief", dose: "650mg", form: "Tablet", price: 28, stock: 500, minStock: 100, manufacturer: "GSK", expiry: "2027-12", prescription: false },
];

const emptyForm = (): Omit<Medicine, "id"> => ({
  name: "", brand: "", category: "Other", dose: "", form: "Tablet",
  price: 0, stock: 0, minStock: 20, manufacturer: "", expiry: "", prescription: false,
});

function getStockStatus(stock: number, min: number): StockStatus {
  if (stock === 0) return "Out of Stock";
  if (stock <= min) return "Low Stock";
  return "In Stock";
}

const stockStatusStyles: Record<StockStatus, string> = {
  "In Stock": "bg-emerald-50 text-emerald-700",
  "Low Stock": "bg-amber-50 text-amber-700",
  "Out of Stock": "bg-rose-50 text-rose-700",
};

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(79,125,243,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8]">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-[#1E293B]">{value}</div>
      <div className="text-xs text-[#94A3B8] mt-1">{sub}</div>
    </div>
  );
}

interface FormModalProps {
  initial: Omit<Medicine, "id">;
  editingId: number | null;
  onSave: (data: Omit<Medicine, "id">) => void;
  onClose: () => void;
}

function FormModal({ initial, editingId, onSave, onClose }: FormModalProps) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const fieldClass = "w-full px-3.5 py-2.5 border border-[rgba(0,0,0,0.1)] rounded-xl text-sm text-[#1E293B] bg-white outline-none transition focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#94A3B8]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-[rgba(0,0,0,0.06)] rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">Pharma Admin</div>
              <h2 className="text-xl font-bold text-[#1E293B]">
                {editingId ? "Edit Medicine" : "Add New Medicine"}
              </h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F8FAFC] text-[#64748B] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Medicine Name *</label>
              <input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Metformin" className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Brand Name *</label>
              <input required value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. Glyciphage" className={fieldClass} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Category *</label>
              <select required value={form.category} onChange={e => set("category", e.target.value as Category)} className={fieldClass}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Dosage *</label>
              <input required value={form.dose} onChange={e => set("dose", e.target.value)} placeholder="e.g. 500mg" className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Form *</label>
              <select required value={form.form} onChange={e => set("form", e.target.value)} className={fieldClass}>
                {FORMS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Price (₹) *</label>
              <input required type="number" min={0} value={form.price || ""} onChange={e => set("price", Number(e.target.value))} placeholder="0.00" className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Current Stock *</label>
              <input required type="number" min={0} value={form.stock || ""} onChange={e => set("stock", Number(e.target.value))} placeholder="0" className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Min Stock Alert</label>
              <input type="number" min={0} value={form.minStock || ""} onChange={e => set("minStock", Number(e.target.value))} placeholder="20" className={fieldClass} />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Manufacturer *</label>
              <input required value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} placeholder="e.g. Sun Pharma" className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Expiry Date *</label>
              <input required type="month" value={form.expiry} onChange={e => set("expiry", e.target.value)} className={fieldClass} />
            </div>
          </div>

          {/* Prescription Toggle */}
          <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border border-[rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={() => set("prescription", !form.prescription)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.prescription ? "bg-[#4F7DF3]" : "bg-[#CBD5E1]"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.prescription ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <div>
              <div className="text-sm font-semibold text-[#1E293B]">Prescription Required</div>
              <div className="text-xs text-[#94A3B8]">Toggle if this medicine requires a doctor's prescription</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-[#F8FAFC] transition-colors text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-full bg-[#4F7DF3] hover:bg-[#3D6DE3] text-white text-sm font-bold transition-colors shadow-[0_2px_10px_rgba(79,125,243,0.3)]">
              {editingId ? "Save Changes" : "Add Medicine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PharmaAdmin() {
  const [medicines, setMedicines] = useState<Medicine[]>(SEED_MEDICINES);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<"All" | Category>("All");
  const [filterStatus, setFilterStatus] = useState<"All" | StockStatus>("All");
  const [sortField, setSortField] = useState<keyof Medicine>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formInitial, setFormInitial] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const nextId = useRef(SEED_MEDICINES.length + 1);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    setFormInitial(emptyForm());
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (m: Medicine) => {
    const { id, ...rest } = m;
    setFormInitial(rest);
    setEditingId(id);
    setModalOpen(true);
  };

  const handleSave = (data: Omit<Medicine, "id">) => {
    if (editingId !== null) {
      setMedicines(p => p.map(m => m.id === editingId ? { ...data, id: editingId } : m));
      showToast("Medicine updated successfully.");
    } else {
      setMedicines(p => [...p, { ...data, id: nextId.current++ }]);
      showToast("Medicine added successfully.");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: number) => {
    setMedicines(p => p.filter(m => m.id !== id));
    setDeleteConfirm(null);
    showToast("Medicine removed.", "error");
  };

  const toggleSort = (field: keyof Medicine) => {
    if (sortField === field) setSortAsc(p => !p);
    else { setSortField(field); setSortAsc(true); }
  };

  const filtered = medicines
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q) || m.manufacturer.toLowerCase().includes(q);
      const matchCat = filterCategory === "All" || m.category === filterCategory;
      const matchStatus = filterStatus === "All" || getStockStatus(m.stock, m.minStock) === filterStatus;
      return matchSearch && matchCat && matchStatus;
    })
    .sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  const totalMeds = medicines.length;
  const inStock = medicines.filter(m => getStockStatus(m.stock, m.minStock) === "In Stock").length;
  const lowStock = medicines.filter(m => getStockStatus(m.stock, m.minStock) === "Low Stock").length;
  const outOfStock = medicines.filter(m => getStockStatus(m.stock, m.minStock) === "Out of Stock").length;
  const prescriptionOnly = medicines.filter(m => m.prescription).length;

  const SortIcon = ({ field }: { field: keyof Medicine }) => (
    <ArrowUpDown className={`w-3.5 h-3.5 ml-1 inline transition-colors ${sortField === field ? "text-[#4F7DF3]" : "text-[#CBD5E1]"}`} />
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold transition-all ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] mb-1">Remove Medicine?</h3>
            <p className="text-sm text-[#64748B] mb-5">This will permanently remove the medicine from your inventory.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-[#F8FAFC] transition-colors text-sm font-semibold">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <FormModal
          initial={formInitial}
          editingId={editingId}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">RuralCare · Admin Panel</div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Pharmacy Inventory</h1>
            <p className="text-sm text-[#64748B] mt-0.5">Manage medicines, stock levels and pricing</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-white text-sm font-medium transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4F7DF3] hover:bg-[#3D6DE3] text-white text-sm font-bold transition-colors shadow-[0_2px_10px_rgba(79,125,243,0.35)]"
            >
              <Plus className="w-4 h-4" />
              Add Medicine
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Medicines" value={totalMeds} sub="across all categories" color="bg-blue-50 text-[#4F7DF3]" icon={<Package className="w-4 h-4" />} />
          <StatCard label="In Stock" value={inStock} sub="fully stocked" color="bg-emerald-50 text-emerald-600" icon={<Check className="w-4 h-4" />} />
          <StatCard label="Low Stock" value={lowStock} sub="need restocking" color="bg-amber-50 text-amber-600" icon={<AlertTriangle className="w-4 h-4" />} />
          <StatCard label="Out of Stock" value={outOfStock} sub="unavailable" color="bg-rose-50 text-rose-600" icon={<RefreshCw className="w-4 h-4" />} />
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, brand or manufacturer…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(0,0,0,0.08)] text-sm text-[#1E293B] bg-[#F8FAFC] outline-none focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#94A3B8]"
              />
            </div>

            {/* Category filter */}
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value as "All" | Category)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-[rgba(0,0,0,0.08)] text-sm text-[#1E293B] bg-[#F8FAFC] outline-none focus:border-[#4F7DF3] appearance-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
            </div>

            {/* Status filter */}
            <div className="relative w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as "All" | StockStatus)}
                className="w-full pl-4 pr-8 py-2.5 rounded-xl border border-[rgba(0,0,0,0.08)] text-sm text-[#1E293B] bg-[#F8FAFC] outline-none focus:border-[#4F7DF3] appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-xs text-[#94A3B8]">
            Showing <span className="font-semibold text-[#1E293B]">{filtered.length}</span> of <span className="font-semibold text-[#1E293B]">{medicines.length}</span> medicines
            {prescriptionOnly > 0 && <span className="ml-3">· <span className="font-semibold text-[#4F7DF3]">{prescriptionOnly}</span> require prescription</span>}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">

          {/* Mobile card list — visible only on xs */}
          <div className="sm:hidden">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-[#94A3B8] text-sm">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No medicines found.
              </div>
            ) : filtered.map((m) => {
              const status = getStockStatus(m.stock, m.minStock);
              const stockBarColor = status === "In Stock" ? "#22c55e" : status === "Low Stock" ? "#f59e0b" : "#f43f5e";
              return (
                <div key={m.id} className="p-4 border-b border-[rgba(0,0,0,0.04)] last:border-0 hover:bg-[#F8FAFC]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1E293B] text-sm truncate">{m.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{m.brand} · {m.manufacturer}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(m)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#EEF2FF] text-[#4F7DF3] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(m.id)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-rose-50 text-rose-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${categoryColors[m.category]}`}>{categoryIcons[m.category]}{m.category}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stockStatusStyles[status]}`}>{status}</span>
                    {m.prescription && <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-semibold">Rx</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="bg-[#F8FAFC] rounded-lg p-2">
                      <p className="text-[#94A3B8] text-[10px]">Dose</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5 truncate">{m.dose}</p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-lg p-2">
                      <p className="text-[#94A3B8] text-[10px]">Price</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">₹{m.price}</p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-lg p-2">
                      <p className="text-[#94A3B8] text-[10px]">Stock</p>
                      <p className="font-semibold mt-0.5" style={{ color: stockBarColor }}>{m.stock}</p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-lg p-2">
                      <p className="text-[#94A3B8] text-[10px]">Expiry</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{m.expiry || "—"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table — hidden on xs */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#F8FAFC]">
                  {[
                    { label: "Medicine", field: "name" as keyof Medicine },
                    { label: "Category", field: "category" as keyof Medicine },
                    { label: "Dose / Form", field: "dose" as keyof Medicine },
                    { label: "Price", field: "price" as keyof Medicine },
                    { label: "Stock", field: "stock" as keyof Medicine },
                    { label: "Expiry", field: "expiry" as keyof Medicine },
                    { label: "Status", field: null },
                    { label: "Actions", field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      onClick={field ? () => toggleSort(field) : undefined}
                      className={`text-left px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B] whitespace-nowrap ${field ? "cursor-pointer select-none hover:text-[#1E293B]" : ""}`}
                    >
                      {label}
                      {field && <SortIcon field={field} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#94A3B8] text-sm">
                      <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No medicines found matching your filters.
                    </td>
                  </tr>
                ) : filtered.map((m) => {
                  const status = getStockStatus(m.stock, m.minStock);
                  const stockPct = Math.min((m.stock / (m.stock + m.minStock)) * 100, 100);
                  const stockBarColor = status === "In Stock" ? "#22c55e" : status === "Low Stock" ? "#f59e0b" : "#f43f5e";
                  return (
                    <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      {/* Medicine Name */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#1E293B]">{m.name}</div>
                        <div className="text-xs text-[#94A3B8] mt-0.5">{m.brand} · {m.manufacturer}</div>
                        {m.prescription && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-semibold">
                            Rx
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${categoryColors[m.category]}`}>
                          {categoryIcons[m.category]}
                          {m.category}
                        </span>
                      </td>

                      {/* Dose / Form */}
                      <td className="px-5 py-4 text-[#1E293B]">
                        <span className="font-medium">{m.dose}</span>
                        <span className="text-[#94A3B8] ml-1">· {m.form}</span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 font-semibold text-[#1E293B]">
                        ₹{m.price}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${stockPct}%`, background: stockBarColor }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: stockBarColor }}>{m.stock}</span>
                        </div>
                        <div className="text-[10px] text-[#94A3B8] mt-0.5">min: {m.minStock}</div>
                      </td>

                      {/* Expiry */}
                      <td className="px-5 py-4 text-[#64748B] text-xs whitespace-nowrap">
                        {m.expiry || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stockStatusStyles[status]}`}>
                          {status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(m)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#EEF2FF] text-[#4F7DF3] transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(m.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-rose-50 text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-[rgba(0,0,0,0.04)] bg-[#F8FAFC] flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">{filtered.length} records</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-xs text-[#64748B] mr-3">In Stock</span>
                <div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-xs text-[#64748B] mr-3">Low</span>
                <div className="w-2 h-2 rounded-full bg-rose-400" /><span className="text-xs text-[#64748B]">Out</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
