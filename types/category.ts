export interface LocalizedText {
  az: string;
  ru: string;
< cursor/fix-all-code-errors-3f0d
  // English is optional because the app currently supports 'az' and 'ru'.
  // When English is unavailable in static data, UI will fall back gracefully.

> main
  en?: string;
}

export interface Subcategory {
  id: number;
  name: LocalizedText;
  subcategories?: Subcategory[];
}

export interface Category {
  id: number;
  name: LocalizedText;
  icon: string;
  subcategories: Subcategory[];
}