"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Order, OrderStatus } from "@/lib/db"
import { updateOrderStatus } from "@/app/actions"

type Props = { orders: Order[] }

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  Placed: "Accepted",
  Accepted: "Processing",
  Processing: "Shipped",
  Shipped: "Completed",
  Completed: null,
  Rejected: null,
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  Placed: "bg-blue-50 text-blue-700 border-blue-200",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Processing: "bg-amber-50 text-amber-700 border-amber-200",
  Shipped: "bg-purple-50 text-purple-700 border-purple-200",
  Completed: "bg-slate-50 text-slate-700 border-slate-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
}

export function OrdersPanel({ orders }: Props) {
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<OrderStatus | "All">("All")

  const displayed = filter === "All" ? orders : orders.filter((o) => o.status === filter)
  const sorted = [...displayed].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const counts = orders.reduce<Record<string, number>>(
    (acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc },
    {}
  )

  return (
    <Card className="border-emerald-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-emerald-900">Orders</CardTitle>
        <CardDescription className="text-slate-500">
          {orders.length} total orders · manage lifecycle from Placed to Completed
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Status filter bar */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(["All", "Placed", "Accepted", "Processing", "Shipped", "Completed", "Rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                filter === s
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
              }`}
            >
              {s}
              {s !== "All" && counts[s] ? ` (${counts[s]})` : ""}
            </button>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            {filter === "All" ? "No orders placed yet." : `No ${filter} orders.`}
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((order) => {
              const next = STATUS_NEXT[order.status]
              const date = new Date(order.created_at).toLocaleString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">#{order.id}</span>
                        <span className="text-slate-600">{order.store_name}</span>
                        <Badge variant="outline" className={STATUS_COLORS[order.status]}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{date} · {order.user_phone}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-emerald-700">
                        ₹{order.total.toLocaleString("en-IN")}
                      </span>
                      {next && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={isPending}
                          onClick={() => startTransition(() => updateOrderStatus(order.id, next))}
                        >
                          Mark {next}
                        </Button>
                      )}
                      {order.status === "Placed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={isPending}
                          onClick={() => startTransition(() => updateOrderStatus(order.id, "Rejected"))}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="mt-3 border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-slate-600">
                        <span className="truncate mr-2">{item.name} × {item.qty}</span>
                        <span className="shrink-0 text-slate-500">₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
