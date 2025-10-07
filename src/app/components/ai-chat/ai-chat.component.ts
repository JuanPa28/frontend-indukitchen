import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuggestionService } from '../../services/suggestion/suggestion.service';
import { LocalCartService } from '../../services/cart/local-cart.service';

interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: any[];
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss'],
})
export class AiChatComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isExpanded = false;
  currentMessage = '';
  isLoading = false;
  isAddingToCart = false;
  messages: ChatMessage[] = [];

  constructor(
    private readonly suggestionService: SuggestionService,
    private readonly localCartService: LocalCartService
  ) {}

  ngOnInit() {
    this.messages.push({
      type: 'bot',
      content:
        '¡Hola! 👋 Soy tu asistente de IA. Cuéntame qué tipo de productos buscas y te daré recomendaciones personalizadas.',
      timestamp: new Date(),
    });
  }

  toggleChat() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: this.currentMessage,
      timestamp: new Date(),
    };

    this.messages.push(userMessage);
    const userPreferences = this.currentMessage;
    this.currentMessage = '';
    this.isLoading = true;

    setTimeout(() => this.scrollToBottom(), 100);

    this.suggestionService.getSuggestions(userPreferences).subscribe({
      next: (response) => {
        console.log('✅ Respuesta de IA recibida:', response);

        const botMessage: ChatMessage = {
          type: 'bot',
          content:
            response.message || 'Aquí tienes algunas recomendaciones basadas en tus preferencias:',
          timestamp: new Date(),
          suggestions: response.suggestions || [],
        };

        this.messages.push(botMessage);
        this.isLoading = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('❌ Error al obtener sugerencias:', error);

        const errorMessage: ChatMessage = {
          type: 'bot',
          content:
            'Lo siento, hubo un error al obtener las recomendaciones. Por favor, intenta nuevamente.',
          timestamp: new Date(),
        };

        this.messages.push(errorMessage);
        this.isLoading = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
    });
  }

  addToCart(product: any) {
    this.isAddingToCart = true;

    try {
      const success = this.localCartService.addProduct(product, 1);

      if (success) {
        console.log('✅ Producto agregado al carrito desde IA:', product.nombre);

        const confirmationMessage: ChatMessage = {
          type: 'bot',
          content: `✅ ¡Perfecto! He agregado "${product.nombre}" a tu carrito.`,
          timestamp: new Date(),
        };

        this.messages.push(confirmationMessage);
        setTimeout(() => this.scrollToBottom(), 100);
      } else {
        throw new Error('No se pudo agregar el producto');
      }
    } catch (error: any) {
      console.error('❌ Error al agregar producto:', error);

      const errorMessage: ChatMessage = {
        type: 'bot',
        content: 'Lo siento, hubo un error al agregar el producto al carrito.',
        timestamp: new Date(),
      };

      this.messages.push(errorMessage);
      setTimeout(() => this.scrollToBottom(), 100);
    } finally {
      this.isAddingToCart = false;
    }
  }

  handleImageError(event: any) {
    const placeholder =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyOCwyNS41MjI5IDI4IDMwIDIzLjUyMjkgMzAgMThDMzAgMTIuNDc3MSAyNS41MjI5IDggMjAgOEMxNC40NzcxIDggMTAgMTIuNDc3MSAxMCAxOEMxMCAyMy41MjI5IDE0LjQ3NzEgMjggMjAgMjhaIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0yMCAyMkMyMS42NTY5IDIyIDIzIDIwLjY1NjkgMjMgMTlDMjMgMTcuMzQzMSAyMS42NTY5IDE2IDIwIDE2QzE4LjM0MzEgMTYgMTcgMTcuMzQzMSAxNyAxOUMxNyAyMC42NTY5IDE4LjM0MzEgMjIgMjAgMjJaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
    event.target.src = placeholder;
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    }
  }
}
