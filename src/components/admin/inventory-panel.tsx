"use client"

import Image from "next/image"
import { useMemo, useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductFormDialog } from "./product-form-dialog"
import type { Product } from "@/lib/db"
import { addProduct, deleteProduct, updateProduct } from "@/app/actions"

type SortKey = "name-asc" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc"

type Props = { products: Product[] }

export function InventoryPanel({ products }: Props) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("All")
  const [medicineType, setMedicineType] = useState<string>("All")
  const [company, setCompany] = useState<string>("All")
  const [sort, setSort] = useState<SortKey>("name-asc")
  const [isPending, startTransition] = useTransition()

  const categories = useMemo(() => unique(products.map((p) => p.category)), [products])
  const medicineTypes = useMemo(() => unique(products.map((p) => p.medicine_type)), [products])
  const companies = useMemo(() => unique(products.map((p) => p.company)), [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = products.filter((p) => {
      if (category !== "All" && p.category !== category) return false
      if (medicineType !== "All" && p.medicine_type !== medicineType) return false
      if (company !== "All" && p.company !== company) return false
      if (q && !`${p.name} ${p.composition} ${p.company}`.toLowerCase().includes(q)) return false
      return true
    })
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name-asc": return a.name.localeCompare(b.name)
        case "price-asc": return a.price - b.price
        case "price-desc": return b.price - a.price
        case "stock-asc": return a.stock - b.stock
        case "stock-desc": return b.stock - a.stock
      }
    })
    return list
  }, [products, query, category, medicineType, company, sort])

  const handleDelete = (id: number) => {
    if (!confirm("Delete this product? This cannot be undone.")) return
    startTransition(() => deleteProduct(id))
  }

  return (
    <Card className="border-emerald-100 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-emerald-900">Product Inventory</CardTitle>
          <CardDescription className="text-slate-500">
            {filtered.length} of {products.length} SKUs · changes sync to the mobile app instantly.
          </CardDescription>
        </div>
        <ProductFormDialog
          mode="add"
          onSubmit={(input) => addProduct(input)}
          trigger={
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">+ Add Product</Button>
          }
        />
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-3 mb-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, composition, or company…"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <FilterSelect value={category} onChange={setCategory} options={["All", ...categories]} label="Category" />
          <FilterSelect value={medicineType} onChange={setMedicineType} options={["All", ...medicineTypes]} label="Type" />
          <FilterSelect value={company} onChange={setCompany} options={["All", ...companies]} label="Company" />
          <FilterSelect
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: "name-asc", label: "Name A → Z" },
              { value: "price-asc", label: "Price low → high" },
              { value: "price-desc", label: "Price high → low" },
              { value: "stock-desc", label: "Stock high → low" },
              { value: "stock-asc", label: "Stock low → high" },
            ]}
            label="Sort by"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-emerald-50/60 text-emerald-900">
              <tr className="text-left">
                <th className="font-semibold px-4 py-3">Product</th>
                <th className="font-semibold px-4 py-3">Category</th>
                <th className="font-semibold px-4 py-3">Type</th>
                <th className="font-semibold px-4 py-3 text-right">PTR / MRP</th>
                <th className="font-semibold px-4 py-3 text-right">Stock</th>
                <th className="font-semibold px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No products match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                        <Image src={p.image_url} alt="" fill sizes="48px" className="object-cover" unoptimized />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500 truncate">{p.company} · {p.composition}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.category}</td>
                  <td className="px-4 py-3 text-slate-600">{p.medicine_type}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium text-slate-900">₹{p.price.toLocaleString("en-IN")}</div>
                    <div className="text-xs text-slate-400 line-through">₹{p.mrp.toLocaleString("en-IN")}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="outline" className={
                      p.stock > 20 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      p.stock > 0 ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    }>
                      {p.stock} units
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <ProductFormDialog
                        mode="edit"
                        product={p}
                        onSubmit={(input) => updateProduct(p.id, input)}
                        trigger={
                          <Button size="sm" variant="outline" className="border-slate-200">Edit</Button>
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(p.id)}
                        disabled={isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

type Option = string | { value: string; label: string }

function FilterSelect({
  value, onChange, options, label,
}: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  label: string
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        {options.map((opt) =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
    </label>
  )
}

function unique(arr: string[]) {
  return Array.from(new Set(arr)).sort()
}
