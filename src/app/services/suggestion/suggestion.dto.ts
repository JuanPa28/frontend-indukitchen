export interface UserPreferences {
  userPreferences: string;
}

export interface ProductSuggestion {
  id?: number;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;
}

export interface SuggestionResponse {
  suggestions?: ProductSuggestion[];
  message?: string;
}
