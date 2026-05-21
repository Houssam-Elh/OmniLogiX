import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';
import { ChatbotComponent } from './components/chatbot/chatbot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ChatbotComponent],
  template: `
    <app-navbar></app-navbar>
    
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <app-chatbot></app-chatbot>
    <app-footer></app-footer>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 70px);
      /* Base background to avoid white flashes during routing */
      background: #f3f7fd;
    }
  `]
})
export class App {
  title = 'omnilog-frontend';
}
