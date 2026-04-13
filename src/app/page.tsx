import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import data from "../../data.json"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white text-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Medical Admin Workspace</h1>
            <p className="text-slate-500 mt-1">Manage B2B users, credit, and product inventory.</p>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 bg-slate-100">
            <TabsTrigger value="users" className="data-[state=active]:bg-white">Users & Credit</TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-white">Inventory</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">User Management</CardTitle>
                <CardDescription className="text-slate-500">
                  Review registrations, approve accounts, and adjust credit balances.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 hover:bg-slate-50/50">
                      <TableHead className="text-slate-600 font-semibold">Store Name</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Phone</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Status</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-right">Credit Balance</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user) => (
                      <TableRow key={user.phone} className="border-slate-200 hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-900">{user.store_name}</TableCell>
                        <TableCell className="text-slate-600">{user.phone}</TableCell>
                        <TableCell>
                          {user.is_approved ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          ₹{user.credit_balance.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!user.is_approved ? (
                              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-sm transition-colors">
                                Approve
                              </Button>
                            ) : null}
                            <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                              Adjust Credit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="inventory">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Product Inventory</CardTitle>
                <CardDescription className="text-slate-500">
                  Manage medical supplies, view stock levels and pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 hover:bg-slate-50/50">
                      <TableHead className="text-slate-600 font-semibold">Name</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Company</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-right">Price</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.products.map((product) => (
                      <TableRow key={product.id} className="border-slate-200 hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-900">{product.name}</TableCell>
                        <TableCell className="text-slate-600">{product.company}</TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          ₹{product.price.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={
                            product.stock > 10 
                              ? "bg-slate-100 text-slate-700 border-slate-200" 
                              : "bg-red-50 text-red-700 border-red-200"
                          }>
                            {product.stock} units
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
