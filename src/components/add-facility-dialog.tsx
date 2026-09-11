import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFacility, type FacilityDto } from "@/lib/facilities-api";
import { typesForPurpose } from "@/lib/facilities";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { FacilityPurpose } from "@vayura/api-contracts/common";

type Props = {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCountry?: string;
  defaultPurpose?: FacilityPurpose;
  clientName?: string;
  onCreated?: (facility: FacilityDto) => void;
};

export function AddFacilityDialog({
  orgId,
  open,
  onOpenChange,
  defaultCountry = "India",
  defaultPurpose = "operations",
  clientName,
  onCreated,
}: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState<FacilityPurpose>(defaultPurpose);
  const [type, setType] = useState<string>(typesForPurpose(defaultPurpose)[0]);
  const [country, setCountry] = useState(defaultCountry);
  const [address, setAddress] = useState("");
  const [employees, setEmployees] = useState("");

  const reset = (nextPurpose = defaultPurpose) => {
    setName("");
    setPurpose(nextPurpose);
    setType(typesForPurpose(nextPurpose)[0]);
    setCountry(defaultCountry);
    setAddress("");
    setEmployees("");
  };

  useEffect(() => {
    if (!open) return;
    reset(defaultPurpose);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when the dialog opens for a purpose
  }, [open, defaultPurpose, defaultCountry]);

  const mutation = useMutation({
    mutationFn: () =>
      createFacility(orgId, {
        name,
        type,
        purpose,
        address,
        country,
        employees: employees ? Number(employees) : 0,
      }),
    onSuccess: async (facility) => {
      await queryClient.invalidateQueries({ queryKey: ["facilities", orgId] });
      toast({
        title: purpose === "generation" ? "Generation site added" : "Facility added",
        description:
          purpose === "generation"
            ? `${facility.name} is in the generation / offset boundary.`
            : `${facility.name} is in the reporting boundary.`,
      });
      onCreated?.(facility);
      onOpenChange(false);
    },
    onError: (e) => {
      const message =
        e instanceof ApiRequestError ? e.message : "Could not add facility.";
      toast({ title: "Could not add facility", description: message, variant: "destructive" });
    },
  });

  const canSubmit = name.trim().length >= 2 && type.trim().length > 0 && !mutation.isPending;
  const isGeneration = purpose === "generation";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset(defaultPurpose);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isGeneration ? "Add a generation / offset site" : "Add a facility"}</DialogTitle>
          <DialogDescription>
            {isGeneration
              ? `Solar, wind, hydro, or captive power used to reduce residual emissions${clientName ? ` for ${clientName}` : ""}. Exported generation is not netted off the BRSR total.`
              : `Add an operational location${clientName ? ` to ${clientName}'s reporting boundary` : " to this client's reporting boundary"}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm">Site role</Label>
            <Select
              value={purpose}
              onValueChange={(v) => {
                const next = v as FacilityPurpose;
                setPurpose(next);
                setType(typesForPurpose(next)[0]);
              }}
            >
              <SelectTrigger className="mt-1" data-testid="select-facility-purpose">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operations">Operations (consumes energy)</SelectItem>
                <SelectItem value="generation">Generation / offset (produces energy)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Facility name</Label>
            <Input
              className="mt-1"
              placeholder={isGeneration ? "e.g. Hosur rooftop solar" : "e.g. Chennai R&D Center"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-facility-name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1" data-testid="select-facility-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typesForPurpose(purpose).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Country</Label>
              <Input
                className="mt-1"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                data-testid="input-facility-country"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm">Address</Label>
            <Input
              className="mt-1"
              placeholder="Street, city, state, PIN"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              data-testid="input-facility-address"
            />
          </div>
          {!isGeneration && (
            <div>
              <Label className="text-sm">Approximate employees</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                placeholder="0"
                value={employees}
                onChange={(e) => setEmployees(e.target.value)}
                data-testid="input-facility-employees"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            data-testid="button-confirm-add-facility"
          >
            {mutation.isPending ? "Adding..." : isGeneration ? "Add generation site" : "Add facility"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
