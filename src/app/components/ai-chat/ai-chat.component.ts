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
  template: `
    <div class="chat-container" [class.expanded]="isExpanded">
      <!-- Chat Toggle Button -->
      <button
        *ngIf="!isExpanded"
        class="chat-toggle-btn"
        (click)="toggleChat()"
        aria-label="Abrir chat de recomendaciones">
        <span class="chat-icon">🤖</span>
        <span class="chat-text">Recomendaciones IA</span>
      </button>

      <!-- Chat Window -->
      <div *ngIf="isExpanded" class="chat-window">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-title">
            <span class="bot-avatar">🤖</span>
            <div>
              <h3>Asistente IA</h3>
              <p>Recomendaciones personalizadas</p>
            </div>
          </div>
          <button class="close-btn" (click)="toggleChat()" aria-label="Cerrar chat">×</button>
        </div>

        <!-- Chat Messages -->
        <div class="chat-messages" #messagesContainer>
          <div *ngFor="let message of messages"
               class="message"
               [class.user-message]="message.type === 'user'"
               [class.bot-message]="message.type === 'bot'">

            <div class="message-content">
              <p>{{ message.content }}</p>

              <!-- Sugerencias de productos -->
              <div *ngIf="message.suggestions && message.suggestions.length > 0" class="suggestions">
                <div *ngFor="let product of message.suggestions" class="suggestion-card">
                  <img [src]="product.imagen || '/assets/placeholder-product.jpg'"
                       [alt]="product.nombre"
                       (error)="handleImageError($event)"
                       class="suggestion-image">
                  <div class="suggestion-info">
                    <h4>{{ product.nombre }}</h4>
                    <p class="price">\${{ product.precio | number:'1.0-0' }}</p>
                    <button
                      class="add-btn"
                      (click)="addToCart(product)"
                      [disabled]="isAddingToCart">
                      <span *ngIf="!isAddingToCart">+ Agregar</span>
                      <span *ngIf="isAddingToCart">...</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="message-time">
              {{ message.timestamp | date:'short' }}
            </div>
          </div>

          <!-- Loading indicator -->
          <div *ngIf="isLoading" class="message bot-message">
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="chat-input">
          <input
            type="text"
            [(ngModel)]="currentMessage"
            (keyup.enter)="sendMessage()"
            placeholder="Describe lo que buscas..."
            [disabled]="isLoading"
            class="message-input">
          <button
            (click)="sendMessage()"
            [disabled]="isLoading || !currentMessage.trim()"
            class="send-btn">
            📤
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 1000;
    }

    .chat-toggle-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 25px;
      padding: 12px 20px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .chat-toggle-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(99, 102, 241, 0.4);
    }

    .chat-icon {
      font-size: 20px;
    }

    .chat-text {
      font-size: 14px;
    }

    .chat-window {
      width: 380px;
      height: 500px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }

    .chat-header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bot-avatar {
      font-size: 24px;
    }

    .chat-title h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .chat-title p {
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }

    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      display: flex;
      flex-direction: column;
    }

    .user-message {
      align-items: flex-end;
    }

    .bot-message {
      align-items: flex-start;
    }

    .message-content {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 16px;
      background: #f3f4f6;
      margin-bottom: 4px;
    }

    .user-message .message-content {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }

    .message-content p {
      margin: 0;
      font-size: 14px;
      line-height: 1.4;
    }

    .message-time {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }

    .suggestions {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .suggestion-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      gap: 8px;
      align-items: center;
      transition: box-shadow 0.2s ease;
    }

    .suggestion-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .suggestion-image {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
    }

    .suggestion-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .suggestion-info h4 {
      margin: 0;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }

    .price {
      margin: 0;
      font-size: 11px;
      color: #059669;
      font-weight: 600;
    }

    .add-btn {
      background: #059669;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 10px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .add-btn:hover:not(:disabled) {
      background: #047857;
    }

    .add-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .typing-indicator span {
      width: 6px;
      height: 6px;
      background: #6b7280;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }

    .chat-input {
      border-top: 1px solid #e5e7eb;
      padding: 16px;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .message-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .message-input:focus {
      border-color: #6366f1;
    }

    .send-btn {
      background: #6366f1;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }

    .send-btn:hover:not(:disabled) {
      background: #5b59e8;
    }

    .send-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .chat-window {
        width: calc(100vw - 40px);
        height: 400px;
      }
    }
  `]
})
export class AiChatComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isExpanded = false;
  currentMessage = '';
  isLoading = false;
  isAddingToCart = false;
  messages: ChatMessage[] = [];

  constructor(
    private suggestionService: SuggestionService,
    private localCartService: LocalCartService
  ) {}

  ngOnInit() {
    // Mensaje de bienvenida
    this.messages.push({
      type: 'bot',
      content: '¡Hola! 👋 Soy tu asistente de IA. Cuéntame qué tipo de productos buscas y te daré recomendaciones personalizadas.',
      timestamp: new Date()
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
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const userPreferences = this.currentMessage;
    this.currentMessage = '';
    this.isLoading = true;

    setTimeout(() => this.scrollToBottom(), 100);

    // Llamar a la API de sugerencias
    this.suggestionService.getSuggestions(userPreferences).subscribe({
      next: (response) => {
        console.log('✅ Respuesta de IA recibida:', response);

        const botMessage: ChatMessage = {
          type: 'bot',
          content: response.message || 'Aquí tienes algunas recomendaciones basadas en tus preferencias:',
          timestamp: new Date(),
          suggestions: response.suggestions || []
        };

        this.messages.push(botMessage);
        this.isLoading = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('❌ Error al obtener sugerencias:', error);

        const errorMessage: ChatMessage = {
          type: 'bot',
          content: 'Lo siento, hubo un error al obtener las recomendaciones. Por favor, intenta nuevamente.',
          timestamp: new Date()
        };

        this.messages.push(errorMessage);
        this.isLoading = false;
        setTimeout(() => this.scrollToBottom(), 100);
      }
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
          timestamp: new Date()
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
        timestamp: new Date()
      };

      this.messages.push(errorMessage);
      setTimeout(() => this.scrollToBottom(), 100);
    } finally {
      this.isAddingToCart = false;
    }
  }

  handleImageError(event: any) {
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyOEMyNS41MjI5IDI4IDMwIDIzLjUyMjkgMzAgMThDMzAgMTIuNDc3MSAyNS41MjI5IDggMjAgOEMxNC40NzcxIDggMTAgMTIuNDc3MSAxMCAxOEMxMCAyMy41MjI5IDE0LjQ3NzEgMjggMjAgMjhaIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0yMCAyMkMyMS42NTY5IDIyIDIzIDIwLjY1NjkgMjMgMTlDMjMgMTcuMzQzMSAyMS42NTY5IDE2IDIwIDE2QzE4LjM0MzEgMTYgMTcgMTcuMzQzMSAxNyAxOUMxNyAyMC42NTY5IDE4LjM0MzEgMjIgMjAgMjJaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
    event.target.src = placeholder;
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }
}
