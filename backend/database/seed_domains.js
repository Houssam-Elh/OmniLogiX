const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/omnilog";

// Define the 5 main parent domains to seed
const parentsToSeed = [
  {
    _id: new mongoose.Types.ObjectId("737667737667737667000101"),
    code: "trucks_buses",
    translations: [
      { language: "fr", designation: "Poids lourds & Autobus", description: "Poids lourds et autobus" },
      { language: "en", designation: "Trucks, buses", description: "Trucks and buses" }
    ],
    logo: "",
    parent: null,
    children: [],
    taxonomies: [],
    hasTaxonomies: false,
    etatObjet: "code-1",
    etatCreation: "etatCreation.creation",
    totalAds: 448936,
    count: 448936,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId("737667737667737667000102"),
    code: "cars_motorhomes_motorcycles",
    translations: [
      { language: "fr", designation: "Voitures & Motos", description: "Voitures, camping-cars et motos" },
      { language: "en", designation: "Cars, motorhomes and motorcycles", description: "Cars, motorhomes and motorcycles" }
    ],
    logo: "",
    parent: null,
    children: [],
    taxonomies: [],
    hasTaxonomies: false,
    etatObjet: "code-1",
    etatCreation: "etatCreation.creation",
    totalAds: 14830,
    count: 14830,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId("737667737667737667000103"),
    code: "construction_equipment",
    translations: [
      { language: "fr", designation: "Matériel de construction", description: "Matériel de construction" },
      { language: "en", designation: "Construction equipment", description: "Construction equipment" }
    ],
    logo: "",
    parent: null,
    children: [],
    taxonomies: [],
    hasTaxonomies: false,
    etatObjet: "code-1",
    etatCreation: "etatCreation.creation",
    totalAds: 356747,
    count: 356747,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId("737667737667737667000104"),
    code: "material_handling_equipment",
    translations: [
      { language: "fr", designation: "Matériel de manutention", description: "Matériel de manutention" },
      { language: "en", designation: "Material handling equipment", description: "Material handling equipment" }
    ],
    logo: "",
    parent: null,
    children: [],
    taxonomies: [],
    hasTaxonomies: false,
    etatObjet: "code-1",
    etatCreation: "etatCreation.creation",
    totalAds: 35423,
    count: 35423,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId("737667737667737667000105"),
    code: "attachments_spare_parts_services",
    translations: [
      { language: "fr", designation: "Équipements & Pièces", description: "Accessoires, pièces de rechange et services" },
      { language: "en", designation: "Attachments, spare parts, services", description: "Attachments, spare parts and services" }
    ],
    logo: "",
    parent: null,
    children: [],
    taxonomies: [],
    hasTaxonomies: false,
    etatObjet: "code-1",
    etatCreation: "etatCreation.creation",
    totalAds: 340417,
    count: 340417,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mapping of 26 original subcategory domain IDs to parent domain ObjectIds
const childToParentMap = {
  // Poids lourds & Autobus
  "d3a469af77a2399d69b779d5": "737667737667737667000101", // Poids Lourds
  "fd91b7bc0069f40cf1adbb4f": "737667737667737667000101", // Tracteurs Routiers
  "250dac0ab7103ca09a3de55f": "737667737667737667000101", // Remorques
  "2b20f896bdd946579ca1103a": "737667737667737667000101", // Camions Occasion
  "43144269a0ca9179fc78ab00": "737667737667737667000101", // Transport Passagers
  "46ad4c1e75c9d9d3afc013df": "737667737667737667000101", // Aéroportuaire
  "06b6871d02854b07b47d833d": "737667737667737667000101", // Ferroviaire

  // Voitures & Motos
  "545e96ae18f1dedfc258923d": "737667737667737667000102", // Véhicules Légers
  "2b8015bd253217d086899365": "737667737667737667000102", // Camping
  "5f75591426a93df389a6ba45": "737667737667737667000102", // Deux-Roues
  "5fff5ce09cda01210d1a1935": "737667737667737667000102", // Maritime
  "13359332cf985ae19d341e08": "737667737667737667000102", // Aérien

  // Matériel de construction
  "af67e8eb26ec9fdce01543b5": "737667737667737667000103", // BTP
  "feb6e3eeeb24446f956a51b5": "737667737667737667000103", // Engins TP
  "13e24dcafcd1479080eedc30": "737667737667737667000103", // Forestier
  "07e6b4b1feb846cfba10b862": "737667737667737667000103", // Espaces Verts

  // Matériel de manutention
  "1882699d1c0cfb06962f50df": "737667737667737667000104", // Manutention
  "23b9e10370ebfc9b5006b957": "737667737667737667000104", // Modules & Containers
  "ebbc986dd24ff3ebfc7b13cc": "737667737667737667000104", // Équipements Chargement

  // Équipements & Pièces
  "66323c2a0000000000000003": "737667737667737667000105", // Tracteurs
  "61c9297cecbe43dfbdb896b9": "737667737667737667000105", // Agriculture
  "3fbf73a2044cc89f14f14c05": "737667737667737667000105", // Transport Marchandises
  "569d56a5043d19bca57f8db8": "737667737667737667000105", // Transport Carburant
  "bd9e19005ca4c937a3fb1f4a": "737667737667737667000105", // Utilitaires
  "c3ea28cd2634d0ddc0701c16": "737667737667737667000105", // Assainissement
  "32339d60c883ff7fd779ad0e": "737667737667737667000105"  // Attelages
};

// We will also load all the SVG icons map to match each subcategory cleanly
const subcategorySvgMap = {
  // Poids lourds & Autobus
  "d3a469af77a2399d69b779d5": "Trucks.svg",
  "fd91b7bc0069f40cf1adbb4f": "Truck tractors.svg",
  "250dac0ab7103ca09a3de55f": "Trailers.svg",
  "2b20f896bdd946579ca1103a": "Trucks.svg",
  "43144269a0ca9179fc78ab00": "Buses.svg",
  "46ad4c1e75c9d9d3afc013df": "Airport equipment.svg",
  "06b6871d02854b07b47d833d": "Railway equipment.svg",

  // Voitures & Motos
  "545e96ae18f1dedfc258923d": "Cars.svg",
  "2b8015bd253217d086899365": "Campers.svg",
  "5f75591426a93df389a6ba45": "Motorcycles.svg",
  "5fff5ce09cda01210d1a1935": "Water transport.svg",
  "13359332cf985ae19d341e08": "Air Transport.svg",

  // Matériel de construction
  "af67e8eb26ec9fdce01543b5": "Equipment.svg",
  "feb6e3eeeb24446f956a51b5": "Excavators.svg",
  "13e24dcafcd1479080eedc30": "Cranes.svg",
  "07e6b4b1feb846cfba10b862": "Road construction equipment.svg",

  // Matériel de manutention
  "1882699d1c0cfb06962f50df": "Forklifts.svg",
  "23b9e10370ebfc9b5006b957": "Containers.svg",
  "ebbc986dd24ff3ebfc7b13cc": "Warehouse equipment.svg",

  // Équipements & Pièces
  "66323c2a0000000000000003": "Spare parts.svg",
  "61c9297cecbe43dfbdb896b9": "Tires and wheels.svg",
  "3fbf73a2044cc89f14f14c05": "Services.svg",
  "569d56a5043d19bca57f8db8": "Tank transports.svg",
  "bd9e19005ca4c937a3fb1f4a": "Commercial vehicles.svg",
  "c3ea28cd2634d0ddc0701c16": "Municipal vehicles.svg",
  "32339d60c883ff7fd779ad0e": "Rent.svg"
};

async function run() {
  console.log("---------------------------------------------------------");
  console.log("Starting Seeding for OMNILOGIX Domains (Original + Parents)...");
  console.log("---------------------------------------------------------");

  // Path to original domain.json
  const domainJsonPath = path.join(__dirname, "../../frontend/public/data/package-models-corrected/taxonomie/domain.json");
  if (!fs.existsSync(domainJsonPath)) {
    console.error("❌ Original domain.json file not found at " + domainJsonPath);
    return;
  }

  // Load original domains
  const originalDomains = JSON.parse(fs.readFileSync(domainJsonPath, "utf8"));
  console.log(`Loaded ${originalDomains.length} original domains from JSON.`);

  // We need to parse each original domain, ensuring they use ObjectId instances
  const formattedOriginals = originalDomains.map(d => {
    const id = new mongoose.Types.ObjectId(d._id.$oid || d._id);
    let parent = null;
    if (d.parent) {
      const parentIdStr = d.parent.$oid || d.parent;
      parent = new mongoose.Types.ObjectId(parentIdStr);
    }

    const children = (d.children || []).map(c => new mongoose.Types.ObjectId(c.$oid || c));
    const taxonomies = (d.taxonomies || []).map(t => new mongoose.Types.ObjectId(t.$oid || t));

    return {
      _id: id,
      code: d.code,
      translations: d.translations || [],
      parent: parent,
      children: children,
      taxonomies: taxonomies,
      hasTaxonomies: d.hasTaxonomies || false,
      etatObjet: d.etatObjet || "code-1",
      etatCreation: d.etatCreation || "etatCreation.creation",
      createdAt: d.createdAt && d.createdAt.$date ? new Date(d.createdAt.$date) : new Date(),
      updatedAt: d.updatedAt && d.updatedAt.$date ? new Date(d.updatedAt.$date) : new Date()
    };
  });

  // Now, let's map the 26 original subcategory domains to the new 5 parents!
  formattedOriginals.forEach(dom => {
    const idStr = dom._id.toString();
    const parentIdStr = childToParentMap[idStr];

    if (parentIdStr) {
      // Connect parent ID in child
      dom.parent = new mongoose.Types.ObjectId(parentIdStr);

      // Connect child ID in parent
      const parentObj = parentsToSeed.find(p => p._id.toString() === parentIdStr);
      if (parentObj) {
        parentObj.children.push(dom._id);
      }

      // Add logo/SVG if available
      const svgFile = subcategorySvgMap[idStr];
      if (svgFile) {
        dom.logo = `svgs/${svgFile}`;
        dom.svgFileName = svgFile;
        dom.svgRelativePath = `svgs/${svgFile}`;
      }
    }
  });

  // Combine both sets
  const allDomains = [...parentsToSeed, ...formattedOriginals];
  console.log(`Formatted total of ${allDomains.length} domains to seed (5 parents + ${formattedOriginals.length} originals).`);

  // Write fallback local JSON files
  const dbDir = path.join(__dirname, "taxonomie");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  try {
    fs.writeFileSync(
      path.join(dbDir, "autoline_domains.json"),
      JSON.stringify(allDomains, null, 2)
    );
    console.log("✅ LOCAL FALLBACK JSON BACKUPS GENERATED SUCCESSFULLY at backend/database/taxonomie/");
  } catch (err) {
    console.error("❌ Failed to write local JSON backup files:", err.message);
  }

  // Connect to MongoDB to attempt seeding
  try {
    console.log(`Connecting to MongoDB Atlas: ${MONGODB_URI.replace(/\/\/.*@/, "//***:***@")}...`);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
    console.log(`✅ Connected successfully to Database: ${mongoose.connection.name}`);

    const domainsCollection = mongoose.connection.collection("domains");
    
    console.log("Clearing 'domains' collection in DB...");
    await domainsCollection.deleteMany({});
    
    console.log(`Inserting ${allDomains.length} domains into database...`);
    const insertResult = await domainsCollection.insertMany(allDomains);
    console.log(`✅ Successfully seeded ${insertResult.insertedCount} domains in MongoDB!`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    console.log("OMNILOGIX Domains Seeding Completed Successfully.");
  } catch (err) {
    console.error("❌ Failed to seed MongoDB database:", err.message);
  }
}

run();
