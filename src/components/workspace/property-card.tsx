"use client";

import { useState, useTransition } from "react";
import { Building2, ChevronDown, ChevronUp, Gauge, LoaderCircle, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProperty } from "@/app/dashboard/properties/actions";
import { deleteUnit } from "@/app/dashboard/units/actions";
import type { PropertyRecord, UnitRecord, UnitStatus } from "@/lib/properties";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatMeterReading, propertyColor } from "@/components/workspace/shared";

export function PropertyCard({
  property,
  readOnly,
  onEdit,
  onAddUnit,
  onEditUnit,
}: {
  property: PropertyRecord;
  readOnly: boolean;
  onEdit: (property: PropertyRecord) => void;
  onAddUnit: (property: PropertyRecord) => void;
  onEditUnit: (property: PropertyRecord, unit: UnitRecord) => void;
}) {
  const [deleting, startDeleteTransition] = useTransition();
  const [unitsOpen, setUnitsOpen] = useState(false);
  const location = [property.city, property.state, property.postalCode].filter(Boolean).join(", ");

  function remove() {
    const confirmed = window.confirm(
      `Delete ${property.name}? This will also remove its units, leases, and related payments. This action cannot be undone.`,
    );
    if (!confirmed) return;

    startDeleteTransition(async () => {
      const result = await deleteProperty(property.id);
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <article className="rounded-[20px] border border-[#e7e9ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,29,41,.02)]">
      {readOnly && <Badge variant="outline" className="mb-3">Read-only on One Door</Badge>}
      <div className="flex items-center justify-between">
        <span
          className="grid size-11 place-items-center rounded-xl border"
          style={propertyColor(property.id)}
        >
          <Building2 className="size-5" />
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(property)}
            aria-label={`Edit ${property.name}`}
            title="Edit property"
            className="grid size-9 place-items-center rounded-lg text-[#7f8594] transition hover:bg-[#f2f3f7] hover:text-[#5555c7]"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            aria-label={`Delete ${property.name}`}
            title="Delete property"
            className="grid size-9 place-items-center rounded-lg text-[#9a7a78] transition hover:bg-[#fff0ed] hover:text-[#c65c4d] disabled:opacity-50"
          >
            {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </button>
        </div>
      </div>
      <h2 className="mt-5 truncate font-display text-lg font-bold">{property.name}</h2>
      <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-[#8c92a1]">{property.address}</p>
      <div className="mt-5 flex items-center gap-2 border-t border-[#eff0f4] pt-4 text-xs text-[#7d8494]">
        <MapPin className="size-4 shrink-0 text-[#979dac]" />
        <span className="truncate">{location || "Location not added"}</span>
        <button
          type="button"
          onClick={() => setUnitsOpen((current) => !current)}
          className="ml-auto flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-bold text-[#5b5bd6] hover:bg-[#efeffd]"
        >
          {property.units.length} {property.units.length === 1 ? "unit" : "units"}
          {unitsOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>
      {unitsOpen && (
        <div className="mt-4 border-t border-[#eff0f4] pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#969cab]">Units</p>
            <button
              type="button"
              onClick={() => onAddUnit(property)}
              className="flex items-center gap-1 text-xs font-bold text-[#5b5bd6] hover:text-[#4646b8]"
            >
              <Plus className="size-3.5" /> Add unit
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {property.units.map((item) => (
              <UnitRow
                key={item.id}
                unit={item}
                onEdit={() => onEditUnit(property, item)}
              />
            ))}
            {!property.units.length && (
              <button
                type="button"
                onClick={() => onAddUnit(property)}
                className="w-full rounded-xl border border-dashed border-[#dfe2e9] px-3 py-5 text-xs text-[#858b9a] hover:border-[#bfc2e9] hover:bg-[#fafafd]"
              >
                No units yet. Add the first unit.
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export const unitStatusStyles: Record<UnitStatus, string> = {
  vacant: "bg-[#eef0f9] text-[#626a86]",
  occupied: "bg-[#e8f5ef] text-[#328161]",
  maintenance: "bg-[#fff1e3] text-[#b56d35]",
};

export function UnitRow({ unit, onEdit }: { unit: UnitRecord; onEdit: () => void }) {
  const [deleting, startDeleteTransition] = useTransition();

  function remove() {
    const confirmed = window.confirm(
      `Delete unit ${unit.unitNumber}? Its leases and payment history will also be deleted.`,
    );
    if (!confirmed) return;

    startDeleteTransition(async () => {
      const result = await deleteUnit(unit.id);
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="rounded-xl border border-[#eceef3] bg-[#fafafd] p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-[#343a48]">Unit {unit.unitNumber}</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold capitalize", unitStatusStyles[unit.status])}>
              {unit.status}
            </span>
          </div>
          <p className="mt-1 truncate text-[10px] text-[#8c92a1]">
            {unit.tenant ? unit.tenant.name : "No active tenant"}
            {unit.floor ? ` · Floor ${unit.floor}` : ""}
            {unit.areaSqft !== null ? ` · ${unit.areaSqft} sq ft` : ""}
          </p>
          {unit.openingMeterReading !== null && (
            <p className="mt-1 flex items-center gap-1 text-[10px] text-[#8c92a1]">
              <Gauge className="size-3" /> Opening {formatMeterReading(unit.openingMeterReading)} units
              {unit.openingMeterReadingDate ? ` (${unit.openingMeterReadingDate})` : ""}
              {unit.lastMeterReading !== null ? ` · Latest ${formatMeterReading(unit.lastMeterReading)} units` : ""}
            </p>
          )}
        </div>
        <button type="button" onClick={onEdit} aria-label={`Edit unit ${unit.unitNumber}`} className="grid size-7 place-items-center rounded-md text-[#7f8594] hover:bg-white hover:text-[#5555c7]">
          <Pencil className="size-3.5" />
        </button>
        <button type="button" onClick={remove} disabled={deleting} aria-label={`Delete unit ${unit.unitNumber}`} className="grid size-7 place-items-center rounded-md text-[#9a7a78] hover:bg-[#fff0ed] hover:text-[#c65c4d] disabled:opacity-50">
          {deleting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}
