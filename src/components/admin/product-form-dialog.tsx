"use client"

import { useState, useTransition } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/db"

const CATEGORIES = [
  "Analgesics",
  "Antibiotics",
  "Allergy",
  "Cardiac",
  "Cold & Cough",
  "Devices",
  "Diabetes",
  "Eye Care",
  "First Aid",
  "Gastro",
  "General",
] as const

const MEDICINE_TYPES = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Device"] as const

type Mode = "add" | "edit"

type Props = {
  trigger: React.ReactNode
  product?: Product
  onSubmit: (input: Omit<Product, "id">) => Promise<void>
  mode: Mode
}

export function ProductFormDialog({ trigger, product, onSubmit, mode }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (formData: FormData) => {
    const input: Omit<Product, "id"> = {
      name: String(formData.get("name") ?? ""),
      company: String(formData.get("company") ?? ""),
      manufacturer: String(formData.get("manufacturer") ?? ""),
      category: String(formData.get("category") ?? "General"),
      medicine_type: String(formData.get("medicine_type") ?? "Tablet"),
      price: Number(formData.get("price") ?? 0),
      mrp: Number(formData.get("mrp") ?? 0),
      stock: Number(formData.get("stock") ?? 0),
      image_url: String(formData.get("image_url") ?? ""),
      description: String(formData.get("description") ?? ""),
      composition: String(formData.get("composition") ?? ""),
    }
    setError(null)
    startTransition(async () => {
      try {
        await onSubmit(input)
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed")
      }
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={trigger as React.ReactElement} />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(640px,calc(100vw-2rem))] max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 transition-[opacity,scale] duration-200">
          <Dialog.Title className="text-xl font-bold text-emerald-900">
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-slate-500 mt-1">
            Fields marked with * are required. Missing image and description default to category placeholders.
          </Dialog.Description>

          <form action={handleSubmit} className="grid grid-cols-2 gap-4 mt-6">
            <Field label="Product Name *" className="col-span-2">
              <input name="name" required defaultValue={product?.name} className={inputCls} placeholder="e.g. Paracetamol 500mg (Box of 100)" />
            </Field>

            <Field label="Company">
              <input name="company" defaultValue={product?.company} className={inputCls} placeholder="GSK" />
            </Field>
            <Field label="Manufacturer">
              <input name="manufacturer" defaultValue={product?.manufacturer} className={inputCls} placeholder="GlaxoSmithKline Pharmaceuticals Ltd" />
            </Field>

            <Field label="Category">
              <select name="category" defaultValue={product?.category ?? "General"} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Medicine Type">
              <select name="medicine_type" defaultValue={product?.medicine_type ?? "Tablet"} className={inputCls}>
                {MEDICINE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="PTR (Price To Retailer) ₹">
              <input name="price" type="number" min={0} step="0.01" defaultValue={product?.price} className={inputCls} required />
            </Field>
            <Field label="MRP ₹">
              <input name="mrp" type="number" min={0} step="0.01" defaultValue={product?.mrp} className={inputCls} />
            </Field>

            <Field label="Stock (units)" className="col-span-2">
              <input name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} className={inputCls} />
            </Field>

            <Field label="Image URL" className="col-span-2">
              <input name="image_url" defaultValue={product?.image_url} className={inputCls} placeholder="https://… (leave blank for category placeholder)" />
            </Field>

            <Field label="Composition" className="col-span-2">
              <input name="composition" defaultValue={product?.composition} className={inputCls} placeholder="e.g. Paracetamol 500 mg" />
            </Field>

            <Field label="Description" className="col-span-2">
              <textarea name="description" rows={3} defaultValue={product?.description} className={`${inputCls} resize-none`} placeholder="Short product description shown in the mobile app" />
            </Field>

            {error && (
              <p className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
            )}

            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <Dialog.Close render={<Button type="button" variant="outline">Cancel</Button>} />
              <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isPending ? "Saving…" : mode === "add" ? "Add Product" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      {children}
    </label>
  )
}
