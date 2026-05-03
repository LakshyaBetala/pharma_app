"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/lib/db"
import { adjustCredit, approveUser } from "@/app/actions"

type Props = { users: User[] }

export function UsersPanel({ users }: Props) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<string | null>(null)
  const [delta, setDelta] = useState("")

  const submitCredit = (phone: string) => {
    const n = Number(delta)
    if (!Number.isFinite(n) || n === 0) return
    startTransition(async () => {
      await adjustCredit(phone, n)
      setEditing(null)
      setDelta("")
    })
  }

  return (
    <Card className="border-emerald-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-emerald-900">User Management</CardTitle>
        <CardDescription className="text-slate-500">
          Approve registrations and adjust credit balances. 60-day credit window applies after approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-emerald-50/60 text-emerald-900">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Store</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Credit Balance</th>
                <th className="px-4 py-3 font-semibold text-right">Limit</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.phone} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.store_name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                  <td className="px-4 py-3">
                    {u.is_approved ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    ₹{u.credit_balance.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    ₹{u.credit_limit.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {!u.is_approved && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={isPending}
                          onClick={() => startTransition(() => approveUser(u.phone))}
                        >
                          Approve
                        </Button>
                      )}
                      {editing === u.phone ? (
                        <>
                          <input
                            value={delta}
                            onChange={(e) => setDelta(e.target.value)}
                            placeholder="±₹"
                            type="number"
                            className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
                            autoFocus
                          />
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => submitCredit(u.phone)}>
                            Apply
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDelta("") }}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="border-slate-200" onClick={() => setEditing(u.phone)}>
                          Adjust Credit
                        </Button>
                      )}
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
