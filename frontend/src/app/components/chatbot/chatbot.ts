import { Component, ElementRef, ViewChild, inject, AfterViewChecked, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface ChatMessage {
  text: string;
  isBot: boolean;
  time: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  template: `
    <!-- FLOATING BUTTON -->
    <button class="chatbot-toggle" (click)="toggleChat()" [class.open]="isOpen">
      <span class="chat-icon" *ngIf="!isOpen">💬</span>
      <span class="close-icon" *ngIf="isOpen">✕</span>
      <div class="pulse-ring" *ngIf="!isOpen"></div>
    </button>

    <!-- CHAT PANEL -->
    <div class="chat-panel" [class.open]="isOpen">
      <!-- Header -->
      <div class="chat-header">
        <div class="bot-info">
          <div class="bot-avatar">🤖</div>
          <div>
            <h3>Assistant IA OMNILOG</h3>
            <span class="bot-status">En ligne</span>
          </div>
        </div>
        <button class="close-btn" (click)="toggleChat()">✕</button>
      </div>

      <!-- Messages Area -->
      <div class="chat-messages" #scrollMe>
        <div class="message-wrapper" *ngFor="let msg of messages" [ngClass]="{'bot-msg': msg.isBot, 'user-msg': !msg.isBot}">
          <div class="message-bubble">
            <p>{{ msg.text }}</p>
            <span class="message-time">{{ msg.time }}</span>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div class="message-wrapper bot-msg" *ngIf="isTyping">
          <div class="message-bubble typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" 
               placeholder="Posez votre question ici..." class="chat-input">
        <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim() || isTyping">
          ➤
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* TOGGLE BUTTON */
    .chatbot-toggle {
      position: fixed; bottom: 2rem; right: 2rem; width: 60px; height: 60px;
      border-radius: 50%; border: none; cursor: pointer; z-index: 9999;
      background: linear-gradient(135deg, var(--primary), #7c3aed); color: white;
      font-size: 1.5rem; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 25px rgba(0, 86, 224, 0.3); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .chatbot-toggle:hover { transform: scale(1.1); }
    .chatbot-toggle.open { background: var(--white); color: var(--primary); box-shadow: var(--shadow-lg); border: 1px solid rgba(0, 86, 224, 0.15); }
    .pulse-ring {
      position: absolute; width: 100%; height: 100%; border-radius: 50%;
      border: 2px solid var(--primary); animation: pulse 2s infinite; opacity: 0; pointer-events: none;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    /* CHAT PANEL */
    .chat-panel {
      position: fixed; bottom: 6rem; right: 2rem; width: 350px; height: 500px;
      background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 86, 224, 0.15); border-radius: 20px;
      display: flex; flex-direction: column; overflow: hidden; z-index: 9998;
      box-shadow: var(--shadow-lg), 0 10px 30px rgba(0, 86, 224, 0.04);
      transform: translateY(20px) scale(0.95); opacity: 0; pointer-events: none;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: bottom right;
    }
    .chat-panel.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: all; }

    /* HEADER */
    .chat-header {
      padding: 1.2rem; background: rgba(0, 86, 224, 0.05); border-bottom: 1px solid rgba(0, 86, 224, 0.1);
      display: flex; justify-content: space-between; align-items: center;
    }
    .bot-info { display: flex; align-items: center; gap: 0.8rem; }
    .bot-avatar {
      width: 40px; height: 40px; background: linear-gradient(135deg, var(--primary), #7c3aed);
      border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .chat-header h3 { color: var(--dark); font-size: 1rem; font-weight: 700; margin: 0; }
    .bot-status { color: var(--primary); font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .bot-status::before { content: ''; display: block; width: 6px; height: 6px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 5px var(--primary); }
    .close-btn { background: none; border: none; color: var(--secondary); font-size: 1.2rem; cursor: pointer; transition: color 0.3s; }
    .close-btn:hover { color: var(--dark); }

    /* MESSAGES AREA */
    .chat-messages {
      flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem;
      scrollbar-width: thin; scrollbar-color: rgba(0, 86, 224, 0.2) transparent;
    }
    .chat-messages::-webkit-scrollbar { width: 6px; }
    .chat-messages::-webkit-scrollbar-thumb { background: rgba(0, 86, 224, 0.2); border-radius: 10px; }
    .message-wrapper { display: flex; flex-direction: column; max-width: 85%; }
    .bot-msg { align-self: flex-start; }
    .user-msg { align-self: flex-end; align-items: flex-end; }
    
    .message-bubble {
      padding: 0.8rem 1rem; border-radius: 15px; position: relative;
      font-size: 0.9rem; line-height: 1.4;
    }
    .bot-msg .message-bubble {
      background: #f1f5f9; border: 1px solid #e2e8f0; color: var(--dark);
      border-bottom-left-radius: 4px;
    }
    .user-msg .message-bubble {
      background: rgba(0, 86, 224, 0.08); border: 1px solid rgba(0, 86, 224, 0.15); color: var(--dark);
      border-bottom-right-radius: 4px;
    }
    .message-bubble p { margin: 0; }
    .message-time {
      font-size: 0.65rem; color: var(--secondary); margin-top: 4px; display: block;
      text-align: right;
    }

    /* TYPING INDICATOR */
    .typing-indicator { display: flex; gap: 4px; padding: 1rem 1.2rem; align-items: center; }
    .typing-indicator span {
      display: block; width: 6px; height: 6px; background: #94a3b8; border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); background: var(--primary); }
    }

    /* INPUT AREA */
    .chat-input-area {
      padding: 1rem; background: rgba(255, 255, 255, 0.5); border-top: 1px solid rgba(0, 86, 224, 0.1);
      display: flex; gap: 0.5rem;
    }
    .chat-input {
      flex: 1; padding: 0.8rem 1rem; border-radius: 20px; border: 1px solid rgba(0, 86, 224, 0.15);
      background: var(--white); color: var(--dark); font-size: 0.9rem; outline: none;
      transition: all 0.3s;
    }
    .chat-input:focus { border-color: var(--primary); background: var(--white); box-shadow: 0 0 0 3px rgba(0, 86, 224, 0.1); }
    .send-btn {
      width: 42px; height: 42px; border-radius: 50%; border: none; cursor: pointer;
      background: linear-gradient(135deg, var(--primary), #7c3aed); color: white;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s;
    }
    .send-btn:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 0 15px rgba(0, 86, 224, 0.3); }
    .send-btn:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }

    @media (max-width: 400px) {
      .chat-panel {
        width: 100%; height: 100%; bottom: 0; right: 0; border-radius: 0;
        transform: translateY(100%);
      }
      .chat-panel.open { transform: translateY(0); }
      .chatbot-toggle { display: none; } /* Hide toggle when open on mobile if handled differently, but here we just keep it */
      .chat-panel.open ~ .chatbot-toggle { z-index: 10000; bottom: 1rem; right: 1rem; width: 50px; height: 50px; }
    }
  `]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  private api = inject(ApiService);
  
  isOpen = false;
  messages: ChatMessage[] = [];
  newMessage = '';
  isTyping = false;

  ngOnInit() {
    this.messages.push({
      text: 'Bonjour ! Je suis l\'assistant IA d\'OMNILOG. Comment puis-je vous aider aujourd\'hui ?',
      isBot: true,
      time: this.getTime()
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.isTyping) return;

    const userText = this.newMessage;
    this.messages.push({ text: userText, isBot: false, time: this.getTime() });
    this.newMessage = '';
    this.isTyping = true;

    this.api.sendChatMessage(userText).subscribe({
      next: (res) => {
        // Simulate slight delay for typing effect
        setTimeout(() => {
          this.isTyping = false;
          this.messages.push({ text: res.reply, isBot: true, time: this.getTime() });
        }, 800);
      },
      error: () => {
        this.isTyping = false;
        this.messages.push({ 
          text: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.', 
          isBot: true, 
          time: this.getTime() 
        });
      }
    });
  }

  private getTime(): string {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  }
}
