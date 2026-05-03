import { NextRequest, NextResponse } from "next/server"
import { placeOrder } from "@/app/actions"
import type { OrderItem } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, items } = body as { phone: string; items: OrderItem[] }
    if (!phone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing phone or items" }, { status: 400 })
    }
    const order = await placeOrder(phone, items)
    return NextResponse.json({ ok: true, order })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to place order" },
      { status: 400 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { readDB } = await import("@/lib/db")
  const db = await readDB()
  const phone = req.nextUrl.searchParams.get("phone")
  const orders = phone
    ? db.orders.filter((o) => o.user_phone === phone)
    : db.orders
  return NextResponse.json({ orders })
}
