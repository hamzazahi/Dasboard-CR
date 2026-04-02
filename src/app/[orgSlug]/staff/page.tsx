"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  UserPlus,
  Mail,
  Shield,
  MoreHorizontal,
  Trash2,
  UserX,
  UserCheck,
  Loader2,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  orgId: string;
}

export default function StaffManagementPage() {
  const { orgId } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "doctor",
  });

  useEffect(() => {
    if (!orgId) return;

    const q = query(collection(db, "users"), where("orgId", "==", orgId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StaffMember[];

      // Filter out patients so only actual staff members are shown
      const staffMembers = staffData.filter((user) => user.role !== "patient");
      setStaff(staffMembers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orgId]);

  const handleInvite = async () => {
    if (!newStaff.name || !newStaff.email) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, we'd trigger a Cloud Function to create the auth user and send an email.
      // For now, we'll just add the user record to Firestore.
      await addDoc(collection(db, "users"), {
        ...newStaff,
        orgId: orgId,
        isActive: true,
        createdAt: new Date().toISOString(),
        invitationPending: true,
      });

      toast.success(`Invitation sent to ${newStaff.email}`);
      setIsDialogOpen(false);
      setNewStaff({ name: "", email: "", role: "doctor" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to invite staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (member: StaffMember) => {
    try {
      const ref = doc(db, "users", member.id);
      await updateDoc(ref, {
        isActive: !member.isActive,
      });
      toast.success(
        `${member.name} has been ${!member.isActive ? "activated" : "deactivated"}`,
      );
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredStaff = staff.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Staff Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your organization's doctors, nurses, and administrative team.
          </p>
        </div>
        <Button
          className="font-semibold shadow-sm"
          onClick={() => setIsDialogOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add Staff Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Staff", value: staff.length, icon: Shield },
          {
            label: "Active Specialists",
            value: staff.filter(
              (s) =>
                (s.role === "doctor" || s.role === "Specialist") && s.isActive,
            ).length,
            icon: UserCheck,
          },
          {
            label: "Active Admins",
            value: staff.filter((s) => s.role === "org_admin" && s.isActive)
              .length,
            icon: Shield,
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {stat.value}
                    </p>
                  )}
                </div>
                <stat.icon className="h-5 w-5 text-primary opacity-70" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email or role..."
                className="pl-10 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30 dark:bg-slate-900/30">
              <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">
                  Staff Member
                </TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">
                  Role
                </TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">
                  Status
                </TableHead>
                <TableHead className="w-[100px] text-right pr-6">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-slate-500"
                  >
                    No staff members found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => (
                  <TableRow
                    key={member.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800"
                  >
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-50">
                          {member.name}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {member.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none px-2 shadow-none">
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-none px-2 shadow-none"
                        >
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-4 pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                        onClick={() => toggleStatus(member)}
                      >
                        {member.isActive ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Invite a new member to your organization's team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Dr. John Smith"
                value={newStaff.name}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={newStaff.email}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">System Role</Label>
              <Select
                value={newStaff.role}
                onValueChange={(val) => setNewStaff({ ...newStaff, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor / Specialist</SelectItem>
                  <SelectItem value="nurse">Nurse / Practitioner</SelectItem>
                  <SelectItem value="org_admin">Organization Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
