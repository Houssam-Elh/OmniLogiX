import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <!-- RED RIBBON PROMO BANNER -->
    <div class="red-ribbon">
      <span class="ribbon-icon">📢</span>
      <span class="ribbon-text">Publier une annonce / Trouver un transporteur en moins de 2 minutes !</span>
    </div>

    <!-- HERO SECTION -->
    <section class="hero-section">
      <div class="container hero-grid">
        <div class="hero-content">
          <div class="hero-badge">🇲🇦 Plateforme Logistique Digitale N°1 au Maroc</div>
          <h1 class="hero-title">
            Votre Espace <span class="accent-red">Logistique & Transport</span>
          </h1>
          <p class="hero-subtitle">
            Mise en relation directe entre expéditeurs, commissionnaires et transporteurs. 
            Publiez vos offres de fret, trouvez du stockage ou optimisez vos flottes en temps réel.
          </p>

          <!-- HERO SEARCH BOX -->
          <div class="search-container">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Rechercher par mot-clé (ex: Casablanca, Tanger Med, Fret, Stockage...)"
                (keyup.enter)="onSearch()"
              >
              <button class="btn-search" (click)="onSearch()">Rechercher</button>
            </div>
          </div>

          <div class="hero-actions">
            <button (click)="scrollToForm()" class="btn btn-primary-red">Publier une Annonce</button>
            <a routerLink="/bourses" class="btn btn-outline-dark">Consulter les Bourses</a>
          </div>
        </div>

        <div class="hero-image-container">
          <img src="images/hero_logistics.png" alt="OMNILOG Platform Mockup" class="hero-image">
        </div>
      </div>
    </section>

    <!-- STATISTICS SECTION -->
    <section class="stats-section">
      <div class="container stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrapper">📦</div>
          <div class="stat-info">
            <h3>100 000+</h3>
            <p>Offres par jour</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper">👥</div>
          <div class="stat-info">
            <h3>50 000+</h3>
            <p>Utilisateurs actifs</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper">🌍</div>
          <div class="stat-info">
            <h3>15</h3>
            <p>Pays desservis</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper">📞</div>
          <div class="stat-info">
            <h3>24/7</h3>
            <p>Service client</p>
          </div>
        </div>
      </div>
    </section>

    <!-- BRANDS LOGO GRID SECTION -->
    <section class="brands-section">
      <div class="container">
        <div class="brands-header">
          <h2>Constructeurs & Partenaires Majeurs</h2>
          <p>Les plus grandes marques et flottes de transport de marchandises collaborent sur OMNILOG.</p>
        </div>
        <div class="brands-grid">
          @for (brand of brands; track brand.name) {
            <div class="brand-logo-card" [attr.data-brand]="brand.name">
              <div class="brand-logo-inner">
                @if (brand.name === 'SCANIA') {
                  <span class="brand-text scania-text">SCANIA</span>
                } @else if (brand.name === 'TruckStore') {
                  <span class="brand-text truckstore-text">Truck<span>Store</span></span>
                } @else if (brand.name === 'MAN') {
                  <span class="brand-text man-text">🦁 MAN</span>
                } @else if (brand.name === 'IVECO') {
                  <span class="brand-text iveco-text">IVECO</span>
                } @else if (brand.name === 'DAF') {
                  <span class="brand-text daf-text">DAF</span>
                } @else if (brand.name === 'KRONE') {
                  <span class="brand-text krone-text">👑 KRONE</span>
                } @else if (brand.name === 'SCHMITZ CARGOBULL') {
                  <span class="brand-text schmitz-text">🐘 SCHMITZ</span>
                } @else if (brand.name === 'VOLVO') {
                  <span class="brand-text volvo-text">VOLVO</span>
                } @else if (brand.name === 'RENAULT TRUCKS') {
                  <span class="brand-text renault-text">♦ RENAULT</span>
                } @else if (brand.name === 'ELKON') {
                  <span class="brand-text elkon-text">ELKON</span>
                } @else if (brand.name === 'ZEPPELIN') {
                  <span class="brand-text zeppelin-text">ZEPPELIN</span>
                } @else if (brand.name === 'CAT') {
                  <span class="brand-text cat-text">CAT <span>▲</span></span>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- BOURSES CARDS SECTION -->
    <section class="bourses-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Bourses en temps réel</span>
          <h2>Nos Bourses Logistiques Actives</h2>
          <p>Sélectionnez l'espace correspondant à vos besoins opérationnels.</p>
        </div>

        <div class="bourses-grid">
          <!-- CARD 1 -->
          <div class="bourse-card card-fret">
            <div class="bourse-badge badge-green">Fret</div>
            <h3>Bourse de Fret</h3>
            <p class="bourse-desc">Trouvez ou proposez des chargements routiers, maritimes ou aériens au Maroc et à l'international.</p>
            <ul class="bourse-features">
              <li>✔️ +4 200 offres quotidiennes</li>
              <li>✔️ Filtrage par origine / destination</li>
              <li>✔️ Messagerie instantanée sécurisée</li>
            </ul>
            <a routerLink="/bourses" class="btn-bourse">Accéder au Fret</a>
          </div>

          <!-- CARD 2 -->
          <div class="bourse-card card-capacity">
            <div class="bourse-badge badge-blue">Véhicules</div>
            <h3>Bourse de Capacité</h3>
            <p class="bourse-desc">Évitez les retours à vide ! Publiez vos camions et véhicules disponibles pour optimiser vos trajets.</p>
            <ul class="bourse-features">
              <li>✔️ Tous types de carrosseries</li>
              <li>✔️ Tarifs négociés directement</li>
              <li>✔️ Matching automatique</li>
            </ul>
            <a routerLink="/bourses" class="btn-bourse">Accéder aux Véhicules</a>
          </div>

          <!-- CARD 3 -->
          <div class="bourse-card card-storage">
            <div class="bourse-badge badge-red">Stockage</div>
            <h3>Bourse d'Entreposage</h3>
            <p class="bourse-desc">Trouvez ou proposez des espaces de stockage temporaires, hangars ou entrepôts frigorifiques.</p>
            <ul class="bourse-features">
              <li>✔️ Stockage palette ou vrac</li>
              <li>✔️ Zones logistiques clés</li>
              <li>✔️ Devis express sous 24h</li>
            </ul>
            <a routerLink="/bourses" class="btn-bourse">Accéder au Stockage</a>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES DETAILS SECTION (GRAPHICS & CHECKLISTS) -->
    <section class="features-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Avantages plateforme</span>
          <h2>Une Solution Logistique Intégrale</h2>
          <p>Découvrez comment nous réinventons la gestion du transport de marchandises.</p>
        </div>

        <div class="features-grid">
          <!-- Feature Card 1 -->
          <div class="feature-card">
            <div class="feature-img-wrapper">
              <img src="images/cargo_transport.png" alt="Cargo Transport Management" class="feature-img">
            </div>
            <div class="feature-body">
              <h3>Commissionnaires & Chargeurs</h3>
              <p class="feature-lead">Sécurisez vos opérations de transport grâce à notre réseau qualifié.</p>
              <ul class="feature-checklist">
                <li><span>✔️</span> Transporteurs marocains certifiés et notés</li>
                <li><span>✔️</span> Validation automatique des documents légaux</li>
                <li><span>✔️</span> Tarifs compétitifs en direct</li>
              </ul>
            </div>
          </div>

          <!-- Feature Card 2 -->
          <div class="feature-card">
            <div class="feature-img-wrapper">
              <img src="images/smart_city.png" alt="Smart City Logistics Network" class="feature-img">
            </div>
            <div class="feature-body">
              <h3>Réseau Intelligent & Optimisé</h3>
              <p class="feature-lead">L'intelligence artificielle au service de vos marges opérationnelles.</p>
              <ul class="feature-checklist">
                <li><span>✔️</span> Calcul intelligent des meilleurs itinéraires</li>
                <li><span>✔️</span> Alerte automatique sur les retours à vide</li>
                <li><span>✔️</span> Analyse en temps réel des prix du marché</li>
              </ul>
            </div>
          </div>

          <!-- Feature Card 3 -->
          <div class="feature-card">
            <div class="feature-img-wrapper">
              <img src="images/dashboard_mockup.png" alt="Digital Web Dashboard App" class="feature-img">
            </div>
            <div class="feature-body">
              <h3>Outils de Pilotage Avancés</h3>
              <p class="feature-lead">Suivez toute votre activité depuis un tableau de bord unique.</p>
              <ul class="feature-checklist">
                <li><span>✔️</span> E-Guichet administratif pour vos formalités</li>
                <li><span>✔️</span> Suivi des livraisons et statuts de déchargement</li>
                <li><span>✔️</span> Messagerie instantanée intégrée pour négocier</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- STEP WORKFLOW (COMMENT CA MARCHE) -->
    <section class="steps-section">
      <div class="container">
        <div class="steps-header">
          <h2>Comment fonctionne la plateforme ?</h2>
          <p>Mettre en place vos opérations logistiques n'a jamais été aussi simple.</p>
        </div>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <h4>Inscription en 1 minute</h4>
            <p>Créez votre profil d'entreprise et faites vérifier vos documents en quelques clics.</p>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <h4>Publiez ou Recherchez</h4>
            <p>Déposez une demande de fret, de véhicule ou de stockage, ou parcourez les annonces.</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <h4>Négociez et Concluez</h4>
            <p>Discutez directement des conditions avec les partenaires via le chat sécurisé.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- NEWS FEED SECTION -->
    <section class="news-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Actualités</span>
          <h2>Dernières actualités du secteur</h2>
          <p>Restez informé sur les tendances de la logistique et de la réglementation au Maroc.</p>
        </div>

        <div class="news-grid">
          <div class="news-card">
            <div class="news-badge">Réglementation</div>
            <div class="news-content">
              <span class="news-date">22 Mai 2026</span>
              <h3>Le e-guichet OMNILOG simplifie les autorisations de transport</h3>
              <p>Une nouvelle étape vers la dématérialisation complète des démarches pour les transporteurs marocains.</p>
              <a href="#" class="news-link">Lire la suite →</a>
            </div>
          </div>

          <div class="news-card">
            <div class="news-badge">Technologie</div>
            <div class="news-content">
              <span class="news-date">18 Mai 2026</span>
              <h3>L'intelligence artificielle pour contrer les retours à vide</h3>
              <p>Comment notre algorithme de matching prédictif fait gagner jusqu'à 25% de rentabilité aux flottes.</p>
              <a href="#" class="news-link">Lire la suite →</a>
            </div>
          </div>

          <div class="news-card">
            <div class="news-badge">Événement</div>
            <div class="news-content">
              <span class="news-date">10 Mai 2026</span>
              <h3>Retour sur le Salon International de la Logistique à Casablanca</h3>
              <p>OMNILOG a présenté ses nouvelles fonctionnalités de suivi en temps réel aux leaders du secteur.</p>
              <a href="#" class="news-link">Lire la suite →</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- INTERACTIVE LEAD & PUBLICATION FORM -->
    <section id="publication-form" class="form-section">
      <div class="form-glow"></div>
      <div class="container form-container-box">
        <div class="form-header">
          <h2>Demande d'information & Publication rapide</h2>
          <p>Remplissez le formulaire ci-dessous pour publier votre annonce ou être contacté par notre équipe.</p>
        </div>

        <!-- Dynamic Success Message -->
        @if (formSubmitted) {
          <div class="form-success-toast">
            <div class="success-icon">🎉</div>
            <div class="success-message">
              <h4>Demande enregistrée avec succès !</h4>
              <p>Notre équipe ou des partenaires logistiques qualifiés vous contacteront sous 24h.</p>
            </div>
            <button class="btn-reset-form" (click)="resetForm()">Envoyer une nouvelle demande</button>
          </div>
        } @else {
          <form class="lead-form" (submit)="onSubmitForm($event)">
            <div class="form-row">
              <div class="form-group">
                <label for="name">Nom complet / Raison Sociale *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  [(ngModel)]="formData.name" 
                  placeholder="Ex: Ahmed Alaoui / Transport Maroc Logistique" 
                  required
                >
              </div>

              <div class="form-group">
                <label for="email">E-mail Professionnel *</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  [(ngModel)]="formData.email" 
                  placeholder="Ex: contact&#64;entreprise.ma" 
                  required
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="phone">Numéro de téléphone *</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  [(ngModel)]="formData.phone" 
                  placeholder="Ex: +212 6 00 00 00 00" 
                  required
                >
              </div>

              <div class="form-group">
                <label for="service">Type de Service *</label>
                <select id="service" name="service" [(ngModel)]="formData.service">
                  <option value="Fret">Bourse de Fret (Demande de transport)</option>
                  <option value="Véhicules">Bourse de Capacité (Camion disponible)</option>
                  <option value="Stockage">Bourse d'Entreposage (Espace de stockage)</option>
                  <option value="Autre">Autre Demande d'information</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="message">Détails de votre annonce ou demande *</label>
              <textarea 
                id="message" 
                name="message" 
                [(ngModel)]="formData.message" 
                rows="4" 
                placeholder="Décrivez votre besoin (ex: semi-remorque plateau dispo demain au départ de Tanger Med pour Casablanca, ou recherche stockage 100 palettes à Nouaceur...)"
                required
              ></textarea>
            </div>

            <button type="submit" class="btn btn-submit-red">Envoyer la Demande</button>
          </form>
        }
      </div>
    </section>
  `,
  styles: [`
    /* GLOBAL STYLING OVERRIDES & COMPONENT CORE */
    :host {
      display: block;
      padding-top: 70px; /* offset navbar */
      font-family: 'Inter', sans-serif;
      background-color: #f7f9fc;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .accent-red {
      color: #e53e3e;
      position: relative;
    }

    /* RED BANNER NOTICE */
    .red-ribbon {
      background: linear-gradient(90deg, #d32f2f, #e53e3e);
      color: #ffffff;
      padding: 0.75rem 1rem;
      text-align: center;
      font-size: 0.95rem;
      font-weight: 700;
      box-shadow: 0 4px 15px rgba(229, 62, 62, 0.2);
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      position: relative;
      z-index: 10;
      animation: slideDown 0.5s ease-out;
    }

    .ribbon-icon {
      font-size: 1.1rem;
      animation: pulse 1.5s infinite;
    }

    @keyframes slideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }

    /* HERO SECTION */
    .hero-section {
      background: #ffffff;
      padding: 4rem 0 5rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;
    }

    .hero-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 3rem;
      align-items: center;
    }

    .hero-badge {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: rgba(229, 62, 62, 0.08);
      border: 1px solid rgba(229, 62, 62, 0.2);
      color: #e53e3e;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.8rem;
      margin-bottom: 1.5rem;
    }

    .hero-title {
      font-size: 3.25rem;
      font-weight: 900;
      line-height: 1.15;
      color: #1a202c;
      margin-bottom: 1.5rem;
      letter-spacing: -1px;
    }

    .hero-subtitle {
      font-size: 1.15rem;
      color: #4a5568;
      line-height: 1.75;
      margin-bottom: 2.5rem;
    }

    /* HERO SEARCH BOX */
    .search-container {
      margin-bottom: 2rem;
      max-width: 650px;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: #f7f9fc;
      border: 2px solid #e2e8f0;
      border-radius: 50px;
      padding: 0.4rem 0.4rem 0.4rem 1.2rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    }

    .search-box:focus-within {
      border-color: #e53e3e;
      background: #ffffff;
      box-shadow: 0 10px 25px rgba(229, 62, 62, 0.08);
    }

    .search-icon {
      font-size: 1.1rem;
      color: #a0aec0;
      margin-right: 0.75rem;
    }

    .search-box input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.95rem;
      color: #2d3748;
      width: 100%;
    }

    .btn-search {
      background: #e53e3e;
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.75rem;
      border-radius: 50px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }

    .btn-search:hover {
      background: #c53030;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .btn {
      padding: 0.85rem 2rem;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.95rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: none;
    }

    .btn-primary-red {
      background: #e53e3e;
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(229, 62, 62, 0.25);
    }

    .btn-primary-red:hover {
      background: #c53030;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(229, 62, 62, 0.35);
    }

    .btn-outline-dark {
      background: transparent;
      border: 2px solid #2d3748;
      color: #2d3748;
    }

    .btn-outline-dark:hover {
      background: #2d3748;
      color: #ffffff;
      transform: translateY(-2px);
    }

    .hero-image-container {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }

    .hero-image {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.08));
      animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }

    /* STATISTICS SECTION */
    .stats-section {
      background: #ffffff;
      padding: 3rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.5rem;
      border-radius: 16px;
      background: #f7f9fc;
      border: 1px solid #edf2f7;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.03);
      border-color: rgba(229, 62, 62, 0.15);
    }

    .stat-icon-wrapper {
      width: 55px;
      height: 55px;
      background: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      box-shadow: 0 4px 10px rgba(0,0,0,0.02);
      flex-shrink: 0;
    }

    .stat-info h3 {
      font-size: 1.65rem;
      font-weight: 850;
      color: #1a202c;
      margin: 0;
    }

    .stat-info p {
      font-size: 0.85rem;
      color: #718096;
      font-weight: 600;
      margin: 2px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* BRANDS LOGO GRID SECTION */
    .brands-section {
      padding: 5rem 0;
      background: #ffffff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.03);
    }

    .brands-header {
      text-align: center;
      margin-bottom: 3.5rem;
    }

    .brands-header h2 {
      font-size: 2.25rem;
      font-weight: 800;
      color: #1a202c;
      margin-bottom: 0.75rem;
    }

    .brands-header p {
      color: #718096;
      font-size: 1.05rem;
    }

    .brands-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 1rem;
    }

    .brand-logo-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      height: 75px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .brand-logo-card:hover {
      background: #ffffff;
      border-color: #cbd5e1;
      transform: scale(1.04);
      box-shadow: 0 8px 16px rgba(0,0,0,0.04);
    }

    /* BRAND CUSTOM STYLE TYPOGRAPHY */
    .brand-text {
      font-size: 1.05rem;
      font-weight: 900;
      letter-spacing: 1px;
      transition: color 0.3s ease;
    }

    .scania-text { color: #0f1c3f; font-family: 'Arial Black', sans-serif; letter-spacing: 2px; }
    .truckstore-text { color: #2d3748; font-weight: 800; }
    .truckstore-text span { color: #e27d18; }
    .man-text { color: #000000; font-style: italic; font-weight: 900; }
    .iveco-text { color: #002f6c; letter-spacing: 3px; font-weight: 900; }
    .daf-text { color: #c00000; font-family: sans-serif; font-weight: 900; letter-spacing: 1.5px; }
    .krone-text { color: #006ab3; font-weight: 800; }
    .schmitz-text { color: #1e3a8a; font-family: 'Impact', sans-serif; }
    .volvo-text { color: #475569; font-weight: 900; border: 1.5px solid #94a3b8; padding: 2px 8px; border-radius: 4px; }
    .renault-text { color: #dc2626; font-weight: 900; }
    .elkon-text { color: #0284c7; font-weight: 900; letter-spacing: 1.5px; }
    .zeppelin-text { color: #1e293b; background: #eab308; padding: 2px 8px; font-weight: 900; }
    .cat-text { color: #000000; font-weight: 900; }
    .cat-text span { color: #facc15; font-size: 0.8rem; }

    /* BOURSES SECTION */
    .bourses-section {
      padding: 6rem 0;
      background: #f8fafc;
    }

    .section-header {
      text-align: center;
      margin-bottom: 4rem;
    }

    .section-tag {
      display: inline-block;
      padding: 0.35rem 1rem;
      background: rgba(229, 62, 62, 0.08);
      color: #e53e3e;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.75rem;
    }

    .section-header h2 {
      font-size: 2.25rem;
      font-weight: 850;
      color: #1a202c;
      margin-bottom: 1rem;
    }

    .section-header p {
      color: #718096;
      font-size: 1.1rem;
    }

    .bourses-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .bourse-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 2.5rem 2rem;
      position: relative;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 15px rgba(0,0,0,0.01);
    }

    .bourse-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
    }

    .bourse-badge {
      position: absolute;
      top: 2rem;
      right: 2rem;
      padding: 0.35rem 0.85rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .badge-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .badge-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

    .bourse-card h3 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1a202c;
      margin-bottom: 1rem;
      margin-top: 0.5rem;
    }

    .bourse-desc {
      color: #4a5568;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 2rem;
      min-height: 70px;
    }

    .bourse-features {
      list-style: none;
      padding: 0;
      margin: 0 0 2.5rem 0;
    }

    .bourse-features li {
      font-size: 0.9rem;
      color: #4a5568;
      margin-bottom: 0.75rem;
      font-weight: 500;
    }

    .btn-bourse {
      display: block;
      width: 100%;
      text-align: center;
      padding: 0.85rem;
      border-radius: 12px;
      font-weight: 700;
      background: #f1f5f9;
      color: #1e293b;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }

    .bourse-card:hover .btn-bourse {
      background: #e53e3e;
      color: #ffffff;
      box-shadow: 0 6px 18px rgba(229, 62, 62, 0.2);
    }

    /* CARD INDIVIDUAL HOVER ACCENTS */
    .card-fret:hover { border-top: 4px solid #10b981; }
    .card-capacity:hover { border-top: 4px solid #3b82f6; }
    .card-storage:hover { border-top: 4px solid #ef4444; }

    /* KEY FEATURES SECTION */
    .features-section {
      padding: 6rem 0;
      background: #ffffff;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .feature-card {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.02);
      transition: all 0.4s ease;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.05);
      border-color: #e2e8f0;
    }

    .feature-img-wrapper {
      height: 200px;
      overflow: hidden;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .feature-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }

    .feature-card:hover .feature-img {
      transform: scale(1.05);
    }

    .feature-body {
      padding: 2rem;
    }

    .feature-body h3 {
      font-size: 1.35rem;
      font-weight: 800;
      color: #1a202c;
      margin-bottom: 0.5rem;
    }

    .feature-lead {
      color: #718096;
      font-size: 0.88rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .feature-checklist {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .feature-checklist li {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.92rem;
      color: #4a5568;
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }

    .feature-checklist span {
      color: #e53e3e;
      font-weight: bold;
    }

    /* STEP SECTION (COMMENT CA MARCHE) */
    .steps-section {
      padding: 5rem 0;
      background: #0f172a;
      color: #ffffff;
      position: relative;
    }

    .steps-header {
      text-align: center;
      margin-bottom: 4rem;
    }

    .steps-header h2 {
      font-size: 2.25rem;
      font-weight: 850;
      margin-bottom: 0.75rem;
    }

    .steps-header p {
      color: #94a3b8;
      font-size: 1.05rem;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2.5rem;
    }

    .step-card {
      text-align: center;
      position: relative;
      padding: 1rem;
    }

    .step-number {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #e53e3e, #b91c1c);
      color: #ffffff;
      font-size: 1.75rem;
      font-weight: 900;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 10px 20px rgba(229, 62, 62, 0.3);
      position: relative;
      z-index: 2;
    }

    .step-card h4 {
      font-size: 1.2rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
      color: #f8fafc;
    }

    .step-card p {
      color: #94a3b8;
      font-size: 0.92rem;
      line-height: 1.6;
    }

    /* Steps Connector Line */
    .steps-grid::before {
      content: '';
      position: absolute;
      top: 85px;
      left: 15%;
      right: 15%;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      z-index: 1;
    }

    /* NEWS FEED SECTION */
    .news-section {
      padding: 6rem 0;
      background: #f8fafc;
    }

    .news-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .news-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 2.25rem 2rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.3s ease;
    }

    .news-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.03);
      border-color: #cbd5e1;
    }

    .news-badge {
      display: inline-block;
      align-self: flex-start;
      padding: 0.25rem 0.75rem;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 4px;
      margin-bottom: 1.25rem;
    }

    .news-content span {
      font-size: 0.8rem;
      color: #94a3b8;
      display: block;
      margin-bottom: 0.5rem;
    }

    .news-content h3 {
      font-size: 1.2rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.4;
      margin-bottom: 0.75rem;
    }

    .news-content p {
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .news-link {
      color: #e53e3e;
      font-weight: 700;
      font-size: 0.9rem;
      text-decoration: none;
    }

    .news-link:hover {
      color: #b91c1c;
    }

    /* INTERACTIVE CONTACT / PUBLICATION LEAD FORM */
    .form-section {
      padding: 6rem 0;
      background: #0f172a;
      position: relative;
      overflow: hidden;
      color: #ffffff;
    }

    .form-glow {
      position: absolute;
      top: -20%;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 350px;
      background: radial-gradient(circle, rgba(229, 62, 62, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    .form-container-box {
      max-width: 800px;
      position: relative;
      z-index: 2;
    }

    .form-header {
      text-align: center;
      margin-bottom: 3.5rem;
    }

    .form-header h2 {
      font-size: 2.25rem;
      font-weight: 850;
      margin-bottom: 0.75rem;
      color: #ffffff;
    }

    .form-header p {
      color: #94a3b8;
      font-size: 1.05rem;
    }

    .lead-form {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 3rem 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      width: 100%;
    }

    .lead-form label {
      font-size: 0.88rem;
      font-weight: 700;
      color: #e2e8f0;
      letter-spacing: 0.5px;
    }

    .lead-form input, 
    .lead-form select, 
    .lead-form textarea {
      padding: 0.9rem 1.2rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #ffffff;
      outline: none;
      font-size: 0.95rem;
      font-family: inherit;
      transition: all 0.3s ease;
    }

    .lead-form input::placeholder,
    .lead-form textarea::placeholder {
      color: #475569;
    }

    .lead-form input:focus, 
    .lead-form select:focus, 
    .lead-form textarea:focus {
      border-color: #e53e3e;
      box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.15);
      background: rgba(15, 23, 42, 0.85);
    }

    .lead-form select option {
      background: #0f172a;
      color: #ffffff;
    }

    .btn-submit-red {
      display: block;
      width: 100%;
      padding: 1rem;
      border-radius: 12px;
      background: #e53e3e;
      color: #ffffff;
      font-weight: 800;
      font-size: 1.05rem;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(229, 62, 62, 0.3);
      transition: all 0.3s ease;
    }

    .btn-submit-red:hover {
      background: #c53030;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(229, 62, 62, 0.45);
    }

    /* DYNAMIC SUCCESS FORM TOAST */
    .form-success-toast {
      background: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(15px);
      border: 2px solid #10b981;
      border-radius: 24px;
      padding: 4rem 3rem;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      animation: zoomIn 0.4s ease-out;
    }

    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .success-icon {
      font-size: 3.5rem;
      margin-bottom: 1.5rem;
      animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes pop {
      0% { transform: scale(0.5); }
      100% { transform: scale(1); }
    }

    .success-message h4 {
      font-size: 1.5rem;
      font-weight: 850;
      color: #10b981;
      margin-bottom: 0.5rem;
    }

    .success-message p {
      color: #94a3b8;
      font-size: 1.05rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .btn-reset-form {
      padding: 0.8rem 2rem;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.15);
      background: transparent;
      color: #ffffff;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-reset-form:hover {
      background: rgba(255,255,255,0.1);
      border-color: #ffffff;
    }

    /* RESPONSIVE DESIGN */
    @media (max-width: 1024px) {
      .hero-grid {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 2rem;
      }
      .hero-image-container {
        order: -1;
        max-width: 500px;
        margin: 0 auto;
      }
      .search-container {
        margin: 0 auto 2rem;
      }
      .hero-actions {
        justify-content: center;
      }
      .brands-grid {
        grid-template-columns: repeat(4, 1fr);
      }
      .bourses-grid, 
      .features-grid, 
      .steps-grid, 
      .news-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      .steps-grid::before {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.5rem;
      }
      .brands-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      .form-row {
        grid-template-columns: 1fr;
        gap: 0;
      }
      .lead-form {
        padding: 2rem 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .brands-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .search-box {
        padding: 0.3rem 0.3rem 0.3rem 0.75rem;
      }
      .btn-search {
        padding: 0.6rem 1rem;
        font-size: 0.85rem;
      }
    }
  `]
})
export class AboutComponent {
  searchQuery: string = '';
  formSubmitted: boolean = false;

  formData = {
    name: '',
    email: '',
    phone: '',
    service: 'Fret',
    message: ''
  };

  brands = [
    { name: 'SCANIA' },
    { name: 'TruckStore' },
    { name: 'MAN' },
    { name: 'IVECO' },
    { name: 'DAF' },
    { name: 'KRONE' },
    { name: 'SCHMITZ CARGOBULL' },
    { name: 'VOLVO' },
    { name: 'RENAULT TRUCKS' },
    { name: 'ELKON' },
    { name: 'ZEPPELIN' },
    { name: 'CAT' }
  ];

  onSearch() {
    if (this.searchQuery.trim()) {
      alert(`Recherche en cours pour : "${this.searchQuery}"`);
    }
  }

  scrollToForm() {
    const el = document.getElementById('publication-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onSubmitForm(event: Event) {
    event.preventDefault();
    if (this.formData.name && this.formData.email && this.formData.phone && this.formData.message) {
      this.formSubmitted = true;
    }
  }

  resetForm() {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      service: 'Fret',
      message: ''
    };
    this.formSubmitted = false;
  }
}
