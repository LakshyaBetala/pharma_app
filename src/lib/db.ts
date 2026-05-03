import { promises as fs } from "node:fs"
import path from "node:path"

export type Product = {
  id: number
  name: string
  company: string
  manufacturer: string
  category: string
  medicine_type: string
  price: number
  mrp: number
  stock: number
  image_url: string
  description: string
  composition: string
}

export type User = {
  phone: string
  store_name: string
  is_approved: boolean
  credit_balance: number
  credit_limit: number
}

export type OrderItem = {
  product_id: number
  name: string
  qty: number
  price: number
}

export type OrderStatus = "Placed" | "Accepted" | "Processing" | "Shipped" | "Completed" | "Rejected"

export type Order = {
  id: number
  user_phone: string
  store_name: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  created_at: string
}

export type DB = { users: User[]; products: Product[]; orders: Order[] }

const ROOT = process.cwd()
const ROOT_DATA = path.join(ROOT, "data.json")
const MOBILE_DATA = path.join(ROOT, "mobile", "data.json")

const PLACEHOLDER_BY_TYPE: Record<string, string> = {
  Tablet: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop",
  Capsule: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&h=400&fit=crop",
  Syrup: "https://images.unsplash.com/photo-1631549919535-0b2b75c63a90?w=400&h=400&fit=crop",
  Injection: "https://images.unsplash.com/photo-1583912267550-d6c2ac3196c0?w=400&h=400&fit=crop",
  Cream: "https://images.unsplash.com/photo-1550572017-37b3e7c1b6e0?w=400&h=400&fit=crop",
  Drops: "https://images.unsplash.com/photo-1582719471378-b18b5e5b2b46?w=400&h=400&fit=crop",
  Device: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=400&h=400&fit=crop",
}

export function placeholderImage(medicine_type: string) {
  return PLACEHOLDER_BY_TYPE[medicine_type] ?? PLACEHOLDER_BY_TYPE.Tablet
}

export async function readDB(): Promise<DB> {
  const raw = await fs.readFile(ROOT_DATA, "utf8")
  return JSON.parse(raw) as DB
}

async function writeDB(db: DB) {
  const json = JSON.stringify(db, null, 2)
  await Promise.all([
    fs.writeFile(ROOT_DATA, json, "utf8"),
    fs.writeFile(MOBILE_DATA, json, "utf8"),
  ])
}

export async function mutate(fn: (db: DB) => DB | Promise<DB>) {
  const db = await readDB()
  const next = await fn(db)
  await writeDB(next)
  return next
}
