"use server"

import { revalidatePath } from "next/cache"
import { mutate, placeholderImage, type Order, type OrderItem, type OrderStatus, type Product } from "@/lib/db"

type ProductInput = Omit<Product, "id">

function sanitizeProduct(input: Partial<ProductInput>): ProductInput {
  const medicine_type = (input.medicine_type ?? "Tablet").trim() || "Tablet"
  const category = (input.category ?? "General").trim() || "General"
  const name = (input.name ?? "").trim()
  if (!name) throw new Error("Product name is required")
  const price = Number(input.price ?? 0)
  const mrp = Number(input.mrp ?? price)
  const stock = Number(input.stock ?? 0)
  return {
    name,
    company: (input.company ?? "").trim(),
    manufacturer: (input.manufacturer ?? input.company ?? "").trim(),
    category,
    medicine_type,
    price: Number.isFinite(price) ? price : 0,
    mrp: Number.isFinite(mrp) && mrp > 0 ? mrp : price,
    stock: Number.isFinite(stock) ? stock : 0,
    image_url: (input.image_url ?? "").trim() || placeholderImage(medicine_type),
    description:
      (input.description ?? "").trim() ||
      `High-quality ${medicine_type.toLowerCase()} formulation in the ${category} range.`,
    composition: (input.composition ?? "").trim() || "—",
  }
}

export async function addProduct(input: Partial<ProductInput>) {
  const product = sanitizeProduct(input)
  await mutate((db) => {
    const nextId = db.products.reduce((m, p) => Math.max(m, p.id), 0) + 1
    db.products.push({ id: nextId, ...product })
    return db
  })
  revalidatePath("/")
}

export async function updateProduct(id: number, input: Partial<ProductInput>) {
  const product = sanitizeProduct(input)
  await mutate((db) => {
    const idx = db.products.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error(`Product ${id} not found`)
    db.products[idx] = { id, ...product }
    return db
  })
  revalidatePath("/")
}

export async function deleteProduct(id: number) {
  await mutate((db) => {
    db.products = db.products.filter((p) => p.id !== id)
    return db
  })
  revalidatePath("/")
}

export async function approveUser(phone: string) {
  await mutate((db) => {
    const u = db.users.find((u) => u.phone === phone)
    if (!u) throw new Error(`User ${phone} not found`)
    u.is_approved = true
    if (u.credit_limit === 0) u.credit_limit = 50000
    return db
  })
  revalidatePath("/")
}

export async function adjustCredit(phone: string, delta: number) {
  await mutate((db) => {
    const u = db.users.find((u) => u.phone === phone)
    if (!u) throw new Error(`User ${phone} not found`)
    u.credit_balance = Math.max(0, u.credit_balance + delta)
    return db
  })
  revalidatePath("/")
}

export async function placeOrder(phone: string, items: OrderItem[]): Promise<Order> {
  let placed!: Order
  await mutate((db) => {
    const user = db.users.find((u) => u.phone === phone)
    if (!user) throw new Error(`User ${phone} not found`)
    if (!user.is_approved) throw new Error("Account not approved")
    const total = items.reduce((s, i) => s + i.price * i.qty, 0)
    if (total < 2000) throw new Error("Minimum order value is ₹2,000")
    if (!db.orders) db.orders = []
    const nextId = db.orders.reduce((m, o) => Math.max(m, o.id), 0) + 1
    placed = {
      id: nextId,
      user_phone: phone,
      store_name: user.store_name,
      items,
      total,
      status: "Placed",
      created_at: new Date().toISOString(),
    }
    db.orders.push(placed)
    return db
  })
  revalidatePath("/")
  return placed
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  await mutate((db) => {
    if (!db.orders) throw new Error("No orders")
    const order = db.orders.find((o) => o.id === id)
    if (!order) throw new Error(`Order ${id} not found`)
    order.status = status
    return db
  })
  revalidatePath("/")
}
