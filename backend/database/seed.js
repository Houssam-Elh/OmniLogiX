const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('./db-connection');

// Import models
const Product = require('../models/Product');
const Actor = require('../models/Actor');
const Event = require('../models/Event');
const FAQ = require('../models/FAQ');
const Forum = require('../models/Forum');
const Taxonomy = require('../models/Taxonomy');
const Bourse = require('../models/Bourse');

// Helper to recursively clean $oid and $date in exported JSON data
function cleanMongoJSON(data) {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map(item => cleanMongoJSON(item));
  }

  if (typeof data === 'object') {
    // Check if it is $oid
    if (data.$oid && typeof data.$oid === 'string') {
      return data.$oid; // Return string id directly
    }
    // Check if it is $date
    if (data.$date) {
      return new Date(data.$date); // Convert to JS Date
    }

    // Traverse keys
    const cleanedObj = {};
    for (const [key, value] of Object.entries(data)) {
      cleanedObj[key] = cleanMongoJSON(value);
    }
    return cleanedObj;
  }

  return data;
}

// Sample Bourses listings from frontend data.js to seed default listings
const sampleBourses = [
  {
    category: "Bourse de Fret",
    title: "Recherche Camion Plateau (24 T) - Acier",
    origin: "Casablanca Port",
    destination: "Tanger Med",
    cargo: "Tôles et bobines métalliques",
    price: "Sur devis",
    date: "Départ immédiat"
  },
  {
    category: "Bourse de Fret",
    title: "Fret disponible : Agrumes sous T° Dirigée (12 T)",
    origin: "Marrakech-Safi",
    destination: "Agadir Port de Pêche",
    cargo: "Agrumes conditionnés en caisses",
    price: "4 200 MAD",
    date: "Sous 24h"
  },
  {
    category: "Bourse Messagerie & Express",
    title: "Messagerie Rapide Express : Palette urgent 500 kg",
    origin: "Casablanca-Mohammedia",
    destination: "Fès Centre",
    cargo: "Composants électroniques",
    price: "1 200 MAD",
    date: "Aujourd'hui avant 18:00"
  },
  {
    category: "Bourse de Capacité",
    title: "Capacité disponible : Semi-remorque Tautliner vide",
    origin: "Fès",
    destination: "Oujda Angad",
    cargo: "Fret général sec accepté",
    price: "Sur devis",
    date: "Demain matin"
  },
  {
    category: "Bourse Entreposage",
    title: "Bourse Entreposage : Espace disponible 300 Palettes",
    origin: "Zone Industrielle Sapino (Nouaceur)",
    destination: "Casablanca",
    cargo: "Entrepôt classe A sous vidéosurveillance",
    price: "60 MAD / Palette / Mois",
    date: "Disponible immédiatement"
  },
  {
    category: "Bourse des Chauffeurs",
    title: "Chauffeur routier disponible avec permis C / EC",
    origin: "Tanger Ville",
    destination: "National (Maroc)",
    cargo: "8 ans d'expérience nationale, FIMO valide",
    price: "Sur devis",
    date: "Semaine prochaine"
  }
];

async function seedDatabase() {
  try {
    console.log('\x1b[36m[Seeding]\x1b[0m Connexion à la base de données...');
    await connectDB();

    console.log('\x1b[36m[Seeding]\x1b[0m Nettoyage des collections existantes...');
    await Promise.all([
      Product.deleteMany({}),
      Actor.deleteMany({}),
      Event.deleteMany({}),
      FAQ.deleteMany({}),
      Taxonomy.deleteMany({}),
      Bourse.deleteMany({}),
      Forum.deleteMany({})
    ]);
    console.log('\x1b[32m[Seeding]\x1b[0m Collections nettoyées.');

    const basePath = path.join(__dirname, '../data/package-models-corrected');

    // 1. Seed Products
    const productsFilePath = path.join(basePath, 'produit-service/produitService.json');
    if (fs.existsSync(productsFilePath)) {
      console.log('\x1b[36m[Seeding]\x1b[0m Chargement des Produits/Services...');
      const raw = fs.readFileSync(productsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      const cleaned = cleanMongoJSON(parsed);
      await Product.insertMany(cleaned);
      console.log(`\x1b[32m[Seeding]\x1b[0m ${cleaned.length} Produits importés.`);
    } else {
      console.log('\x1b[33m[Seeding Warning]\x1b[0m Fichier produitService.json introuvable.');
    }

    // 2. Seed Actors
    const actorsFilePath = path.join(basePath, 'acteur-pro/acteursPro.json');
    if (fs.existsSync(actorsFilePath)) {
      console.log('\x1b[36m[Seeding]\x1b[0m Chargement des Acteurs Professionnels...');
      const raw = fs.readFileSync(actorsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      const cleaned = cleanMongoJSON(parsed);
      await Actor.insertMany(cleaned);
      console.log(`\x1b[32m[Seeding]\x1b[0m ${cleaned.length} Acteurs importés.`);
    }

    // 3. Seed Events
    const eventsFilePath = path.join(basePath, 'event/agendaEvent.json');
    if (fs.existsSync(eventsFilePath)) {
      console.log('\x1b[36m[Seeding]\x1b[0m Chargement de l\'Agenda Événementiel...');
      const raw = fs.readFileSync(eventsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      const cleaned = cleanMongoJSON(parsed);
      await Event.insertMany(cleaned);
      console.log(`\x1b[32m[Seeding]\x1b[0m ${cleaned.length} Événements importés.`);
    }

    // 4. Seed FAQs
    const faqFilePath = path.join(basePath, 'faq/faq.json');
    if (fs.existsSync(faqFilePath)) {
      console.log('\x1b[36m[Seeding]\x1b[0m Chargement de la FAQ...');
      const raw = fs.readFileSync(faqFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      const cleaned = cleanMongoJSON(parsed);
      await FAQ.insertMany(cleaned);
      console.log(`\x1b[32m[Seeding]\x1b[0m ${cleaned.length} FAQs importées.`);
    }

    // 5. Seed Taxonomies
    const taxonomyFilePath = path.join(basePath, 'taxonomie/taxonomie.json');
    const domainFilePath = path.join(basePath, 'taxonomie/domain.json');
    let taxCount = 0;

    if (fs.existsSync(domainFilePath)) {
      console.log('\x1b[36m[Seeding]\x1b[0m Chargement des Domaines de Taxonomie...');
      const raw = fs.readFileSync(domainFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      const cleaned = cleanMongoJSON(parsed);
      await Taxonomy.insertMany(cleaned);
      taxCount += cleaned.length;
    }
    if (fs.existsSync(taxonomyFilePath)) {
      console.log('\x1b[36m[Seeding]\x1b[0m Chargement de la Taxonomie Globale...');
      const raw = fs.readFileSync(taxonomyFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      const cleaned = cleanMongoJSON(parsed);
      await Taxonomy.insertMany(cleaned);
      taxCount += cleaned.length;
    }
    console.log(`\x1b[32m[Seeding]\x1b[0m ${taxCount} Éléments de Taxonomie importés.`);

    // 6. Seed Sample Bourses
    console.log('\x1b[36m[Seeding]\x1b[0m Chargement des annonces de Bourses...');
    await Bourse.insertMany(sampleBourses);
    console.log(`\x1b[32m[Seeding]\x1b[0m ${sampleBourses.length} Annonces de bourses insérées.`);

    // 7. Seed Sample Forums
    console.log('\x1b[36m[Seeding]\x1b[0m Chargement des thèmes de Forums...');
    const sampleForums = [
      { title: "Transport routier national", description: "Échanges autour du transport de fret routier au Maroc, réglementation et tarifs.", category: "Bourse de Fret" },
      { title: "Gestion de flotte de chariots", description: "Conseils et astuces sur la maintenance préventive et le choix de chariots de manutention.", category: "Manutention" },
      { title: "Optimisation de l'entreposage", description: "Discussions sur l'organisation spatiale des entrepôts et le choix des racks.", category: "Entreposage" }
    ];
    await Forum.insertMany(sampleForums);
    console.log(`\x1b[32m[Seeding]\x1b[0m ${sampleForums.length} Sujets de forums créés.`);

    console.log('\x1b[32;1m[Seeding Succès] Base de données OMNILOG entièrement peuplée !\x1b[0m');
  } catch (error) {
    console.error('\x1b[31;1m[Seeding Échec] Erreur critique lors de la génération de la base :\x1b[0m', error);
  } finally {
    await mongoose.disconnect();
    console.log('\x1b[36m[Seeding]\x1b[0m Déconnexion réussie.');
  }
}

seedDatabase();
