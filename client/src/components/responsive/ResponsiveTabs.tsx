import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Tab {
  value: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface ResponsiveTabsProps {
  tabs: Tab[];
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

/**
 * ResponsiveTabs - Tabs qui deviennent un Select sur mobile
 * 
 * Mobile (< 640px):
 * - Select natif pour économiser l'espace
 * - Dropdown avec toutes les options
 * 
 * Desktop (>= 640px):
 * - Tabs horizontales classiques
 * - Toutes visibles
 */
export function ResponsiveTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
}: ResponsiveTabsProps) {
  const currentValue = value || defaultValue;

  return (
    <Tabs value={currentValue} onValueChange={onValueChange} defaultValue={defaultValue} className="w-full">
      {/* Mobile: Select dropdown */}
      <div className="sm:hidden mb-4">
        <Select value={currentValue} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {tabs.find(tab => tab.value === currentValue)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                <div className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tabs horizontales */}
      <TabsList className="hidden sm:inline-flex w-full sm:w-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Content for all tabs */}
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
