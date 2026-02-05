"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  Mail, 
  MoreVertical, 
  Shield, 
  Trash2,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { toast } from "sonner";
import { RoleSelectionModal, ROLES } from "@/components/seller/RoleSelectionModal";
import { User } from "@/payload-types";

// Define a local interface for Invites since it might not be exported from payload-types
interface TeamInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  seller: string | { id: string };
  updatedAt: string;
  createdAt: string;
}

interface TeamClientProps {
  sellerId: string;
  initialMembers: { id: string; user: { email: string; username?: string }; role: string; joinedAt: string }[];
  initialInvites: TeamInvite[];
  currentUser: User;
  currentRole: string;
}

export default function TeamClient({ 
  sellerId, 
  initialMembers, 
  initialInvites,
  currentUser,
  currentRole 
}: TeamClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "viewer"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalTarget, setRoleModalTarget] = useState<{ id: string; name: string; currentRole: string } | null>(null);
  const [inviteRoleModalOpen, setInviteRoleModalOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canManageTeam = (currentUser as any)?.role === "seller" || (currentUser as any)?.role === "admin" || currentRole === "owner" || currentRole === "admin";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/seller/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inviteData,
          sellerId
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Invitation sent successfully!");
        setInvites([data.invite, ...invites]);
        setIsInviting(false);
        setInviteData({ email: "", role: "viewer" });
        router.refresh();
      } else {
        toast.error(data.error || "Failed to send invitation");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch("/api/seller/team/member", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, sellerId }),
      });

      if (res.ok) {
        toast.success("Member removed successfully");
        setMembers(members.filter(m => m.id !== membershipId));
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleChangeRole = async (membershipId: string, newRole: string) => {
    try {
      const res = await fetch("/api/seller/team/member", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, role: newRole, sellerId }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Role updated successfully");
        setMembers(members.map(m => m.id === membershipId ? data.membership : m));
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    try {
      const res = await fetch("/api/seller/team/invite/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, sellerId }),
      });

      if (res.ok) {
        toast.success("Invitation cancelled");
        setInvites(invites.filter(i => i.id !== inviteId));
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel invitation");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { color: string, label: string, icon: string }> = {
      owner: { color: "bg-red-500", label: "Owner", icon: "👑" },
      admin: { color: "bg-amber-500", label: "Admin", icon: "🛡️" },
      operations_manager: { color: "bg-blue-500", label: "Ops Manager", icon: "📦" },
      inventory_manager: { color: "bg-indigo-500", label: "Inventory", icon: "📊" },
      warehouse_staff: { color: "bg-teal-500", label: "Warehouse", icon: "🏭" },
      customer_support: { color: "bg-emerald-500", label: "Support", icon: "💬" },
      finance: { color: "bg-purple-500", label: "Finance", icon: "💰" },
      marketing_manager: { color: "bg-pink-500", label: "Marketing", icon: "📣" },
      viewer: { color: "bg-slate-500", label: "Viewer", icon: "👁️" },
      // Legacy roles (backwards compatibility)
      manager: { color: "bg-blue-500", label: "Manager", icon: "📦" },
      sellerEmployee: { color: "bg-indigo-500", label: "Team Member", icon: "👤" },
      support: { color: "bg-emerald-500", label: "Support", icon: "💬" },
    };
    const r = roles[role] || { color: "bg-slate-500", label: role, icon: "👤" };
    return <Badge className={`${r.color} text-white hover:${r.color}`}>{r.icon} {r.label}</Badge>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Members List */}
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6 px-8">
            <div>
              <CardTitle className="text-xl font-black">Members</CardTitle>
              <CardDescription>People with access to your seller dashboard</CardDescription>
            </div>
            {canManageTeam && (
              <Button 
                onClick={() => setIsInviting(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-8 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">User</TableHead>
                  <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Role</TableHead>
                  <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Joined</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((membership) => (
                  <TableRow key={membership.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-slate-50 dark:border-slate-800">
                    <TableCell className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800">
                          <AvatarFallback className="bg-amber-500 text-white font-black">
                            {membership.user.username?.[0] || membership.user.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white capitalize">
                            {membership.user.username || "Seller"}
                          </p>
                          <p className="text-xs text-slate-400">{membership.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {getRoleBadge(membership.role)}
                    </TableCell>
                    <TableCell className="py-4 text-xs text-slate-500">
                      {new Date(membership.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4 pr-8 text-right">
                      {canManageTeam && membership.role !== "owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-slate-100 dark:border-slate-800 shadow-xl">
                            <DropdownMenuItem 
                              onClick={() => {
                                const userName = typeof membership.user === 'object' ? (membership.user.username || membership.user.email) : 'Member';
                                setRoleModalTarget({ id: membership.id, name: userName, currentRole: membership.role });
                                setRoleModalOpen(true);
                              }}
                              className="flex items-center gap-2 font-bold p-3 rounded-lg cursor-pointer text-slate-600 hover:text-amber-500"
                            >
                              <Shield className="h-4 w-4 text-amber-500" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRemoveMember(membership.id)}
                              className="flex items-center gap-2 font-bold p-3 rounded-lg cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {canManageTeam && (
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-6 px-8">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                Pending Invitations
                {invites.length > 0 && (
                  <Badge variant="outline" className="ml-2 font-bold text-amber-500 border-amber-200 bg-amber-50">
                    {invites.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Invites that haven&apos;t been accepted yet</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {invites.length > 0 ? (
                <Table>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id} className="border-slate-50 dark:border-slate-800">
                        <TableCell className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{invite.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {getRoleBadge(invite.role)}
                        </TableCell>
                        <TableCell className="py-4 pr-8 text-right">
                          <Button 
                            onClick={() => handleCancelInvite(invite.id)}
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700">
                    <Mail className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">No Active Invites</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Your pending invitations will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-8">
        {/* Invite Form / Role Info Card */}
        {isInviting ? (
          <Card className="border-none shadow-2xl shadow-amber-500/10 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden sticky top-8">
            <CardHeader className="bg-amber-500 text-white p-8">
              <CardTitle className="text-xl font-black">Invite Someone</CardTitle>
              <CardDescription className="text-amber-100">Add a teammate to your workspace</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <form onSubmit={handleInvite} className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Email Address</Label>
                  <Input 
                    placeholder="teammate@example.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    required
                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl h-12 font-bold px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Assigned Role</Label>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setInviteRoleModalOpen(true)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl h-12 font-extrabold px-4 flex justify-between items-center group hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-500" />
                      <span>{ROLES.find((r) => r.value === inviteData.role)?.label || 'Select Role'}</span>
                    </div>
                    <Plus className="h-4 w-4 text-slate-400 group-hover:rotate-90 transition-transform" />
                  </Button>
                </div>
                <div className="pt-2 flex gap-3">
                   <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black h-12 rounded-xl shadow-lg shadow-amber-500/20"
                  >
                    {isLoading ? "Sending..." : "Send Invite"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsInviting(false)}
                    className="font-black h-12 rounded-xl text-slate-500"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 p-8 sticky top-8">
            <h3 className="text-lg font-black mb-6">About Roles</h3>
            <div className="space-y-5">
              {ROLES.slice(0, 5).map((role) => (
                <div key={role.value} className="flex gap-4 group">
                  <div className={cn("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", role.color)}>
                    <span className="text-xl">{role.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm">{role.label}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-slate-400 italic pt-2 font-medium">And 5 more specialized roles...</p>
            </div>
            {!isInviting && canManageTeam && (
              <Button 
                 onClick={() => setIsInviting(true)}
                 variant="outline"
                 className="w-full mt-8 border-amber-200 text-amber-500 font-black h-12 rounded-xl hover:bg-amber-50"
              >
                Send an Invitation
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Role Selection Modals */}
      <RoleSelectionModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        onSelect={(newRole) => {
          if (roleModalTarget) {
            handleChangeRole(roleModalTarget.id, newRole);
          }
        }}
        currentRole={roleModalTarget?.currentRole}
        memberName={roleModalTarget?.name}
        mode="change"
      />

      <RoleSelectionModal
        isOpen={inviteRoleModalOpen}
        onClose={() => setInviteRoleModalOpen(false)}
        onSelect={(role) => setInviteData({ ...inviteData, role })}
        currentRole={inviteData.role}
        mode="invite"
      />
    </div>
  );
}
