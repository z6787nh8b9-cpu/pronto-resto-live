import { useState } from "react";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Español", flag: "🇪🇸" },
] as const;

export type LanguageCode = "fr" | "en" | "it" | "de" | "es";

interface LanguageSelectorProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  className?: string;
}

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  className = "",
}: LanguageSelectorProps) {
  const currentLang = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Langue : ${currentLang.name}`}
          className={`gap-2 ${className}`}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.name}</span>
          <span className="sm:hidden">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onLanguageChange(lang.code as LanguageCode)}
            className="gap-2 cursor-pointer"
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.name}</span>
            {lang.code === currentLanguage && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
