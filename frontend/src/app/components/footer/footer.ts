import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-glow"></div>
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-col">
            <h3 class="footer-brand"><span class="brand-icon">◆</span> OMNI<span class="hl">LOG</span></h3>
            <p class="footer-desc">La plateforme digitale de référence pour la logistique et le transport au Maroc. Centralisant marketplaces, bourses et services professionnels.</p>
            <div class="social-links">
              <a href="#" class="social-icon">𝕏</a>
              <a href="#" class="social-icon">in</a>
              <a href="#" class="social-icon">f</a>
              <a href="#" class="social-icon">▶</a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Nos Espaces</h4>
            <ul>
              <li><a routerLink="/marketplace">Marketplace Véhicules</a></li>
              <li><a routerLink="/marketplace">Marketplace Manutention</a></li>
              <li><a routerLink="/bourses">Bourses Logistiques</a></li>
              <li><a routerLink="/eguichet">E-Guichet Administratif</a></li>
              <li><a routerLink="/forum">Forum Professionnel</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Services</h4>
            <ul>
              <li><a href="#">Devis Express</a></li>
              <li><a href="#">Bourse de Fret</a></li>
              <li><a href="#">Bourse des Chauffeurs</a></li>
              <li><a href="#">Abonnements Pro</a></li>
              <li><a href="#">Assistant IA</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Contact</h4>
            <ul class="contact-list">
              <li>📍 Casablanca, Maroc</li>
              <li>📧 contact&#64;omnilog.ma</li>
              <li>📞 +212 5 22 12 34 56</li>
              <li>🕐 Lun - Ven : 8h - 18h</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 OMNILOG — Tous droits réservés. Plateforme conçue au Maroc 🇲🇦</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #060612; position: relative; overflow: hidden;
      border-top: 1px solid rgba(0,212,255,0.08); padding-top: 4rem;
    }
    .footer-glow {
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 60%; height: 1px;
      background: linear-gradient(90deg, transparent, #00d4ff, #7c3aed, transparent);
    }
    .footer-container { max-width: 1400px; margin: 0 auto; padding: 0 2rem; }
    .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 3rem; }
    .footer-brand { font-size: 1.5rem; font-weight: 800; color: #e0e0ff; margin-bottom: 1rem; }
    .brand-icon {
      background: linear-gradient(135deg, #00d4ff, #7c3aed);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hl {
      background: linear-gradient(135deg, #00d4ff, #7c3aed);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .footer-desc { color: #7a7a9e; font-size: 0.9rem; line-height: 1.7; margin-bottom: 1.5rem; }
    .social-links { display: flex; gap: 0.8rem; }
    .social-icon {
      width: 36px; height: 36px; border-radius: 50%;
      border: 1px solid rgba(0,212,255,0.2); display: flex; align-items: center; justify-content: center;
      color: #a0a0cc; text-decoration: none; font-size: 0.8rem; font-weight: 700;
      transition: all 0.3s ease;
    }
    .social-icon:hover {
      border-color: #00d4ff; color: #00d4ff;
      box-shadow: 0 0 15px rgba(0,212,255,0.3); transform: translateY(-2px);
    }
    .footer-col h4 {
      color: #e0e0ff; font-size: 1rem; font-weight: 700; margin-bottom: 1.2rem;
      position: relative; padding-bottom: 0.6rem;
    }
    .footer-col h4::after {
      content: ''; position: absolute; bottom: 0; left: 0;
      width: 30px; height: 2px; background: linear-gradient(90deg, #00d4ff, #7c3aed); border-radius: 2px;
    }
    .footer-col ul { list-style: none; padding: 0; margin: 0; }
    .footer-col li { margin-bottom: 0.7rem; }
    .footer-col a {
      color: #7a7a9e; text-decoration: none; font-size: 0.88rem;
      transition: all 0.3s ease;
    }
    .footer-col a:hover { color: #00d4ff; padding-left: 5px; }
    .contact-list li { color: #7a7a9e; font-size: 0.88rem; }
    .footer-bottom {
      margin-top: 3rem; padding: 1.5rem 0;
      border-top: 1px solid rgba(255,255,255,0.05); text-align: center;
    }
    .footer-bottom p { color: #5a5a7e; font-size: 0.85rem; }
    @media (max-width: 900px) {
      .footer-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
    }
    @media (max-width: 600px) {
      .footer-grid { grid-template-columns: 1fr; gap: 2rem; }
    }
  `]
})
export class FooterComponent {}
