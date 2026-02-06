"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Feature {
  id: string;
  name: string;
  color?: string | null;
}

interface FeatureSelectorProps {
  availableFeatures: Feature[];
  selectedFeatureId: string | null;
  onFeatureChange: (featureId: string | null) => void;
  onCreateFeature?: (name: string, color: string) => Promise<Feature>;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
];

export function FeatureSelector({
  availableFeatures,
  selectedFeatureId,
  onFeatureChange,
  onCreateFeature,
}: FeatureSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureColor, setNewFeatureColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateFeature = async () => {
    if (!newFeatureName.trim() || !onCreateFeature) return;

    setIsSubmitting(true);
    try {
      const newFeature = await onCreateFeature(newFeatureName.trim(), newFeatureColor);
      onFeatureChange(newFeature.id);
      setNewFeatureName("");
      setNewFeatureColor(PRESET_COLORS[0]);
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create feature:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCreating) {
    return (
      <div className="rounded-lg border border-[#792990]/30 bg-[#792990]/10 p-3 space-y-3">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Feature name (e.g., Authentication)"
            value={newFeatureName}
            onChange={(e) => setNewFeatureName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateFeature();
              } else if (e.key === "Escape") {
                setIsCreating(false);
                setNewFeatureName("");
              }
            }}
            autoFocus
            disabled={isSubmitting}
            className="bg-[#792990]/10 border-[#792990]/30 text-gray-100 placeholder:text-gray-400 focus:border-[#FFB947] focus:ring-[#FFB947]"
          />

          <div>
            <p className="text-xs text-gray-400 mb-2">Choose a color:</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewFeatureColor(color)}
                  className="h-6 w-6 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: newFeatureColor === color ? "#FFB947" : color,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleCreateFeature}
            disabled={!newFeatureName.trim() || isSubmitting}
            className="bg-[#FFB947] text-gray-900 hover:bg-[#FFB947]/90"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setIsCreating(false);
              setNewFeatureName("");
              setNewFeatureColor(PRESET_COLORS[0]);
            }}
            disabled={isSubmitting}
            className="border-[#792990]/40 text-gray-300 hover:bg-[#792990]/10"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={selectedFeatureId || ""}
        onChange={(e) => onFeatureChange(e.target.value || null)}
        className="flex-1 h-10 rounded-md border border-[#792990]/30 bg-[#792990]/10 px-3 py-2 text-sm text-gray-100 focus:border-[#FFB947] focus:outline-none focus:ring-2 focus:ring-[#FFB947]"
      >
        <option value="">No feature</option>
        {availableFeatures.map((feature) => (
          <option key={feature.id} value={feature.id}>
            {feature.name}
          </option>
        ))}
      </select>

      {onCreateFeature && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsCreating(true)}
          className="border-[#792990]/40 text-gray-300 hover:bg-[#792990]/10 hover:border-[#792990]/60 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
