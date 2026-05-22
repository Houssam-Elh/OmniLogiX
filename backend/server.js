const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omnilog';

// Database state
let useFallback = false;
let inMemoryDevis = [];
let inMemoryProducts = [];
let inMemoryBourses = [];

// Try to connect to MongoDB, otherwise set fallback flag
const mongoose = require('mongoose');
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
  .then(() => {
    console.log(`\x1b[32m[MongoDB]\x1b[0m Connecté à la base de données : ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.warn(`\x1b[33m[MongoDB Warning]\x1b[0m Connexion impossible. Passage en MODE FALLBACK (Base de données en mémoire via JSON locaux).`);
    useFallback = true;
    initializeInMemoryDatabase();
  });

// Initialize dynamic in-memory database using local JSON files when MongoDB is not running
function initializeInMemoryDatabase() {
  try {
    const basePath = path.join(__dirname, 'data/package-models-corrected');
    
    // Load Products
    const productsPath = path.join(basePath, 'produit-service/produitService.json');
    if (fs.existsSync(productsPath)) {
      const raw = fs.readFileSync(productsPath, 'utf8');
      inMemoryProducts = JSON.parse(raw);
      console.log(`\x1b[36m[Fallback]\x1b[0m ${inMemoryProducts.length} Produits chargés en mémoire.`);
    }

    // Load Default Bourses listings
    inMemoryBourses = [
      {
        id: "b1",
        title: "Recherche Camion Plateau (24 T) - Acier",
        origin: "Casablanca Port",
        destination: "Tanger Med",
        cargo: "Tôles et bobines métalliques",
        price: "Sur devis",
        date: "Départ immédiat",
        category: "Bourse de Fret"
      },
      {
        id: "b2",
        title: "Fret disponible : Agrumes sous T° Dirigée (12 T)",
        origin: "Marrakech-Safi",
        destination: "Agadir Port de Pêche",
        cargo: "Agrumes conditionnés en caisses",
        price: "4 200 MAD",
        date: "Sous 24h",
        category: "Bourse de Fret"
      },
      {
        id: "b3",
        title: "Messagerie Rapide Express : Palette urgent 500 kg",
        origin: "Casablanca-Mohammedia",
        destination: "Fès Centre",
        cargo: "Composants électroniques",
        price: "1 200 MAD",
        date: "Aujourd'hui avant 18:00",
        category: "Bourse Messagerie & Express"
      },
      {
        id: "b4",
        title: "Capacité disponible : Semi-remorque Tautliner vide",
        origin: "Fès",
        destination: "Oujda Angad",
        cargo: "Fret général sec accepté",
        price: "Sur devis",
        date: "Demain matin",
        category: "Bourse de Capacité"
      },
      {
        id: "b5",
        title: "Bourse Entreposage : Espace disponible 300 Palettes",
        origin: "Zone Industrielle Sapino (Nouaceur)",
        destination: "Casablanca",
        cargo: "Entrepôt classe A sous vidéosurveillance",
        price: "60 MAD / Palette / Mois",
        date: "Disponible immédiatement",
        category: "Bourse Entreposage"
      },
      {
        id: "b6",
        title: "Chauffeur routier disponible avec permis C / EC",
        origin: "Tanger Ville",
        destination: "National (Maroc)",
        cargo: "8 ans d'expérience nationale, FIMO valide",
        price: "Sur devis",
        date: "Semaine prochaine",
        category: "Bourse des Chauffeurs"
      }
    ];
    console.log(`\x1b[36m[Fallback]\x1b[0m ${inMemoryBourses.length} Annonces de Bourses chargées.`);
  } catch (err) {
    console.error('\x1b[31m[Fallback Error]\x1b[0m Échec du chargement des JSON locaux :', err.message);
  }
}

// ----------------------------------------------------
// ROUTES API
// ----------------------------------------------------

// 1. Authentification & Utilisateurs
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Veuillez spécifier un e-mail et un mot de passe." });
  }

  // Simulate authentication for fast preview or fallback
  res.json({
    message: "Connexion réussie",
    token: "mock-jwt-token-omnilog-2026",
    user: {
      name: email.split('@')[0],
      email: email,
      role: email.includes('vendeur') ? 'Vendeur' : email.includes('transporteur') ? 'Transporteur' : 'Acheteur'
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  res.json({
    message: "Compte créé avec succès. Vous pouvez maintenant vous connecter.",
    user: { name, email, role: role || 'Acheteur' }
  });
});

// 2. Produits & Catalogues
const Product = require('./models/Product');
app.get('/api/products', async (req, res) => {
  try {
    const category = req.query.category;
    let products = [];

    if (!useFallback) {
      const query = category && category !== 'Tous' ? { typeProduit: category } : {};
      products = await Product.find(query).limit(100);
      
      // If MongoDB returns 0 records, load from in-memory fallback
      if (products.length === 0) {
        products = inMemoryProducts;
      }
    } else {
      products = inMemoryProducts;
    }

    // Format products cleanly for Angular client
    const formatted = products.map(p => {
      const trans = p.translations && p.translations[0] ? p.translations[0] : {};
      return {
        id: p._id,
        name: trans.designationProduit || p.name || 'Produit Logistique',
        brand: p.marque || 'Générique',
        price: p.tarifUHTPardefaut ? `${p.tarifUHTPardefaut} MAD` : 'Sur devis',
        image: p.image || 'images/produits/transpalette-manuel-2500-kg-jungheinrich-am22.jpg',
        category: p.category || (p.typeProduit === 'code_19323' ? 'Manutention' : 'Entreposage'),
        description: trans.descriptifProduit || p.description || 'Matériel professionnel de logistique.'
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des produits", error: error.message });
  }
});

// 3. Bourses logistiques
const Bourse = require('./models/Bourse');
app.get('/api/bourses', async (req, res) => {
  try {
    const category = req.query.category;
    let bourses = [];

    if (!useFallback) {
      const query = category && category !== 'Tous' ? { category } : {};
      bourses = await Bourse.find(query);
      if (bourses.length === 0) bourses = inMemoryBourses;
    } else {
      bourses = inMemoryBourses;
    }

    if (category && category !== 'Tous') {
      bourses = bourses.filter(b => b.category === category);
    }

    res.json(bourses);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de la bourse", error: error.message });
  }
});

app.post('/api/bourses', async (req, res) => {
  try {
    const { category, title, origin, destination, cargo, date, price } = req.body;
    const newEntry = { category, title, origin, destination, cargo, date, price, active: true };

    if (!useFallback) {
      const entry = new Bourse(newEntry);
      await entry.save();
      res.status(201).json(entry);
    } else {
      newEntry.id = 'b' + (inMemoryBourses.length + 1);
      inMemoryBourses.unshift(newEntry);
      res.status(201).json(newEntry);
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur de création de l'annonce", error: error.message });
  }
});

// 4. Devis Express
const Devis = require('./models/Devis');
app.post('/api/devis', async (req, res) => {
  try {
    const { productName, userName, company, email, phone, message } = req.body;
    const newDevis = { productName, userName, company, email, phone, message, status: 'Pending' };

    if (!useFallback) {
      const devis = new Devis(newDevis);
      await devis.save();
      res.status(201).json({ message: "Demande de devis enregistrée avec succès !", data: devis });
    } else {
      inMemoryDevis.push(newDevis);
      res.status(201).json({ message: "Demande de devis enregistrée en mémoire (Fallback) !", data: newDevis });
    }
  } catch (error) {
    res.status(500).json({ message: "Échec de l'enregistrement de la demande de devis", error: error.message });
  }
});

app.get('/api/devis', async (req, res) => {
  try {
    if (!useFallback) {
      const devisList = await Devis.find();
      res.json(devisList);
    } else {
      res.json(inMemoryDevis);
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// 7. Domains & Taxonomies API
app.get('/api/domains', async (req, res) => {
  try {
    if (!useFallback) {
      const domainsCollection = mongoose.connection.collection("domains");
      const list = await domainsCollection.find({}).toArray();
      if (list.length > 0) return res.json(list);
    }
    
    const backupPath = path.join(__dirname, 'database/taxonomie/autoline_domains.json');
    if (fs.existsSync(backupPath)) {
      const raw = fs.readFileSync(backupPath, 'utf8');
      return res.json(JSON.parse(raw));
    }
    res.status(404).json({ message: "No domains found" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get('/api/taxonomies', async (req, res) => {
  try {
    if (!useFallback) {
      const taxonomiesCollection = mongoose.connection.collection("taxonomies");
      const list = await taxonomiesCollection.find({}).toArray();
      if (list.length > 0) return res.json(list);
    }
    
    const backupPath = path.join(__dirname, 'database/taxonomie/autoline_taxonomies.json');
    if (fs.existsSync(backupPath)) {
      const raw = fs.readFileSync(backupPath, 'utf8');
      return res.json(JSON.parse(raw));
    }
    res.status(404).json({ message: "No taxonomies found" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 5. Chatbot IA avec RAG / Base documentaire
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: "Le message est vide." });
  }

  const query = message.toLowerCase();
  let response = "Désolé, je n'ai pas bien compris votre demande. Je suis l'assistant IA OMNILOG. Je peux vous renseigner sur nos bourses logistiques, notre marketplace de manutention et nos services administratifs.";

  // Dynamic Simulative RAG Knowledge Matching
  if (query.includes('bourse') || query.includes('fret') || query.includes('camion')) {
    response = "OMNILOG propose 5 bourses logistiques en temps réel au Maroc : la Bourse de Fret (recherche de camions), la Bourse Messagerie & Express (petits colis), la Bourse de Capacité (semi-remorques vides), la Bourse d'Entreposage (stockage palettes) et la Bourse des Chauffeurs.";
  } else if (query.includes('devis') || query.includes('tarif') || query.includes('prix')) {
    response = "Pour obtenir un devis express, rendez-vous sur notre Espace Marketplace, sélectionnez le matériel souhaité (ex: Transpalette Jungheinrich ou Racks de stockage Mecalux) et cliquez sur 'Devis Express'. Un conseiller reviendra vers vous sous 24h.";
  } else if (query.includes('malus') || query.includes('ecologique') || query.includes('taxe')) {
    response = "Au Maroc, le malus écologique s'applique sur l'achat de véhicules neufs de plus de 11 CV fiscaux. Les véhicules électriques et hybrides bénéficient d'exonérations totales ou partielles de taxes.";
  } else if (query.includes('stripe') || query.includes('payer') || query.includes('abonnement')) {
    response = "OMNILOG intègre la solution sécurisée Stripe. Nos abonnements premium pour les professionnels (transporteurs et vendeurs) commencent à partir de 299 MAD / mois, vous permettant de publier des annonces illimitées.";
  } else if (query.includes('contact') || query.includes('support') || query.includes('aide')) {
    response = "Vous pouvez contacter notre support client directement à l'adresse support@omnilog.ma ou par téléphone au +212 5 22 12 34 56 (Casablanca).";
  }

  res.json({ reply: response });
});

// 6. Paiement Stripe
app.post('/api/stripe/checkout', (req, res) => {
  const { planName, amount } = req.body;
  // Simulate Stripe session creation
  res.json({
    url: `https://checkout.stripe.com/pay/mock_session_omnilog_${Date.now()}`,
    sessionId: `cs_test_mocksession${Date.now()}`
  });
});

// ----------------------------------------------------
// SOCKET.IO REALTIME MESSAGING
// ----------------------------------------------------
io.on('connection', (socket) => {
  console.log(`\x1b[34m[WebSocket]\x1b[0m Nouveau client connecté : ${socket.id}`);

  // Join a transaction discussion room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`\x1b[34m[WebSocket]\x1b[0m Client ${socket.id} a rejoint le salon : ${roomId}`);
  });

  // Handle buyer-seller messages
  socket.on('send_message', (data) => {
    const { roomId, sender, message, timestamp } = data;
    io.to(roomId).emit('receive_message', {
      sender,
      message,
      timestamp: timestamp || new Date().toISOString()
    });
    console.log(`\x1b[34m[WebSocket]\x1b[0m Message envoyé dans ${roomId} par ${sender}`);
  });

  socket.on('disconnect', () => {
    console.log(`\x1b[34m[WebSocket]\x1b[0m Client déconnecté : ${socket.id}`);
  });
});

// Serve frontend static files in production if needed
app.use(express.static(path.join(__dirname, '../frontend/dist/frontend/browser')));

// Fallback all other routes to index.html for Angular SPA routing
app.get('*', (req, res, next) => {
  const frontendIndex = path.join(__dirname, '../frontend/dist/frontend/browser/index.html');
  if (fs.existsSync(frontendIndex)) {
    res.sendFile(frontendIndex);
  } else {
    res.json({ message: "Serveur API OMNILOG actif. En attente de la compilation Angular." });
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`\x1b[32;1m[Serveur OMNILOG] Démarré avec succès sur le port ${PORT} !\x1b[0m`);
});
