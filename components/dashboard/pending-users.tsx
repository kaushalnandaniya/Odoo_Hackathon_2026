"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { approveUser } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export function PendingUsers({ users }: { users: PendingUser[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleChange = (userId: string, role: UserRole) => {
    setSelectedRoles(prev => ({ ...prev, [userId]: role }));
  };

  const handleApprove = async (userId: string) => {
    const role = selectedRoles[userId];
    if (!role) {
      toast.error("Please select a role first.");
      return;
    }

    setLoadingId(userId);
    try {
      const result = await approveUser(userId, role);
      if (result.success) {
        toast.success("User approved and role assigned!");
      } else {
        toast.error(result.error || "Failed to approve user.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        render={<Button variant="destructive" className="relative h-10 gap-2" />}
      >
        <Users className="h-4 w-4" />
        <span>Approvals</span>
        {users.length > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-destructive text-[10px] font-bold text-destructive">
            {users.length}
          </span>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-destructive">Pending Approvals</DialogTitle>
          <DialogDescription>
            These users have registered but cannot log in until assigned a role.
          </DialogDescription>
        </DialogHeader>
        
        {users.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No pending approval requests right now.
          </div>
        ) : (
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered Date</TableHead>
                  <TableHead>Assign Role</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{new Date(user.createdAt).toISOString().split('T')[0]}</TableCell>
                    <TableCell>
                      <Select 
                        onValueChange={(val) => handleRoleChange(user.id, val as UserRole)}
                        value={selectedRoles[user.id] || ""}
                      >
                        <SelectTrigger className="w-[180px] bg-background">
                          <SelectValue placeholder="Select a role..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRIVER" label="Driver">Driver</SelectItem>
                          <SelectItem value="SAFETY_OFFICER" label="Safety Officer">Safety Officer</SelectItem>
                          <SelectItem value="FINANCIAL_ANALYST" label="Financial Analyst">Financial Analyst</SelectItem>
                          <SelectItem value="FLEET_MANAGER" label="Fleet Manager">Fleet Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="default" 
                        size="sm"
                        disabled={!selectedRoles[user.id] || loadingId === user.id}
                        onClick={() => handleApprove(user.id)}
                      >
                        {loadingId === user.id ? "Approving..." : "Approve"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
