"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { approveUser } from "@/lib/actions/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export function PendingUsers({ users }: { users: PendingUser[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});

  if (users.length === 0) return null;

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
    <Card className="mt-8 border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">Pending Approvals</CardTitle>
        <CardDescription>
          These users have registered but cannot log in until assigned a role.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                      <SelectItem value="DRIVER">Driver</SelectItem>
                      <SelectItem value="SAFETY_OFFICER">Safety Officer</SelectItem>
                      <SelectItem value="FINANCIAL_ANALYST">Financial Analyst</SelectItem>
                      <SelectItem value="FLEET_MANAGER">Fleet Manager</SelectItem>
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
      </CardContent>
    </Card>
  );
}
