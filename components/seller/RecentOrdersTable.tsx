"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Search, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface RecentOrdersTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders: any[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const displayOrders = orders || [];

  return (
    <Card className="border border-slate-100 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2rem] overflow-hidden">
      <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b border-slate-50">
        <div>
          <CardTitle className="text-xl font-black tracking-tight text-slate-900">Recent Transactions</CardTitle>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Active Orders Overview</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search orders..." 
                    className="h-10 pl-9 pr-4 text-xs font-bold rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-amber-500/50 w-48 transition-all"
                />
            </div>
            <Button variant="outline" className="h-10 font-bold gap-2 rounded-xl border-slate-100 hover:bg-slate-50 px-4">
                <Filter className="h-4 w-4" /> Filters
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-[120px] text-[10px] font-black uppercase text-slate-500 pl-8 py-4">Order ID</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4">Customer</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4">Items</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 text-right py-4">Total Amount</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center py-4">Status</TableHead>
              <TableHead className="w-[80px] pr-8 py-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayOrders.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} className="h-40 text-center">
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No orders found</p>
                   </TableCell>
                </TableRow>
            ) : (
                displayOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                        <TableCell className="font-bold text-slate-400 pl-8 py-5">
                             <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px]">#{order.id.substring(order.id.length - 4).toUpperCase()}</span>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 ring-2 ring-white shadow-md">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.customer?.username || 'user'}`} />
                                <AvatarFallback className="bg-amber-500 text-white font-bold">{order.customer?.username ? (order.customer.username as string)[0] : 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors">{order.customer?.username || 'Guest'}</span>
                                <span className="text-[10px] font-bold text-slate-400 tracking-tighter truncate max-w-[120px]">{order.customer?.email || 'N/A'}</span>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-600">
                             {order.items?.length || 0} Products
                        </TableCell>
                        <TableCell className="text-right font-black text-slate-900 text-base tabular-nums">
                             ₹{order.totalAmount}
                        </TableCell>
                        <TableCell className="text-center">
                         <Badge className={cn(
                              "border-none font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-wider",
                              (order.status === 'success' || order.status === 'ACCEPTED' || order.status === 'SHIPPED' || order.status === 'DELIVERED') ? 'bg-emerald-50 text-emerald-600' : 
                              (order.status === 'pending' || order.status === 'PENDING') ? 'bg-amber-50 text-amber-600' : 
                              'bg-slate-100 text-slate-500'
                         )}>
                             {order.status}
                         </Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                        <Link href={`/seller/orders/${order.id}`}>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-amber-500 rounded-xl hover:bg-amber-50 transition-all">
                                <ArrowUpRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <div className="p-6 px-8 flex items-center justify-between bg-slate-50/30">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Showing {displayOrders.length} Recent Records</span>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 font-black text-xs text-slate-600 hover:bg-white">View All Orders</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
