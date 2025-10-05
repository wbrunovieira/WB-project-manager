"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelSelectorProps {
  availableLabels: Label[];
  selectedLabelIds: string[];
  onLabelsChange: (labelIds: string[]) => void;
  onCreateLabel?: (name: string, color: string) => Promise<Label>;
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

export function LabelSelector({
  availableLabels,
  selectedLabelIds,
  onLabelsChange,
  onCreateLabel,
}: LabelSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      onLabelsChange([...selectedLabelIds, labelId]);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !onCreateLabel) return;

    setIsSubmitting(true);
    try {
      const newLabel = await onCreateLabel(newLabelName.trim(), newLabelColor);
      onLabelsChange([...selectedLabelIds, newLabel.id]);
      setNewLabelName("");
      setNewLabelColor(PRESET_COLORS[0]);
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create label:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {availableLabels.map((label) => {
          const isSelected = selectedLabelIds.includes(label.id);
          return (
            <button
              key={label.id}
              type="button"
              onClick={() => toggleLabel(label.id)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all"
              style={{
                backgroundColor: isSelected ? label.color : `${label.color}20`,
                color: isSelected ? "#ffffff" : label.color,
                border: `1px solid ${label.color}`,
              }}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {label.name}
            </button>
          );
        })}

        {!isCreating && onCreateLabel && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900"
          >
            <Plus className="h-3 w-3" />
            New label
          </button>
        )}
      </div>

      {isCreating && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Label name"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateLabel();
                } else if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewLabelName("");
                }
              }}
              autoFocus
              disabled={isSubmitting}
            />

            <div>
              <p className="text-xs text-gray-600 mb-2">Choose a color:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewLabelColor(color)}
                    className="h-6 w-6 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: newLabelColor === color ? "#000" : color,
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
              onClick={handleCreateLabel}
              disabled={!newLabelName.trim() || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setNewLabelName("");
                setNewLabelColor(PRESET_COLORS[0]);
              }}
              disabled={isSubmitting}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
