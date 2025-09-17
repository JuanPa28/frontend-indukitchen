export interface UserPreferences {
  userPreferences: string;  // Las preferencias del usuario como texto
}

export interface ProductSuggestion {
  id?: number;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;
  // Otros campos que pueda retornar la API
}

export interface SuggestionResponse {
  suggestions?: ProductSuggestion[];
  message?: string;
  // Respuesta del agente IA
}
