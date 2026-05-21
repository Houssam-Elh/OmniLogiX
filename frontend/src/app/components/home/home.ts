import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- HERO SECTION -->
    <section class="hero">
      <div class="hero-bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">🚀 Plateforme Logistique Digitale N°1 au Maroc</div>
        <h1 class="hero-title">
          <span class="title-line">La Plateforme</span>
          <span class="title-gradient">OMNILOG</span>
        </h1>
        <p class="hero-subtitle">Votre écosystème numérique complet pour la logistique & le transport. Marketplaces, bourses, services administratifs et IA — tout en un seul endroit.</p>
        <div class="hero-cta">
          <a routerLink="/marketplace" class="btn-primary">Découvrir la Marketplace</a>
          <a routerLink="/bourses" class="btn-outline">Accéder aux Bourses</a>
        </div>
        <div class="hero-stats">
          <div class="stat"><span class="stat-num">5 000+</span><span class="stat-label">Professionnels</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><span class="stat-num">12 000+</span><span class="stat-label">Annonces</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><span class="stat-num">200+</span><span class="stat-label">Partenaires</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><span class="stat-num">24/7</span><span class="stat-label">Support IA</span></div>
        </div>
      </div>
    </section>

    <!-- 7 ESPACES SECTION -->
    <section class="espaces-section">
      <div class="section-container">
        <div class="section-header">
          <span class="section-tag">Architecture Plateforme</span>
          <h2 class="section-title">Nos <span class="hl">7 Espaces</span> Dédiés</h2>
          <p class="section-desc">Un écosystème numérique complet pour tous les besoins de la logistique et du transport.</p>
        </div>
        <div class="espaces-grid">
          @for (espace of espaces; track espace.id) {
            <div class="espace-card" [style.--accent]="espace.color">
              <div class="espace-icon">{{ espace.icon }}</div>
              <h3>{{ espace.title }}</h3>
              <p>{{ espace.desc }}</p>
              <div class="espace-glow"></div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- DOMAINES SECTION -->
    <section class="domaines-section">
      <div class="section-container">
        <div class="section-header">
          <span class="section-tag">Domaines d'Activité</span>
          <h2 class="section-title">Couverture <span class="hl">Multi-Sectorielle</span></h2>
        </div>
        <div class="domaines-grid">
          @for (domaine of domaines; track domaine.name) {
            <div class="domaine-card">
              <span class="domaine-icon">{{ domaine.icon }}</span>
              <h4>{{ domaine.name }}</h4>
              <p>{{ domaine.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- CTA SECTION -->
    <section class="cta-section">
      <div class="cta-container">
        <h2>Rejoignez <span class="hl">OMNILOG</span> Aujourd'hui</h2>
        <p>Accédez gratuitement à la plateforme et développez votre activité logistique au Maroc.</p>
        <div class="cta-buttons">
          <a routerLink="/login" class="btn-primary btn-lg">Créer un Compte Gratuit</a>
          <a routerLink="/contact" class="btn-outline btn-lg">Nous Contacter</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    /* ===== HERO ===== */
    .hero {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(170deg, #ffffff 0%, #f0f6ff 40%, #e6effd 100%);
      position: relative; overflow: hidden; padding: 6rem 2rem 4rem;
    }
    .hero-bg-shapes { position: absolute; inset: 0; pointer-events: none; }
    .shape {
      position: absolute; border-radius: 50%; opacity: 0.15;
      animation: float 8s ease-in-out infinite;
    }
    .shape-1 {
      width: 500px; height: 500px; top: -10%; right: -5%;
      background: radial-gradient(circle, #00c0f0, transparent 70%);
      animation-delay: 0s;
    }
    .shape-2 {
      width: 400px; height: 400px; bottom: -5%; left: -5%;
      background: radial-gradient(circle, #0056e0, transparent 70%);
      animation-delay: 2s;
    }
    .shape-3 {
      width: 200px; height: 200px; top: 30%; left: 15%;
      background: radial-gradient(circle, #00c0f0, transparent 70%);
      animation-delay: 4s;
    }
    .shape-4 {
      width: 300px; height: 300px; top: 20%; right: 20%;
      background: radial-gradient(circle, #0056e0, transparent 70%);
      animation-delay: 6s;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-30px) scale(1.05); }
    }
    .hero-content { text-align: center; max-width: 850px; position: relative; z-index: 2; }
    .hero-badge {
      display: inline-block; padding: 0.5rem 1.5rem; border-radius: 50px;
      background: rgba(0, 86, 224, 0.06); border: 1px solid rgba(0, 86, 224, 0.15);
      color: #0056e0; font-size: 0.85rem; font-weight: 600; margin-bottom: 2rem;
      animation: fadeInDown 0.8s ease;
    }
    .hero-title { margin-bottom: 1.5rem; animation: fadeInDown 1s ease; }
    .title-line {
      display: block; font-size: 1.8rem; font-weight: 400; color: #4b6584;
      letter-spacing: 2px; text-transform: uppercase;
    }
    .title-gradient {
      display: block; font-size: 5rem; font-weight: 900; letter-spacing: 8px;
      background: linear-gradient(135deg, #0056e0 0%, #00c0f0 50%, #003fa3 100%);
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      animation: gradient-shift 4s ease infinite;
      filter: drop-shadow(0 10px 30px rgba(0, 86, 224, 0.15));
    }
    @keyframes gradient-shift {
      0% { background-position: 0% center; }
      50% { background-position: 100% center; }
      100% { background-position: 0% center; }
    }
    .hero-subtitle {
      font-size: 1.15rem; color: #4b5563; line-height: 1.8;
      max-width: 650px; margin: 0 auto 2.5rem;
      animation: fadeInUp 1s ease 0.3s both;
    }
    .hero-cta {
      display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
      animation: fadeInUp 1s ease 0.5s both;
    }
    .btn-primary {
      padding: 0.9rem 2.2rem; border-radius: 30px; font-weight: 700; font-size: 0.95rem;
      background: linear-gradient(135deg, #0056e0, #00c0f0); color: #fff;
      text-decoration: none; transition: all 0.3s ease;
      box-shadow: 0 4px 25px rgba(0, 86, 224, 0.25);
    }
    .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 35px rgba(0, 86, 224, 0.4); }
    .btn-outline {
      padding: 0.9rem 2.2rem; border-radius: 30px; font-weight: 700; font-size: 0.95rem;
      background: transparent; color: #0056e0;
      border: 2px solid rgba(0, 86, 224, 0.4); text-decoration: none;
      transition: all 0.3s ease;
    }
    .btn-outline:hover {
      background: rgba(0, 86, 224, 0.08); border-color: #0056e0;
      transform: translateY(-3px); box-shadow: 0 4px 25px rgba(0, 86, 224, 0.15);
    }
    .btn-lg { padding: 1rem 2.8rem; font-size: 1.05rem; }
    .hero-stats {
      display: flex; align-items: center; justify-content: center; gap: 2rem;
      margin-top: 4rem; padding: 1.5rem 2.5rem; border-radius: 20px;
      background: #ffffff; border: 1px solid rgba(0, 86, 224, 0.08);
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 30px rgba(0, 86, 224, 0.05);
      animation: fadeInUp 1s ease 0.7s both;
    }
    .stat { text-align: center; }
    .stat-num {
      display: block; font-size: 1.6rem; font-weight: 800;
      background: linear-gradient(135deg, #0056e0, #00c0f0);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .stat-label { font-size: 0.8rem; color: #5a6b82; font-weight: 500; }
    .stat-divider { width: 1px; height: 35px; background: rgba(0, 86, 224, 0.08); }

    /* ===== SECTIONS GLOBAL ===== */
    .section-container { max-width: 1400px; margin: 0 auto; padding: 0 2rem; }
    .section-header { text-align: center; margin-bottom: 3.5rem; }
    .section-tag {
      display: inline-block; padding: 0.4rem 1.2rem; border-radius: 30px;
      background: rgba(0, 86, 224, 0.08); border: 1px solid rgba(0, 86, 224, 0.15);
      color: #0056e0; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 1px; margin-bottom: 1rem;
    }
    .section-title {
      font-size: 2.5rem; font-weight: 800; color: #0a1128; margin-bottom: 1rem;
    }
    .hl {
      background: linear-gradient(135deg, #0056e0, #00c0f0);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .section-desc { color: #4b5563; font-size: 1.05rem; max-width: 600px; margin: 0 auto; }

    /* ===== 7 ESPACES ===== */
    .espaces-section {
      padding: 6rem 2rem; background: #ffffff;
      position: relative;
    }
    .espaces-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .espace-card {
      background: #ffffff; border: 1px solid rgba(0, 86, 224, 0.08);
      border-radius: 20px; padding: 2rem; position: relative; overflow: hidden;
      transition: all 0.4s ease; cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 86, 224, 0.02);
    }
    .espace-card:hover {
      transform: translateY(-8px); border-color: rgba(0, 86, 224, 0.25);
      box-shadow: 0 20px 40px rgba(0, 86, 224, 0.08);
    }
    .espace-glow {
      position: absolute; top: -50%; right: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle at center, var(--accent, #0056e0), transparent 70%);
      opacity: 0; transition: opacity 0.4s ease; pointer-events: none;
    }
    .espace-card:hover .espace-glow { opacity: 0.05; }
    .espace-icon { font-size: 2.5rem; margin-bottom: 1rem; display: block; }
    .espace-card h3 { color: #0a1128; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.7rem; }
    .espace-card p { color: #4b5563; font-size: 0.88rem; line-height: 1.6; }

    /* ===== DOMAINES ===== */
    .domaines-section {
      padding: 6rem 2rem;
      background: linear-gradient(180deg, #ffffff, #f3f7fd, #ffffff);
    }
    .domaines-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;
    }
    .domaine-card {
      text-align: center; padding: 2.5rem 1.5rem; border-radius: 20px;
      background: #ffffff; border: 1px solid rgba(0, 86, 224, 0.06);
      box-shadow: 0 4px 20px rgba(0, 86, 224, 0.02);
      transition: all 0.4s ease;
    }
    .domaine-card:hover {
      transform: translateY(-6px); border-color: rgba(0, 86, 224, 0.2);
      box-shadow: 0 15px 35px rgba(0, 86, 224, 0.06);
    }
    .domaine-icon { font-size: 2.8rem; display: block; margin-bottom: 1rem; }
    .domaine-card h4 { color: #0a1128; font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
    .domaine-card p { color: #4b5563; font-size: 0.82rem; line-height: 1.5; }

    /* ===== CTA ===== */
    .cta-section {
      padding: 6rem 2rem;
      background: linear-gradient(135deg, rgba(0, 86, 224, 0.03), rgba(0, 192, 240, 0.03));
    }
    .cta-container {
      max-width: 750px; margin: 0 auto; text-align: center;
      padding: 4rem 3rem; border-radius: 30px;
      background: #ffffff; border: 1px solid rgba(0, 86, 224, 0.1);
      box-shadow: 0 20px 50px rgba(0, 86, 224, 0.06);
      backdrop-filter: blur(10px);
    }
    .cta-container h2 { font-size: 2.2rem; font-weight: 800; color: #0a1128; margin-bottom: 1rem; }
    .cta-container p { color: #4b5563; font-size: 1.05rem; margin-bottom: 2rem; }
    .cta-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

    /* ===== ANIMATIONS ===== */
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 600px) {
      .title-gradient { font-size: 3rem; letter-spacing: 4px; }
      .title-line { font-size: 1.2rem; }
      .hero-stats { flex-direction: column; gap: 1rem; }
      .stat-divider { width: 40px; height: 1px; }
      .section-title { font-size: 1.8rem; }
    }
  `]
})
export class HomeComponent {
  espaces = [
    { id: 1, icon: '🏪', title: 'Marketplace Véhicules & Engins', desc: 'Achat, vente et location de véhicules et engins de transport professionnels.', color: '#00d4ff' },
    { id: 2, icon: '🏭', title: 'Marketplace Manutention & Entreposage', desc: 'Équipements de manutention, racks de stockage et solutions d\'entreposage.', color: '#7c3aed' },
    { id: 3, icon: '📦', title: 'Bourses Logistiques', desc: 'Fret, messagerie, capacité, entreposage et chauffeurs en temps réel.', color: '#00d4ff' },
    { id: 4, icon: '🏛️', title: 'E-Guichet Administratif', desc: 'Services administratifs dématérialisés : documents, autorisations, conformité.', color: '#f59e0b' },
    { id: 5, icon: '📰', title: 'Actualités & Médias', desc: 'Veille sectorielle, actualités logistiques et analyses du marché.', color: '#10b981' },
    { id: 6, icon: '💬', title: 'Forum Professionnel', desc: 'Échanges, discussions et entraide entre professionnels du secteur.', color: '#ef4444' },
    { id: 7, icon: '📊', title: 'Observatoire & Études', desc: 'Données, statistiques, benchmarks et études approfondies du secteur.', color: '#8b5cf6' }
  ];

  domaines = [
    { icon: '🚛', name: 'Transport Routier', desc: 'Camions, semi-remorques et véhicules utilitaires' },
    { icon: '🚢', name: 'Maritime', desc: 'Transport maritime et portuaire' },
    { icon: '✈️', name: 'Aérien', desc: 'Fret aérien et cargo' },
    { icon: '🚂', name: 'Ferroviaire', desc: 'Transport ferroviaire de marchandises' },
    { icon: '🏗️', name: 'Entreposage', desc: 'Stockage et gestion d\'entrepôts' },
    { icon: '📋', name: 'Douane & Conformité', desc: 'Formalités douanières et réglementaires' }
  ];
}
