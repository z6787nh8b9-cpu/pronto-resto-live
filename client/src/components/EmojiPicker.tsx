import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const CATEGORY_EMOJIS = [
  { emoji: "🥗", label: "Entrées/Salades" },
  { emoji: "🍽️", label: "Plats" },
  { emoji: "🍕", label: "Pizzas" },
  { emoji: "🍝", label: "Pâtes" },
  { emoji: "🥩", label: "Viandes" },
  { emoji: "🐟", label: "Poissons" },
  { emoji: "🍔", label: "Hamburgers" },
  { emoji: "🌮", label: "Tacos/Mexicain" },
  { emoji: "🍜", label: "Soupes/Ramen" },
  { emoji: "🍱", label: "Asiatique" },
  { emoji: "🍰", label: "Desserts/Pâtisseries" },
  { emoji: "🍨", label: "Glaces" },
  { emoji: "🧁", label: "Cupcakes/Muffins" },
  { emoji: "🍷", label: "Vins" },
  { emoji: "🍺", label: "Bières" },
  { emoji: "🍹", label: "Cocktails" },
  { emoji: "☕", label: "Café/Thé" },
  { emoji: "🥤", label: "Boissons fraîches" },
  { emoji: "🥂", label: "Apéritifs/Champagne" },
  { emoji: "🧀", label: "Fromages" },
  { emoji: "🥖", label: "Pains/Boulangerie" },
  { emoji: "🥐", label: "Viennoiseries" },
  { emoji: "🍳", label: "Petit-déjeuner" },
  { emoji: "🥪", label: "Sandwichs" },
  { emoji: "🌯", label: "Wraps" },
  { emoji: "🍴", label: "Général" },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPicker({ value, onChange, disabled }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-20 h-20 text-4xl hover:scale-105 transition-transform"
          disabled={disabled}
        >
          {value || "🍴"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Choisir un emoji</h4>
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_EMOJIS.map(({ emoji, label }) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-accent rounded-md transition-colors"
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
