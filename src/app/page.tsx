import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { readDB } from "@/lib/db"
import { InventoryPanel } from "@/components/admin/inventory-panel"
import { UsersPanel } from "@/components/admin/users-panel"
import { OrdersPanel } from "@/components/admin/orders-panel"

export default async function Dashboard() {
  const db = await readDB()
  const pendingOrders = (db.orders ?? []).filter((o) => o.status === "Placed").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 to-white text-slate-800">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-base font-bold">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-emerald-900 leading-tight">MedPlus Admin</h1>
              <p className="text-xs text-slate-400 leading-tight">B2B Pharma Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 font-medium">
              {db.products.length} SKUs
            </span>
            {pendingOrders > 0 && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 font-medium">
                {pendingOrders} new order{pendingOrders !== 1 ? "s" : ""}
              </span>
            )}
            <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 font-medium">
              {db.users.filter((u) => !u.is_approved).length} pending approvals
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-6 bg-emerald-50 border border-emerald-200 p-1 rounded-xl">
            <TabsTrigger
              value="orders"
              className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-6"
            >
              Orders {pendingOrders > 0 ? `(${pendingOrders} new)` : ""}
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-6"
            >
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-6"
            >
              Users & Credit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrdersPanel orders={db.orders ?? []} />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryPanel products={db.products} />
          </TabsContent>

          <TabsContent value="users">
            <UsersPanel users={db.users} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
