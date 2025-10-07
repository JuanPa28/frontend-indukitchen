import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AiChatComponent } from './ai-chat.component';
import { SuggestionService } from '../../services/suggestion/suggestion.service';
import { LocalCartService } from '../../services/cart/local-cart.service';

interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: any[];
}

const expectMessages = (messages: ChatMessage[]) => ({
  toHaveLength(expected: number) {
    expect(messages.length).withContext('message count').toBe(expected);
    return this;
  },
  toHaveLastMessageOfType(expected: ChatMessage['type']) {
    expect(messages[messages.length - 1].type)
      .withContext('last message type')
      .toBe(expected);
    return this;
  },
  toContainText(text: string) {
    expect(messages.some((m) => m.content.includes(text)))
      .withContext(`messages containing "${text}"`)
      .toBeTrue();
    return this;
  },
  toHaveLastSuggestionsCount(expected: number) {
    const last = messages[messages.length - 1];
    expect((last.suggestions ?? []).length)
      .withContext('last message suggestions count')
      .toBe(expected);
    return this;
  },
});

const createProductDouble = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  nombre: 'Producto demo',
  descripcion: 'Descripción demo',
  precio: 10,
  existencia: 5,
  peso: 0.5,
  imagen: 'demo.jpg',
  ...overrides,
});

describe('AiChatComponent', () => {
  let component: AiChatComponent;
  let fixture: ComponentFixture<AiChatComponent>;
  let suggestionService: jasmine.SpyObj<SuggestionService>;
  let localCartService: jasmine.SpyObj<LocalCartService>;

  beforeEach(async () => {
    suggestionService = jasmine.createSpyObj<SuggestionService>('SuggestionService', [
      'getSuggestions',
    ]);
    localCartService = jasmine.createSpyObj<LocalCartService>('LocalCartService', ['addProduct']);

    await TestBed.configureTestingModule({
      imports: [AiChatComponent],
      providers: [
        { provide: SuggestionService, useValue: suggestionService },
        { provide: LocalCartService, useValue: localCartService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiChatComponent);
    component = fixture.componentInstance;
    component['messagesContainer'] = { nativeElement: { scrollTop: 0, scrollHeight: 0 } } as any;
    fixture.detectChanges();
  });

  it('should enqueue bot greeting on init', () => {
    // Arrange

    // Act
    const greeting = component.messages[0];

    // Assert
    expect(greeting.type).toBe('bot');
    expect(greeting.content).toContain('asistente de IA');
  });

  it('sendMessage should append bot reply from service', fakeAsync(() => {
    // Arrange
    suggestionService.getSuggestions.and.returnValue(
      of({ message: 'Aquí tienes ollas', suggestions: [] })
    );
    component.currentMessage = 'Busco ollas';

    // Act
    component.sendMessage();
    tick(150);

    // Assert
    expect(suggestionService.getSuggestions).toHaveBeenCalledWith('Busco ollas');
    expect(component.isLoading).toBeFalse();
    expectMessages(component.messages)
      .toHaveLength(3)
      .toHaveLastMessageOfType('bot')
      .toContainText('Aquí tienes ollas');
  }));

  it('sendMessage should append fallback message on error', fakeAsync(() => {
    // Arrange
    suggestionService.getSuggestions.and.returnValue(throwError(() => new Error('boom')));
    component.currentMessage = 'Busco licuadora';

    // Act
    component.sendMessage();
    tick(150);

    // Assert
    expect(component.isLoading).toBeFalse();
    expectMessages(component.messages).toHaveLastMessageOfType('bot').toContainText('Lo siento');
  }));

  it('addToCart should append confirmation when cart accepts product', fakeAsync(() => {
    // Arrange
    const product = createProductDouble({ nombre: 'Sartén', precio: 25 });
    localCartService.addProduct.and.returnValue(true);

    // Act
    component.addToCart(product);
    tick(150);

    // Assert
    expect(localCartService.addProduct).toHaveBeenCalledWith(
      jasmine.objectContaining({ nombre: 'Sartén' }),
      1
    );
    expect(component.isAddingToCart).toBeFalse();
    expectMessages(component.messages).toHaveLastMessageOfType('bot').toContainText('Sartén');
  }));

  it('addToCart should append error message when cart rejects product', fakeAsync(() => {
    // Arrange
    const product = createProductDouble({ nombre: 'Tostadora', precio: 40 });
    localCartService.addProduct.and.returnValue(false);

    // Act
    component.addToCart(product);
    tick(150);

    // Assert
    expect(localCartService.addProduct).toHaveBeenCalledWith(
      jasmine.objectContaining({ nombre: 'Tostadora' }),
      1
    );
    expect(component.isAddingToCart).toBeFalse();
    expectMessages(component.messages)
      .toHaveLastMessageOfType('bot')
      .toContainText('error al agregar');
  }));

  it('handleImageError should set placeholder image', () => {
    // Arrange
    const event = { target: { src: '' } };

    // Act
    component.handleImageError(event);

    // Assert
    expect(event.target.src).toContain('data:image/svg+xml');
  });

  it('toggleChat should expand and scroll when opening', fakeAsync(() => {
    // Arrange
    const scrollSpy = spyOn<any>(component, 'scrollToBottom');

    // Act
    component.toggleChat();
    tick(150);

    // Assert
    expect(component.isExpanded).toBeTrue();
    expect(scrollSpy).toHaveBeenCalled();
  }));

  it('toggleChat should collapse without scrolling when closing', () => {
    // Arrange
    const scrollSpy = spyOn<any>(component, 'scrollToBottom');
    component.isExpanded = true;

    // Act
    component.toggleChat();

    // Assert
    expect(component.isExpanded).toBeFalse();
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('sendMessage should ignore blank messages', () => {
    // Arrange
    component.currentMessage = '   ';

    // Act
    component.sendMessage();

    // Assert
    expect(suggestionService.getSuggestions).not.toHaveBeenCalled();
  });

  it('sendMessage should ignore messages while loading', () => {
    // Arrange
    component.currentMessage = 'Hola';
    component.isLoading = true;

    // Act
    component.sendMessage();

    // Assert
    expect(suggestionService.getSuggestions).not.toHaveBeenCalled();
  });

  it('sendMessage should use fallback text and suggestions when response is empty', fakeAsync(() => {
    // Arrange
    suggestionService.getSuggestions.and.returnValue(of({}));
    component.currentMessage = 'Recomiéndame algo';

    // Act
    component.sendMessage();
    tick(150);

    // Assert
    expect(component.isLoading).toBeFalse();
    expectMessages(component.messages)
      .toHaveLastMessageOfType('bot')
      .toContainText('Aquí tienes algunas recomendaciones basadas en tus preferencias:')
      .toHaveLastSuggestionsCount(0);
  }));

  it('scrollToBottom should sync scrollTop with scrollHeight', () => {
    // Arrange
    const nativeElement = { scrollTop: 0, scrollHeight: 420 };
    component['messagesContainer'] = { nativeElement } as any;

    // Act
    (component as any).scrollToBottom();

    // Assert
    expect(nativeElement.scrollTop).toBe(420);
  });
});
