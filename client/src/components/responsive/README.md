# Système de Design Mobile-First Universel

Ce dossier contient les composants responsive réutilisables qui s'adaptent automatiquement aux différents breakpoints. Ces composants garantissent une expérience utilisateur optimale sur tous les appareils.

## 📱 Breakpoints

Le système utilise les breakpoints Tailwind standard :

- **Mobile** : < 640px (sm)
- **Tablet** : 640px - 1024px (sm à lg)
- **Desktop** : >= 1024px (lg)

## 🎨 Tokens CSS

Les tokens CSS définis dans `client/src/index.css` assurent la cohérence globale :

```css
--spacing-mobile: 0.5rem;    /* 8px */
--spacing-tablet: 1rem;      /* 16px */
--spacing-desktop: 1.5rem;   /* 24px */

--text-xs-mobile: 0.625rem;  /* 10px */
--text-sm-mobile: 0.75rem;   /* 12px */
--text-base-mobile: 0.875rem; /* 14px */
--text-lg-mobile: 1rem;      /* 16px */

--header-height-mobile: 3.5rem;   /* 56px */
--header-height-tablet: 4rem;     /* 64px */
--header-height-desktop: 5rem;    /* 80px */

--card-padding-mobile: 0.75rem;   /* 12px */
--card-padding-tablet: 1rem;      /* 16px */
--card-padding-desktop: 1.5rem;   /* 24px */

--gap-mobile: 0.5rem;        /* 8px */
--gap-tablet: 1rem;          /* 16px */
--gap-desktop: 1.5rem;       /* 24px */
```

## 🧩 Composants

### ResponsiveHeader

Header universel qui se compacte automatiquement sur mobile.

**Comportement :**
- **Mobile** : Layout vertical, titre tronqué, badge inline, action principale visible, actions secondaires dans menu hamburger
- **Desktop** : Layout horizontal, titre complet, toutes les actions visibles

**Utilisation :**

```tsx
import { ResponsiveHeader } from "@/components/responsive";

<ResponsiveHeader
  title="Mon Dashboard"
  subtitle="Description du dashboard"
  badge={<Badge>Premium</Badge>}
  primaryAction={{
    label: "Action Principale",
    onClick: () => {},
    icon: <Plus className="h-4 w-4" />,
  }}
  secondaryActions={
    <>
      <Button>Action 2</Button>
      <Button>Action 3</Button>
    </>
  }
  backButton={{
    label: "Retour",
    onClick: () => {},
  }}
/>
```

### ResponsiveTabs

Tabs qui deviennent un Select dropdown sur mobile.

**Comportement :**
- **Mobile** : Select natif pour économiser l'espace
- **Desktop** : Tabs horizontales classiques

**Utilisation :**

```tsx
import { ResponsiveTabs } from "@/components/responsive";

<ResponsiveTabs
  defaultValue="menu"
  tabs={[
    {
      value: "menu",
      label: "Menu",
      icon: <Utensils className="h-4 w-4" />,
      content: <MenuContent />,
    },
    {
      value: "settings",
      label: "Paramètres",
      icon: <Settings className="h-4 w-4" />,
      content: <SettingsContent />,
    },
  ]}
/>
```

### ResponsiveTable

Tableau qui se transforme en cards empilées sur mobile.

**Comportement :**
- **Mobile** : Chaque ligne devient une Card verticale
- **Desktop** : Tableau classique avec scroll horizontal si nécessaire

**Utilisation :**

```tsx
import { ResponsiveTable } from "@/components/responsive";

<ResponsiveTable
  columns={[
    { key: "name", label: "Nom" },
    { key: "email", label: "Email" },
    { 
      key: "status", 
      label: "Statut",
      render: (value) => <Badge>{value}</Badge>
    },
  ]}
  data={users}
  keyExtractor={(row) => row.id}
  mobileCardRender={(row) => (
    <div className="space-y-2">
      <div className="font-semibold">{row.name}</div>
      <div className="text-sm text-muted-foreground">{row.email}</div>
      <Badge>{row.status}</Badge>
    </div>
  )}
/>
```

### ResponsiveGrid

Grid adaptatif avec colonnes automatiques selon le breakpoint.

**Comportement :**
- **Mobile** : 1 colonne par défaut
- **Tablet** : 2 colonnes par défaut
- **Desktop** : 3 colonnes par défaut

**Utilisation :**

```tsx
import { ResponsiveGrid } from "@/components/responsive";

<ResponsiveGrid
  cols={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="responsive"
>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</ResponsiveGrid>
```

## 📋 Règles d'Or

1. **Mobile < 640px** : 1 colonne, select, cards, header compact
2. **Tablet 640-1024px** : 2 colonnes, tabs visibles, tableaux compacts
3. **Desktop > 1024px** : 3 colonnes, tout visible, espacements larges

## 🚀 Utilisation dans les Dashboards

Tous les dashboards (présents et futurs) doivent utiliser ces composants pour garantir une expérience responsive cohérente :

```tsx
// ✅ BON
<ResponsiveHeader title="Dashboard" />
<ResponsiveTabs tabs={...} />
<ResponsiveTable data={...} />

// ❌ MAUVAIS
<header className="flex items-center justify-between">
  <h1>Dashboard</h1>
  <Button>Action</Button>
</header>
```

## 🎯 Avantages

- ✅ **Cohérence** : Tous les dashboards ont le même comportement responsive
- ✅ **Maintenabilité** : Un seul endroit pour corriger les bugs responsive
- ✅ **Productivité** : Pas besoin de réinventer la roue à chaque dashboard
- ✅ **Qualité** : Testé et éprouvé sur tous les breakpoints

## 📝 Contribution

Lors de l'ajout de nouveaux dashboards :

1. Importer les composants depuis `@/components/responsive`
2. Utiliser les tokens CSS pour les espacements et tailles de texte
3. Tester sur mobile (375px), tablet (768px) et desktop (1280px)
4. Documenter les cas d'usage spécifiques si nécessaire
