"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function DashboardFilters({ types, regions }: { types: string[], regions: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Filters</h3>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Vehicle Type:</Label>
          <Select 
            value={searchParams?.get("type") ?? "all"} 
            onValueChange={(val) => handleFilter("type", val || "all")}
          >
            <SelectTrigger className="h-8 w-32 text-xs bg-background/50">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {types.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Status:</Label>
          <Select 
            value={searchParams?.get("status") ?? "all"} 
            onValueChange={(val) => handleFilter("status", val || "all")}
          >
            <SelectTrigger className="h-8 w-32 text-xs bg-background/50">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="ON_TRIP">On Trip</SelectItem>
              <SelectItem value="IN_SHOP">In Shop</SelectItem>
              <SelectItem value="RETIRED">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Region:</Label>
          <Select 
            value={searchParams?.get("region") ?? "all"} 
            onValueChange={(val) => handleFilter("region", val || "all")}
          >
            <SelectTrigger className="h-8 w-32 text-xs bg-background/50">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {regions.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
