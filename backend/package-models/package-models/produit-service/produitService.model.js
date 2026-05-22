const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let produitServiceSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    refProduit: { type: String, required: true, unique: true },
    categorieProduit: { type: Schema.Types.ObjectId, required: true },
    classe: {
      type: String,
      required: true,
      // enum: ["code_514", "code_3643"] 
    },
    venteSeule: { type: Boolean },
    typeVente: {
      type: String,
      required: false,
      default:'code_8305'
      // enum: ["code_8304", "code_8305", "code_8306"],
    },
    typeTarif: {
      type: String,
      required: false,
      default:'code_352'
      // enum: ["code_8311", "code_352", "code_2743", "code_1387", "code_8312"],
    },
    tarifSpecial: {
      type: [String],
      required: false,
      default:'code_8695'
      // enum: ["code_8699", "code_8698", "code_8697", "code_8696", "code_8695"],
    },
    // pays: {
    //   type: [String],
    //   required: true,
    //   enum: [],
    // },
    // region: {
    //   type: [String],
    //   required: true,
    //   enum: [],
    // },

    produitVertuel: { type: Boolean, required: true },
    produitTelechargeable: { type: Boolean, required: true },
    produitExterne: { type: Boolean, required: true },
    event: { type: String },
    dateDebutEvent: { type: Date },
    dateFinEvent: { type: Date },
    translations: {
      type: [
        {
          language: { type: String },
          designationProduit: { type: String },
          slogan: { type: String },
          descriptifProduit: { type: String },
          message: { type: String },
          messageBoutonSiExteme: { type: String },
          tags: { type: [String] },
        },
      ],
    },
    indicationDuStock: {
      type: {
        refStockage: { type: String },
        etatStock: { type: String },
        indicationQuantiteDispo: { type: Boolean },
        quantiteDisponible: { type: Number, default: 0 },
        quantiteVendue: { type: Number, default: 0 },
        quantiteRestante: { type: Number, default: 0 },
        quantiteAfficher: { type: Number, default: 0 },
        dateDebut: { type: Date },
        dateFin: { type: Date },
      },
    },
    imageProduit: { type: String },
    madeInProduit: [{ type: Schema.Types.ObjectId }],
    unityProduit: { type: Schema.Types.Mixed },
    affichageTarif: {
      type: String,
      required: false,
      default:'code_8382'
      // enum: ["code_8381", "code_8382", "code_8383"],
    },
    tarifUHTPardefaut: { type: Number },
    monnaie: { type: Schema.Types.Mixed },
    tvaParDefaut: { type: Number },
    // paysTVADefaut: { type: Schema.Types.ObjectId },
    ordreAffichageProduit: { type: Number },
    commandeQuantiteRegelemente: { type: Boolean, required: true },
    qteMaxParCommande: { type: Number },
    qteMinParCommande: { type: Number },
    urlSiExteme: { type: String },
    afficherAvis: { type: Boolean },
    affichagePublic: { type: Boolean },
    // indicationEtatStock: { type: Boolean },
    relationAvecgestionStock: { type: Boolean },
    etatDePublication: {
      type: String,
      required: true,
      enum: ["code_541", "code_3516", "code_3417"],
    },
    produitPricipale: {
      type: Schema.Types.ObjectId,
      ref: "produitAssocie",
    },
    produitAssocie: [{ type: Schema.Types.ObjectId, ref: "produitAssocie" }],

    elementProduitAssocie: [
      { type: Schema.Types.ObjectId, ref: "elementProduitAssocie" },
    ],

    caracteristiqueAssocie: [
      { type: Schema.Types.ObjectId, ref: "caracteristiqueProduit" },
    ],
    grilleAssocie: [{ type: Schema.Types.ObjectId, ref: "grilleTarifaire" }],
    tarifIndicqtif: [{ type: Schema.Types.ObjectId, ref: "tarifUIndicatif" }],
    tarifSaisonnierAssocie: [
      { type: Schema.Types.ObjectId, ref: "tarifSaisonnier" },
    ],
    tarifVariable: [
      { type: Schema.Types.ObjectId, ref: "tarifUnitaireVariable" },
    ],
    codageProduitAssocie: [
      { type: Schema.Types.ObjectId, ref: "codageProduit" },
    ],
    marqueAssocie: { type: Schema.Types.ObjectId },
    distanction: [{ type: Schema.Types.ObjectId }],
    socialMediaAssocie: [{ type: Schema.Types.ObjectId }],
    garantieAssurance: [{ type: Schema.Types.ObjectId }],
    etatObjetAssocie: [{ type: Schema.Types.ObjectId }],
    contenueMediaAssocie: [{ type: Schema.Types.ObjectId }],
    instanceOffre: [{ type: Schema.Types.ObjectId }],
    indicationFraisAddi: [{ type: Schema.Types.ObjectId }],
    indicationStock: [{ type: Schema.Types.ObjectId }],
    parametreExped: { type: [ObjectId] },
    statistiqueDirectAssocie: [{ type: Schema.Types.ObjectId }],
    analyseAssocie: [{ type: Schema.Types.ObjectId }],
    objetAssocie: [{ type: Schema.Types.ObjectId }],
    instanceActeurAssocie: [{ type: Schema.Types.ObjectId }],
    instanceSegment: [{ type: Schema.Types.ObjectId }],
    criseRisqueAssocie: [{ type: Schema.Types.ObjectId }],
    typeRelation: [{ type: ObjectId, ref: "typeRelation" }],

    //#region new attribut declaration
    pricingRules: [{ type: Schema.Types.ObjectId }],
    catalogues: [{ type: Schema.Types.ObjectId }],
    detailsInventaires: [{ type: Schema.Types.ObjectId }],
    detailLivraison: [{ type: Schema.Types.ObjectId }],
    avantageEnNature: [{ type: Schema.Types.ObjectId }],
    avantagesEnNatures: [{ type: Schema.Types.ObjectId }],
    retours: [{ type: Schema.Types.ObjectId }],
    sav: [{ type: Schema.Types.ObjectId }],
    operationsLivraison: [{ type: Schema.Types.ObjectId }],
    fournisseurAssocie: { type: Schema.Types.ObjectId },
    objetsConcernes: {
      type: [
        {
          refObjet: { type: Schema.Types.ObjectId },
          typeObjet: { type: String },
        },
      ],
    },
    owner: {
      type: { type: String },
      ref: { type: ObjectId },
    },
    //#endregion
    //New instanceZone
    tarifLivraison: [{ type: Schema.Types.ObjectId, ref: "tarifLivraison" }],

    refReservation: { type: Schema.Types.ObjectId },
    nonDisponibilite: [{ type: Schema.Types.ObjectId }],

    typeProduit: {
      type: String,
      required: true,
    },

    disponibiliteContractuelle: [{ type: Schema.Types.ObjectId }],

    tempsMoyen: { type: Number },

    typePeriodeReservation: {
      type: String,
    },
    faq: [{ type: Schema.Types.ObjectId }],

    caracteristiquePhysique: {
      type: [
        {
          type: { type: String,
      // enum: [  'code_756','code_757','code_15581','code_16896','code_19625'],


           },
          valeur: { type: String },
        },
      ],
    },
  },
  { timestamps: true }
);

//  autoPopulate hook

produitServiceSchema.pre(/find.*/, async function (next) {
  try {
    this.populate([
      {
        path: "produitAssocie",
        match: { etatObjet: "code-1" },
        populate: [
          {
            path: "elementProduitAssocie",
            match: { etatObjet: "code-1" },
            populate: [
              {
                path: "refProduit",
                match: { etatObjet: "code-1" },
                populate: [],
              },
            ],
          },
        ],
      },
      {
        path: "caracteristiqueAssocie",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "grilleAssocie", match: { etatObjet: "code-1" }, populate: [] },
      { path: "tarifIndicqtif", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "tarifSaisonnierAssocie",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "tarifVariable", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "codageProduitAssocie",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "typeRelation",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "tarifLivraison",
        match: { etatObjet: "code-1" },
        populate: [],
      },
    ]);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
//refactor bloc for distantRequest
let i = 0;
/*new*/ /*new20*/ async function distantRequest(doc) {
  try {
    if (doc) {
      // if (doc instanceof Array) {
      //   console.log(i, '===>', Object.keys(doc[0]))
      //   i++
      // }
      await Promise.all(
        doc instanceof Array
          ? [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["categorieProduit", "unityProduit"],
                "VIEW_ITEMS",
                {}
              ),

              sendRPCRequest(
                doc,
                INSTANCEACTEURASSOCIE_ADMIN_RPC,
                ["instanceActeurAssocie"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-referenceObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                PROTAGONISTEPOTONTIEL_ADMIN_RPC,
                ["fournisseurAssocie"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-produitsLivraison -categorieProduitsLivraison -livreurs -produitService -documentsLegals -moment -etats -opportinutes -risques -criteresConditions -echangesCommunications -incidents -elementsBudgets -activites -objetsAssocies -caracteristiques -referentiels -instructions -reglesActivations -echangesEtCommunications",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                INSTANCEOFFRE_ADMIN_RPC,
                ["instanceOffre"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-produitService -refObjetConcerne -refPricingRule -instanceCritere -regleAssocie -statistique -protagonistesPotentiels",
                  },
                }
              ),

              sendRPCRequest(
                doc,
                MONNAIE_ADMIN_RPC,
                ["monnaie"],
                "VIEW_ITEMS",
                {}
              ),

              sendRPCRequest(
                doc,
                INDICATIONFRAISADDITIONNELLE_ADMIN_RPC,
                ["indicationFraisAddi"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-refPrisingRule -instanceCritere -regleInclusionOuExlusion -refStatistique",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                NONDISPONIBILITE_ADMIN_RPC,
                ["nonDisponibilite"],
                "VIEW_ITEMS",
                {}
              ),

              sendRPCRequest(
                doc,
                DISPONIBILITECONTRACTUELLE_ADMIN_RPC,
                ["disponibiliteContractuelle"],
                "VIEW_ITEMS",
                {}
              ),
             /* sendRPCRequest(doc, FAQ_ADMIN_RPC, ["faq"], "VIEW_ITEMS", {
                queryOptions: {
                  select: "-objetsAssocies -etats -objetsConcernes",
                },
              }), */
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["categorieProduit", "unityProduit"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                ZONEGEOGRAPHIQUE_ADMIN_RPC,
                ["madeInProduit"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-docsAssocies -objetsAssocies -langues -religions -monnaies -secteursActivitesSpecialites -coordonneesSIG -objetsConcernes",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                DISTINCTION_ADMIN_RPC,
                ["distanction"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-instanceContenuMedia -objetsAssocies -etats -referenceObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                SOCIALMEDIA_ADMIN_RPC,
                ["socialMediaAssocie"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-objetAssocie -objetConcene" } }
              ),
              sendRPCRequest(
                doc,
                INSTANCEGARANTIE_ADMIN_RPC,
                ["garantieAssurance"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-documentAssocie -instanceCritere -objetConcerne -analyseDeLaSituation -demarcheAdministration -suivi -actionAEntreprendre -inclusion -modelGarantie -listeRefObjetsConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                ETATOBJET_ADMIN_RPC,
                ["etatObjetAssocie"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObject" } }
              ),
              sendRPCRequest(
                doc,
                CONTENUMMEDIA_ADMIN_RPC,
                ["contenueMediaAssocie"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-auteurs -objetAssocie -objetsConcernes",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                INSTANCEOFFRE_ADMIN_RPC,
                ["instanceOffre"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-produitService -refPricingRule -instanceCritere -regleAssocie -statistique -refObjetConcerne -protagonistesPotentiels",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                INDICATIONFRAISADDITIONNELLE_ADMIN_RPC,
                ["indicationFraisAddi"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-refPrisingRule -instanceCritere -regleInclusionOuExlusion -refStatistique",
                  },
                }
              ),
              // sendRPCRequest(
              //   doc,
              //   STOCK_ADMIN_RPC,
              //   ["indicationStock"],
              //   "VIEW_ITEMS",
              //   {
              //     queryOptions: {
              //       select:
              //         "-conditionStockage -objetConcerneParOperation -valeur -codeArticle -refObjetConcerne",
              //     },
              //   }
              // ),

              sendRPCRequest(
                doc,
                STOCK_ADMIN_RPC,
                ["indicationStock"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-conditionStockage -objetConcerneParOperation -valeur -codeArticle -refObjetConcerne",
                  },
                }
              ),

              sendRPCRequest(
                doc,
                STATISTIQUESDIRECTES_ADMIN_RPC,
                ["statistiqueDirectAssocie"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                ANALYSE_ADMIN_RPC,
                ["analyseAssocie"],
                "VIEW_ITEMS",
                {
                  queryOptions: { select: "-bilan -probleme -objetsConcernes" },
                }
              ),
              sendRPCRequest(
                doc,
                OBJETASSOCIEE_ADMIN_RPC,
                ["objetAssocie"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObjet" } }
              ),
              sendRPCRequest(
                doc,
                INSTANCEACTEURASSOCIE_ADMIN_RPC,
                ["instanceActeurAssocie"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-referenceObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                INSTANCESEGMENT_ADMIN_RPC,
                ["instanceSegment"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-marcheConcerne -segment -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                PROBLEMEPERTINENCE_ADMIN_RPC,
                ["criseRisqueAssocie"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-instructionsEviterProbleme -instructionsCasProbleme -objetsAssocies -rapportsBilans -pilotagesSuivi -indicateursSuiviRealisation -etatDeObjet -protagonistesPotentiels -instanceProtagonisteCommunication -critereInstanceCaracteristique -objetsConcernes",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                DETAILSINVENTAIRE_ADMIN_RPC,
                ["detailsInventaires"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-refArticle -quantiteSpecifique -valeur",
                  },
                }
              ),

              sendRPCRequest(
                doc,
                PROTAGONISTEPOTONTIEL_ADMIN_RPC,
                ["fournisseurAssocie"],
                "VIEW_ITEM",
                {
                  queryOptions: {
                    select:
                      "-produitsLivraison -categorieProduitsLivraison -produitService -documentsLegals -moment -etats -opportinutes -risques -criteresConditions -echangesCommunications -incidents -elementsBudgets -activites -objetsAssocies -caracteristiques -referentiels -instructions -reglesActivations -echangesEtCommunications",
                  },
                }
              ),

              sendRPCRequest(
                doc,
                MONNAIE_ADMIN_RPC,
                ["monnaie"],
                "VIEW_ITEM",
                {}
              ),
              sendRPCRequest(
                doc,
                NONDISPONIBILITE_ADMIN_RPC,
                ["nonDisponibilite"],
                "VIEW_ITEMS",
                {}
              ),

              sendRPCRequest(
                doc,
                DISPONIBILITECONTRACTUELLE_ADMIN_RPC,
                ["disponibiliteContractuelle"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(doc, FAQ_ADMIN_RPC, ["faq"], "VIEW_ITEMS", {
                queryOptions: {
                  select: "-objetsAssocies -etats -objetsConcernes",
                },
              }),
              // sendRPCRequest(
              //   doc,
              //   OBJETCONCERNEERETOUR_ADMIN_RPC,
              //   ["retours"],
              //   "VIEW_ITEMS",
              //   { queryOptions: { select: "-refProduit -refLigneCommande" } }
              // ),
              // sendRPCRequest(doc, SAV_ADMIN_RPC, ["sav"], "VIEW_ITEMS", {
              //   queryOptions: {
              //     select:
              //       "-acteur -dateSpecifique -decision -operationLogistique -objetConcerneParOperation -codeArticle -quantiteSpecifique -article -instanceStockage -risqueIncident -actionAssociee -objetAssocie -documentAssocie -echangesEtCommunication -rapportEtBilan -conditionAssociee -transactionAssociee -instanceAssurance -instanceGarantie -diagnostique",
              //   },
              // }),
              /*  sendRPCRequest(
                doc,
                DETAILSOPERATIONLIVRAISON_ADMIN_RPC,
                ["detailLivraison"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-refProduit -refFournisseur -indicateurs -anomalie -servicesAssociesInternes",
                  },
                }
              ),*/
            ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["categorieProduit"])
              d["categorieProduit"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["categorieProduit"]._id || d["categorieProduit"])
                ) || d["categorieProduit"];
            if (d["unityProduit"])
              d["unityProduit"] =
                result[0].find(
                  (item) =>
                    item._id == (d["unityProduit"]._id || d["unityProduit"])
                ) || d["unityProduit"];

            if (d["instanceActeurAssocie"] && d["instanceActeurAssocie"].length)
              d["instanceActeurAssocie"] = d["instanceActeurAssocie"].map(
                (d) =>
                  (d = result[1].find((item) => item._id == (d._id || d)) || d)
              );

            if (d["fournisseurAssocie"])
              d["fournisseurAssocie"] =
                result[2].find(
                  (item) =>
                    item._id ==
                    (d["fournisseurAssocie"]._id || d["fournisseurAssocie"])
                ) || d["fournisseurAssocie"];
            if (d["instanceOffre"] && d["instanceOffre"].length)
              d["instanceOffre"] = d["instanceOffre"].map(
                (d) =>
                  (d = result[3].find((item) => item._id == (d._id || d)) || d)
              );
            if (d["monnaie"])
              d["monnaie"] =
                result[4].find(
                  (item) => item._id == (d["monnaie"]._id || d["monnaie"])
                ) || d["monnaie"];
            if (d["indicationFraisAddi"] && d["indicationFraisAddi"].length)
              d["indicationFraisAddi"] = d["indicationFraisAddi"].map(
                (d) =>
                  (d = result[5].find((item) => item._id == (d._id || d)) || d)
              );

            if (d["nonDisponibilite"] && d["nonDisponibilite"].length)
              d["nonDisponibilite"] = d["nonDisponibilite"].map(
                (d) =>
                  (d = result[6].find((item) => item._id == (d._id || d)) || d)
              );

            if (
              d["disponibiliteContractuelle"] &&
              d["disponibiliteContractuelle"].length
            )
              d["disponibiliteContractuelle"] = d[
                "disponibiliteContractuelle"
              ].map(
                (d) =>
                  (d = result[7].find((item) => item._id == (d._id || d)) || d)
              );

          /*  if (d["faq"] && d["faq"].length)
              d["faq"] = d["faq"].map(
                (d) =>
                  (d = result[8].find((item) => item._id == (d._id || d)) || d)
              );*/
          });
        } else {
          if (doc["categorieProduit"])
            doc["categorieProduit"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["categorieProduit"]._id || doc["categorieProduit"])
              ) || doc["categorieProduit"];
          if (doc["unityProduit"])
            doc["unityProduit"] =
              result[0].find(
                (item) =>
                  item._id == (doc["unityProduit"]._id || doc["unityProduit"])
              ) || doc["unityProduit"];

          if (doc["madeInProduit"] && doc["madeInProduit"].length)
            doc["madeInProduit"] = doc["madeInProduit"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["distanction"] && doc["distanction"].length)
            doc["distanction"] = doc["distanction"].map(
              (d) =>
                (d = result[2].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["socialMediaAssocie"] && doc["socialMediaAssocie"].length)
            doc["socialMediaAssocie"] = doc["socialMediaAssocie"].map(
              (d) =>
                (d = result[3].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["garantieAssurance"] && doc["garantieAssurance"].length)
            doc["garantieAssurance"] = doc["garantieAssurance"].map(
              (d) =>
                (d = result[4].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["etatObjetAssocie"] && doc["etatObjetAssocie"].length)
            doc["etatObjetAssocie"] = doc["etatObjetAssocie"].map(
              (d) =>
                (d = result[5].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["contenueMediaAssocie"] && doc["contenueMediaAssocie"].length)
            doc["contenueMediaAssocie"] = doc["contenueMediaAssocie"].map(
              (d) =>
                (d = result[6].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["instanceOffre"] && doc["instanceOffre"].length)
            doc["instanceOffre"] = doc["instanceOffre"].map(
              (d) =>
                (d = result[7].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["indicationFraisAddi"] && doc["indicationFraisAddi"].length)
            doc["indicationFraisAddi"] = doc["indicationFraisAddi"].map(
              (d) =>
                (d = result[8].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["indicationStock"] && doc["indicationStock"].length)
            doc["indicationStock"] = doc["indicationStock"].map(
              (d) =>
                (d = result[9].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["statistiqueDirectAssocie"] &&
            doc["statistiqueDirectAssocie"].length
          )
            doc["statistiqueDirectAssocie"] = doc[
              "statistiqueDirectAssocie"
            ].map(
              (d) =>
                (d = result[10].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["analyseAssocie"] && doc["analyseAssocie"].length)
            doc["analyseAssocie"] = doc["analyseAssocie"].map(
              (d) =>
                (d = result[11].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["objetAssocie"] && doc["objetAssocie"].length)
            doc["objetAssocie"] = doc["objetAssocie"].map(
              (d) =>
                (d = result[12].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["instanceActeurAssocie"] &&
            doc["instanceActeurAssocie"].length
          )
            doc["instanceActeurAssocie"] = doc["instanceActeurAssocie"].map(
              (d) =>
                (d = result[13].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["instanceSegment"] && doc["instanceSegment"].length)
            doc["instanceSegment"] = doc["instanceSegment"].map(
              (d) =>
                (d = result[14].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["criseRisqueAssocie"] && doc["criseRisqueAssocie"].length)
            doc["criseRisqueAssocie"] = doc["criseRisqueAssocie"].map(
              (d) =>
                (d = result[15].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["detailsInventaires"] && doc["detailsInventaires"].length)
            doc["detailsInventaires"] = doc["detailsInventaires"].map(
              (d) =>
                (d = result[16].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["fournisseurAssocie"])
            doc["fournisseurAssocie"] = result[17] || doc["fournisseurAssocie"];

          if (doc["monnaie"]) doc["monnaie"] = result[18] || doc["monnaie"];

          if (doc["nonDisponibilite"] && doc["nonDisponibilite"].length)
            doc["nonDisponibilite"] = doc["nonDisponibilite"].map(
              (d) =>
                (d = result[19].find((item) => item._id == (d._id || d)) || d)
            );

          if (
            doc["disponibiliteContractuelle"] &&
            doc["disponibiliteContractuelle"].length
          )
            doc["disponibiliteContractuelle"] = doc[
              "disponibiliteContractuelle"
            ].map(
              (d) =>
                (d = result[20].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["faq"] && doc["faq"].length)
            doc["faq"] = doc["faq"].map(
              (d) =>
                (d = result[21].find((item) => item._id == (d._id || d)) || d)
            );
          // if (doc["sav"] && doc["sav"].length)
          //   doc["sav"] = doc["sav"].map(
          //     (d) =>
          //       (d = result[17].find((item) => item._id == (d._id || d)) || d)
          //   );
          // if (doc["monnaie"])
          //   doc["monnaie"] = result[20] || doc["monnaie"];

          // if (doc["retours"] && doc["retours"].length)
          //   doc["retours"] = doc["retours"].map(
          //     (d) =>
          //       (d = result[17].find((item) => item._id == (d._id || d)) || d)
          //   );

          /*  if (doc["detailLivraison"] && doc["detailLivraison"].length)
              doc["detailLivraison"] = doc["detailLivraison"].map(
                (d) =>
                  (d = result[21].find((item) => item._id == (d._id || d)) || d)
              );*/
        }
      });
    }
  } catch (error) {
    console.log('distRequest produit=====>',error)
    throw new Error(error);
  }
}

produitServiceSchema.pre("aggregate", function (next) {
  const pipeline = this.pipeline();

  let index = pipeline.findIndex((p) => p["$match"]);
  if (index == -1) {
    pipeline.unshift({ $match: { etatObjet: "code-1" } });
  } else {
    if (!pipeline[index]["$match"]["etatObjet"]) {
      pipeline[index]["$match"]["etatObjet"] = "code-1";
    }
  }

  next();
});

produitServiceSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);

    next();
  } catch (err) {
    next(err);
  }
});

produitServiceSchema.post("save", async function (doc, next) {
  try {
    if (this.produitPricipale) {
      await ProduitAssocie.updateOne(
        { _id: this.produitPricipale.toString() },
        { $addToSet: { arrayRefProduit: this._id } }
      );
    }

    if (doc.refReservation)
      publishUpdate(
        "update_items",
        doc.refReservation,
        RESERVATION_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            refProduitsServices: doc._id,
          },
        }
      );

    if (doc.madeInProduit.length)
      publishUpdate(
        "update_items",
        doc.madeInProduit,
        ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
            },
          },
        }
      );
    if (doc.paysTVADefaut)
      publishUpdate(
        "update_items",
        doc.paysTVADefaut,
        ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
            },
          },
        }
      );
    if (doc.marqueAssocie)
      publishUpdate("update_items", doc.marqueAssocie, MARQUE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: {
          objetConcerne: {
            refObjet: doc._id,
            typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
          },
        },
      });
    if (doc.fournisseurAssocie)
      publishUpdate(
        "update_items",
        doc.fournisseurAssocie,
        PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            produitService: doc._id,
          },
        }
      );

    if (doc.distanction.length)
      publishUpdate("update_items", doc.distanction, DISTINCTION_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          referenceObjetConcerne: doc._id,
          typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
        },
      });
    if (doc.socialMediaAssocie.length)
      publishUpdate(
        "update_items",
        doc.socialMediaAssocie,
        SOCIALMEDIA_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            objetConcene: doc._id,
            typeObjetConcene: "PRODUITSERVICE_PRODUITSETVICE",
          },
        }
      );
    if (doc.garantieAssurance.length)
      publishUpdate(
        "update_items",
        doc.garantieAssurance,
        INSTANCEGARANTIE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            listeRefObjetsConcerne: {
              listeRefObjetsConcerne: doc._id,
              typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
            },
          },
        }
      );
    if (doc.etatObjetAssocie.length)
      publishUpdate(
        "update_items",
        doc.etatObjetAssocie,
        ETATOBJET_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObject: doc._id,
            typeObject: "PRODUITSERVICE_PRODUITSETVICE",
          },
        }
      );
    if (doc.contenueMediaAssocie.length)
      publishUpdate(
        "update_items",
        doc.contenueMediaAssocie,
        CONTENUMMEDIA_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
            },
          },
        }
      );
    if (doc.instanceOffre.length)
      publishUpdate(
        "update_items",
        doc.instanceOffre,
        INSTANCEOFFRE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
          },
        }
      );
    if (doc.indicationFraisAddi.length)
      publishUpdate(
        "update_items",
        doc.indicationFraisAddi,
        INDICATIONFRAISADDITIONNELLE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
          },
        }
      );
    if (doc.indicationStock.length)
      publishUpdate(
        "update_items",
        doc.indicationStock,
        ARTICLESTOCK_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
          },
        }
      );
    if (doc.statistiqueDirectAssocie.length)
      publishUpdate(
        "update_items",
        doc.statistiqueDirectAssocie,
        STATISTIQUESDIRECTES_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcene: "PRODUITSERVICE_PRODUITSETVICE",
          },
        }
      );
    if (doc.analyseAssocie.length)
      publishUpdate("update_items", doc.analyseAssocie, ANALYSE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
          },
        },
      });
    if (doc.objetAssocie.length)
      publishUpdate(
        "update_items",
        doc.objetAssocie,
        OBJETASSOCIEE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjet: doc._id,
            typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
          },
        }
      );
    if (doc.instanceActeurAssocie.length)
      publishUpdate(
        "update_items",
        doc.instanceActeurAssocie,
        INSTANCEACTEURASSOCIE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            referenceObjetConcerne: doc._id,
            typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
          },
        }
      );
    if (doc.instanceSegment.length)
      publishUpdate(
        "update_items",
        doc.instanceSegment,
        INSTANCESEGMENT_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
          },
        }
      );
    if (doc.criseRisqueAssocie.length)
      publishUpdate(
        "update_items",
        doc.criseRisqueAssocie,
        PROBLEMEPERTINENCE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
            },
          },
        }
      );
    if (doc.pricingRules.length)
      publishUpdate(
        "update_items",
        doc.pricingRules,
        PRODUITASSOCIE_ADMIN_QUEUE,
        { operation: "$set", body: { refProduit: doc._id } }
      );

    if (doc.catalogues.length)
      publishUpdate("update_items", doc.catalogues, CATALOGUE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { produitService: doc._id },
      });
    if (doc.detailsInventaires.length)
      publishUpdate(
        "update_items",
        doc.detailsInventaires,
        DETAILSINVENTAIRE_ADMIN_QUEUE,
        { operation: "$set", body: { refArticle: doc._id } }
      );
    if (doc.detailLivraison.length)
      publishUpdate(
        "update_items",
        doc.detailLivraison,
        DETAILSOPERATIONLIVRAISON_ADMIN_QUEUE,
        { operation: "$set", body: { refProduit: doc._id } }
      );
    if (doc.avantageEnNature.length)
      publishUpdate(
        "update_items",
        doc.avantageEnNature,
        AVANTAGEENNATURE_ADMIN_QUEUE,
        { operation: "$set", body: { refProduit1: doc._id } }
      );
    if (doc.avantagesEnNatures.length)
      publishUpdate(
        "update_items",
        doc.avantagesEnNatures,
        AVANTAGEENNATURE_ADMIN_QUEUE,
        { operation: "$set", body: { refProduit2: doc._id } }
      );
    if (doc.retours.length)
      publishUpdate(
        "update_items",
        doc.retours,
        OBJETCONCERNEERETOUR_ADMIN_QUEUE,
        { operation: "$set", body: { refProduit: doc._id } }
      );
    if (doc.sav.length)
      publishUpdate("update_items", doc.sav, SAV_ADMIN_QUEUE, {
        operation: "$set",
        body: { article: doc._id },
      });
    if (doc.operationsLivraison.length)
      publishUpdate(
        "update_items",
        doc.operationsLivraison,
        OPERATIONDELIVRAISON_ADMIN_QUEUE,
        { operation: "$addToSet", body: { article: doc._id } }
      );

    //#region new save bloc
    if (doc.catalogues.length)
      publishUpdate("update_items", doc.catalogues, CATALOGUE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { produitService: doc._id },
      });
    if (doc.operationsLivraison.length)
      publishUpdate(
        "update_items",
        doc.operationsLivraison,
        OPERATIONDELIVRAISON_ADMIN_QUEUE,
        { operation: "$addToSet", body: { article: doc._id } }
      );

    if (doc.faq.length)
      publishUpdate("update_items", doc.faq, FAQ_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
          },
        },
      });

    if (doc.owner && doc.owner.type && doc.owner.ref) {
      let key;
      let body;
      if (doc.owner.type.toLowerCase() == "acteurspro_acteurprofessionel") {
        key = ACTEURSPRO_ADMIN_QUEUE;
        body = { operation: "$addToSet", body: { produitService: doc._id } };
      }
      if (key && body) {
        publishUpdate("update_items", doc.owner.ref, key, body);
      }
    }

    if (doc.objetsConcernes.length) {
      let typeObjet = GroupBy(doc.objetsConcernes, "typeObjet");
      for (let item of Object.keys(typeObjet)) {
        if (item) {
          let body;
          let key;
          if (item.toLowerCase() == "agendaevent_event") {
            key = AGENDAEVENT_ADMIN_QUEUE;
            body = {
              operation: "$set",
              body: { produitsEvent: doc._id },
            };
          }

          if (
            item.toLowerCase() ==
            "instanceproduitservicereservation_reservation_principale"
          ) {
            key = INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { produitPrincipale: doc._id },
            };
          }

          if (
            item.toLowerCase() ==
            "instanceproduitservicereservation_reservation_complementaire"
          ) {
            key = INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { produitComplementaire: doc._id },
            };
          }

          if (body)
            publishUpdate(
              "update_items",
              typeObjet[item].map((i) => i.refObjet),
              key,
              body
            );
        }
      }
    }

    //#enregion new save bloc
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
produitServiceSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    let produitPricipale = GroupBy(doc, "produitPricipale");
    for (let item of Object.keys(produitPricipale)) {
      if (item)
        await ProduitAssocie.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              arrayRefProduit: {
                $each: produitPricipale[item].map((d) => d._id),
              },
            },
          }
        );
    }

    let madeInProduit = GroupBy(doc, "madeInProduit");
    for (let item of Object.keys(madeInProduit)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(madeInProduit[item].map((d) => d.madeInProduit))
            ),
          ],
          ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: madeInProduit[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
                    })
                ),
              },
            },
          }
        );
    }
    let paysTVADefaut = GroupBy(doc, "paysTVADefaut");
    for (let item of Object.keys(paysTVADefaut)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(paysTVADefaut[item].map((d) => d.paysTVADefaut))
            ),
          ],
          ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: paysTVADefaut[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
                    })
                ),
              },
            },
          }
        );
    }
    let marqueAssocie = GroupBy(doc, "marqueAssocie");
    for (let item of Object.keys(marqueAssocie)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(marqueAssocie[item].map((d) => d.marqueAssocie))
            ),
          ],
          MARQUE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetConcerne: {
                $each: marqueAssocie[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
                    })
                ),
              },
            },
          }
        );
    }

    let fournisseurAssocie = GroupBy(doc, "fournisseurAssocie");
    for (let item of Object.keys(fournisseurAssocie)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                fournisseurAssocie[item].map((d) => d.fournisseurAssocie)
              )
            ),
          ],
          PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: fournisseurAssocie[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
                    })
                ),
              },
            },
          }
        );
    }

    let garantieAssurance = GroupBy(doc, "garantieAssurance");
    for (let item of Object.keys(garantieAssurance)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(garantieAssurance[item].map((d) => d.garantieAssurance))
            ),
          ],
          INSTANCEGARANTIE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              listeRefObjetsConcerne: {
                $each: garantieAssurance[item].map(
                  (i) =>
                    (i = {
                      listeRefObjetsConcerne: i._id,
                      typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
                    })
                ),
              },
            },
          }
        );
    }
    let contenueMediaAssocie = GroupBy(doc, "contenueMediaAssocie");
    for (let item of Object.keys(contenueMediaAssocie)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                contenueMediaAssocie[item].map((d) => d.contenueMediaAssocie)
              )
            ),
          ],
          CONTENUMMEDIA_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: contenueMediaAssocie[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
                    })
                ),
              },
            },
          }
        );
    }
    let analyseAssocie = GroupBy(doc, "analyseAssocie");
    for (let item of Object.keys(analyseAssocie)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(analyseAssocie[item].map((d) => d.analyseAssocie))
            ),
          ],
          ANALYSE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: analyseAssocie[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
                    })
                ),
              },
            },
          }
        );
    }
    let criseRisqueAssocie = GroupBy(doc, "criseRisqueAssocie");
    for (let item of Object.keys(criseRisqueAssocie)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                criseRisqueAssocie[item].map((d) => d.criseRisqueAssocie)
              )
            ),
          ],
          PROBLEMEPERTINENCE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: criseRisqueAssocie[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
                    })
                ),
              },
            },
          }
        );
    }

    //#region new insert many bloc
    let catalogues = GroupBy(doc, "catalogues");
    for (let item of Object.keys(catalogues)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(catalogues[item].map((d) => d.catalogues)))],
          CATALOGUE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              produitService: { $each: catalogues[item].map((i) => i._id) },
            },
          }
        );
    }
    let operationsLivraison = GroupBy(doc, "operationsLivraison");
    for (let item of Object.keys(operationsLivraison)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                operationsLivraison[item].map((d) => d.operationsLivraison)
              )
            ),
          ],
          OPERATIONDELIVRAISON_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              article: { $each: operationsLivraison[item].map((i) => i._id) },
            },
          }
        );
    }

    let typeOwner = /*updateGroupBy*/ GroupBy(doc, "owner.type");
    for (let item of Object.keys(typeOwner)) {
      if (item) {
        let references = GroupBy(typeOwner[item], "owner.ref");
        for (let itemRef of Object.keys(references)) {
          if (itemRef) {
            let body;
            let key;
            if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  produitService: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            }
            if (body) publishUpdate("update_items", itemRef, key, body);
          }
        }
      }
    }
    let refReservation = GroupBy(doc, "refReservation");
    for (let item of Object.keys(refReservation)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(refReservation[item].map((d) => d.refReservation))
            ),
          ],
          RESERVATION_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              refProduitsServices: {
                $each: refReservation[item].map((i) => i._id),
              },
            },
          }
        );
    }

    //#enregion new insert many bloc
    let typeObjet = /*updateGroupByinsertMany with dot*/ GroupBy(
      doc,
      "objetsConcernes.typeObjet"
    );
    for (let item of Object.keys(typeObjet)) {
      if (item) {
        let references = GroupBy(typeObjet[item], "refObjet");
        for (let itemRef of Object.keys(references)) {
          if (itemRef) {
            let body;
            let key;
            if (item.toLowerCase() == "agendaevent_event") {
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  produitsEvent: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            }
            if (body) publishUpdate("update_items", itemRef, key, body);
          }
        }
      }
    }
    //#enregion new insert many bloc
    next();
  } catch (error) {
    next(error);
  }
});
let prevState = null;
let itemToCheck = {};

produitServiceSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await produitService.findOne(this.getQuery()).lean();
    if (doc) {
      console.log("debut pre");
      itemToCheck["madeInProduit"] = doc.madeInProduit;
      itemToCheck["paysTVADefaut"] = doc.paysTVADefaut;
      itemToCheck["marqueAssocie"] = doc.marqueAssocie;
      itemToCheck["fournisseurAssocie"] = doc.fournisseurAssocie;
      itemToCheck["distanction"] = doc.distanction;
      itemToCheck["socialMediaAssocie"] = doc.socialMediaAssocie;
      itemToCheck["garantieAssurance"] = doc.garantieAssurance;
      itemToCheck["etatObjetAssocie"] = doc.etatObjetAssocie;
      itemToCheck["contenueMediaAssocie"] = doc.contenueMediaAssocie;
      itemToCheck["instanceOffre"] = doc.instanceOffre;
      itemToCheck["indicationFraisAddi"] = doc.indicationFraisAddi;
      itemToCheck["indicationStock"] = doc.indicationStock;
      itemToCheck["statistiqueDirectAssocie"] = doc.statistiqueDirectAssocie;
      itemToCheck["analyseAssocie"] = doc.analyseAssocie;
      itemToCheck["objetAssocie"] = doc.objetAssocie;
      itemToCheck["instanceActeurAssocie"] = doc.instanceActeurAssocie;
      itemToCheck["instanceSegment"] = doc.instanceSegment;
      itemToCheck["criseRisqueAssocie"] = doc.criseRisqueAssocie;
      itemToCheck["pricingRules"] = doc.pricingRules;
      itemToCheck["catalogues"] = doc.catalogues;
      itemToCheck["detailsInventaires"] = doc.detailsInventaires;
      itemToCheck["detailLivraison"] = doc.detailLivraison;
      itemToCheck["avantageEnNature"] = doc.avantageEnNature;
      itemToCheck["avantagesEnNatures"] = doc.avantagesEnNatures;
      itemToCheck["retours"] = doc.retours;
      itemToCheck["sav"] = doc.sav;
      itemToCheck["operationsLivraison"] = doc.operationsLivraison;
      itemToCheck["owner.ref"] = doc.owner?.ref;
      itemToCheck["objetsConcernes"] = doc.objetsConcernes;

      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );

      const produitPricipaleId = this._update?.["$set"]?.produitPricipale;
      if (
        produitPricipaleId &&
        doc?.produitPricipale != produitPricipaleId &&
        doc?.produitPricipale != undefined
      )
        await ProduitAssocie.updateOne(
          { _id: doc.produitPricipale.toString() },
          { $pull: { arrayRefProduit: doc._id } }
        );
    }
    console.log("fin pre");

    next();
  } catch (error) {
    next(error);
  }
});
produitServiceSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    if (
      doc.indicationDuStock.quantiteAfficher >
      doc.indicationDuStock.quantiteDisponible
    ) {
      await produitService.updateOne(
        {
          _id: doc._id,
        },
        {
          $set: {
            "indicationDuStock.quantiteAfficher":
              doc.indicationDuStock.quantiteDisponible,
          },
        }
      );
    }

    if (doc.indicationDuStock.quantiteDisponible == 0) {
      await produitService.updateOne(
        {
          _id: doc._id,
        },
        {
          $set: {
            "indicationDuStock.etatStock": "code_8342",
          },
        }
      );
    }

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["madeInProduit"], newData: doc.madeInProduit },
      ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["paysTVADefaut"], newData: doc.paysTVADefaut },
      ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["marqueAssocie"], newData: doc.marqueAssocie },
      MARQUE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetConcerne: { refObjet: doc._id } },
        bodyPush: {
          objetConcerne: {
            refObjet: doc._id,
            typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
          },
        },
      }
    );
    // console.log({ oldData: itemToCheck["fournisseurAssocie"], newData: doc.fournisseurAssocie },)
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["fournisseurAssocie"],
        newData: doc.fournisseurAssocie,
      },
      PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { produitService: doc._id },
        bodyPush: {
          produitService: doc._id,
        },
      }
    );

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["distanction"], newData: doc.distanction },
      DISTINCTION_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { referenceObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          referenceObjetConcerne: doc._id,
          typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["socialMediaAssocie"],
        newData: doc.socialMediaAssocie,
      },
      SOCIALMEDIA_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { objetConcene: null, typeObjetConcene: null },
        bodyPush: {
          objetConcene: doc._id,
          typeObjetConcene: "PRODUITSERVICE_PRODUITSETVICE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["garantieAssurance"],
        newData: doc.garantieAssurance,
      },
      INSTANCEGARANTIE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: {
          listeRefObjetsConcerne: { listeRefObjetsConcerne: doc._id },
        },
        bodyPush: {
          listeRefObjetsConcerne: {
            listeRefObjetsConcerne: doc._id,
            typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["etatObjetAssocie"],
        newData: doc.etatObjetAssocie,
      },
      ETATOBJET_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObject: null, typeObject: null },
        bodyPush: {
          refObject: doc._id,
          typeObject: "PRODUITSERVICE_PRODUITSETVICE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["contenueMediaAssocie"],
        newData: doc.contenueMediaAssocie,
      },
      CONTENUMMEDIA_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["instanceOffre"], newData: doc.instanceOffre },
      OFFREPROMOTIONNELLE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["indicationFraisAddi"],
        newData: doc.indicationFraisAddi,
      },
      INDICATIONFRAISADDITIONNELLE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["indicationStock"], newData: doc.indicationStock },
      ARTICLESTOCK_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["statistiqueDirectAssocie"],
        newData: doc.statistiqueDirectAssocie,
      },
      STATISTIQUESDIRECTES_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcene: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcene: "PRODUITSERVICE_PRODUITSETVICE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["analyseAssocie"], newData: doc.analyseAssocie },
      ANALYSE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["objetAssocie"], newData: doc.objetAssocie },
      OBJETASSOCIEE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjet: null, typeObjetConcerne: null },
        bodyPush: {
          refObjet: doc._id,
          typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["instanceActeurAssocie"],
        newData: doc.instanceActeurAssocie,
      },
      INSTANCEACTEURASSOCIE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { referenceObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          referenceObjetConcerne: doc._id,
          typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["instanceSegment"], newData: doc.instanceSegment },
      INSTANCESEGMENT_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "PRODUITSERVICE_PRODUITSETVICE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["criseRisqueAssocie"],
        newData: doc.criseRisqueAssocie,
      },
      PROBLEMEPERTINENCE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "PRODUITSERVICE_PRODUITSETVICE",
          },
        },
      }
    );

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["pricingRules"], newData: doc.pricingRules },
      PRODUITASSOCIE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refProduit: null },
        bodyPush: { refProduit: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["catalogues"], newData: doc.catalogues },
      CATALOGUE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { produitService: doc._id },
        bodyPush: { produitService: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["detailsInventaires"],
        newData: doc.detailsInventaires,
      },
      DETAILSINVENTAIRE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refArticle: null },
        bodyPush: { refArticle: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["detailLivraison"], newData: doc.detailLivraison },
      DETAILSOPERATIONLIVRAISON_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refProduit: null },
        bodyPush: { refProduit: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["avantageEnNature"],
        newData: doc.avantageEnNature,
      },
      AVANTAGEENNATURE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refProduit1: null },
        bodyPush: { refProduit1: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["avantagesEnNatures"],
        newData: doc.avantagesEnNatures,
      },
      AVANTAGEENNATURE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refProduit2: null },
        bodyPush: { refProduit2: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["retours"], newData: doc.retours },
      OBJETCONCERNEERETOUR_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refProduit: null },
        bodyPush: { refProduit: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["sav"], newData: doc.sav },
      SAV_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { article: null },
        bodyPush: { article: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["operationsLivraison"],
        newData: doc.operationsLivraison,
      },
      OPERATIONDELIVRAISON_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { article: doc._id },
        bodyPush: { article: doc._id },
      }
    );

    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["owner.ref"],
        newData: doc.owner?.ref,
      },
      ACTEURSPRO_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { produitService: doc._id },
        bodyPush: { produitService: doc._id },
      }
    );

    let itemToPull,
      itemToPush = [];
    if (itemToCheck["objetsConcernes"].length || doc.objetsConcernes.length) {
      itemToPull = getDiffArray(
        itemToCheck["objetsConcernes"],
        doc.objetsConcernes,
        "refObjet"
      );
      itemToPush = getDiffArray(
        doc.objetsConcernes,
        itemToCheck["objetsConcernes"],
        "refObjet"
      );

      if (itemToPull.length) {
        itemToPull = GroupBy(itemToPull, "typeObjet");
        for (let item of Object.keys(itemToPull)) {
          if (item) {
            let body;
            let key;
            if (item.toLowerCase() == "agendaevent_event") {
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = {
                operation: "$pull",
                body: { produitsEvent: doc._id },
              };

              if (
                item.toLowerCase() ==
                "instanceproduitservicereservation_reservation_principale"
              ) {
                key = INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE;
                body = {
                  operation: "$pull",
                  body: { produitPrincipale: doc._id },
                };
              }

              if (
                item.toLowerCase() ==
                "instanceproduitservicereservation_reservation_complementaire"
              ) {
                key = INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE;
                body = {
                  operation: "$pull",
                  body: { produitComplementaire: doc._id },
                };
              }
            }

            if (body)
              publishUpdate(
                "update_items",
                itemToPull[item].map((i) => i.refObjet),
                key,
                body
              );
          }
        }
      }
      if (itemToPush.length) {
        itemToPush = GroupBy(itemToPush, "typeObjet");
        for (let item of Object.keys(itemToPush)) {
          if (item) {
            let body;
            let key;
            if (item.toLowerCase() == "agendaevent_event") {
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { produitsEvent: doc._id },
              };
            }

            if (
              item.toLowerCase() ==
              "instanceproduitservicereservation_reservation_principale"
            ) {
              key = INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { produitPrincipale: doc._id },
              };
            }

            if (
              item.toLowerCase() ==
              "instanceproduitservicereservation_reservation_complementaire"
            ) {
              key = INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { produitComplementaire: doc._id },
              };
            }

            if (body)
              publishUpdate(
                "update_items",
                itemToPush[item].map((i) => i.refObjet),
                key,
                body
              );
          }
        }
      }
    }

    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.produitPricipale)
      await ProduitAssocie.updateOne(
        { _id: doc.produitPricipale?._id?.toString() || doc.produitPricipale },
        { $addToSet: { arrayRefProduit: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
produitServiceSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      if (
        this._update?.["$addToSet"]?.catalogues &&
        docs.modifiedCount /*new modifCount*/
      )
        publishUpdate(
          "update_items",
          this._update?.["$addToSet"]?.catalogues,
          CATALOGUE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { produitService: { $each: this.getQuery()._id["$in"] } },
          }
        );
      if (
        this._update?.["$addToSet"]?.operationsLivraison &&
        docs.modifiedCount /*new modifCount*/
      )
        publishUpdate(
          "update_items",
          this._update?.["$addToSet"]?.operationsLivraison,
          OPERATIONDELIVRAISON_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { article: { $each: this.getQuery()._id["$in"] } },
          }
        );

      if (this._update?.["$addToSet"]?.objetsConcernes && docs.modifiedCount) {
        let body;
        let key;

        if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "agendaevent_event"
        ) {
          key = AGENDAEVENT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              produitsEvent: {
                $each: this.getQuery()?._id?.["$in"],
              },
            },
          };
        }

        if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "instanceproduitservicereservation_reservation_principale"
        ) {
          key = INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              produitPrincipale: {
                $each: this.getQuery()?._id?.["$in"],
              },
            },
          };
        }

        if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "instanceproduitservicereservation_reservation_complementaire"
        ) {
          key = INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              produitComplementaire: {
                $each: this.getQuery()?._id?.["$in"],
              },
            },
          };
        }

        if (body)
          publishUpdate(
            "update_items",
            this._update?.["$addToSet"].objetsConcernes.refObjet,
            key,
            body
          );
      }
    } else {
      let doc = await produitService.find(this.getQuery()).lean();
      const promises = [];
      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.madeInProduit)))],
          ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.paysTVADefaut)))],
          ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.marqueAssocie)))],
          MARQUE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetConcerne: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.fournisseurAssocie)))],
          PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.distanction)))],
          DISTINCTION_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { typeObjetConcerne: null, referenceObjetConcerne: null },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.socialMediaAssocie)))],
          SOCIALMEDIA_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { typeObjetConcene: null, objetConcene: null },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.garantieAssurance)))],
          INSTANCEGARANTIE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: {
              typeObjetConcerne: {
                listeRefObjetsConcerne: this.getQuery()._id,
              },
            },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.etatObjetAssocie)))],
          ETATOBJET_ADMIN_QUEUE,
          { operation: "$set", body: { typeObject: null, refObject: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.contenueMediaAssocie)))],
          CONTENUMMEDIA_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.instanceOffre)))],
          OFFREPROMOTIONNELLE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { typeObjetConcerne: null, refObjetConcerne: null },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.indicationFraisAddi)))],
          INDICATIONFRAISADDITIONNELLE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { typeObjetConcerne: null, refObjetConcerne: null },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.indicationStock)))],
          ARTICLESTOCK_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { typeObjetConcerne: null, refObjetConcerne: null },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.statistiqueDirectAssocie)))],
          STATISTIQUESDIRECTES_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { typeObjetConcene: null, refObjetConcerne: null },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.analyseAssocie)))],
          ANALYSE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.objetAssocie)))],
          OBJETASSOCIEE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { typeObjetConcerne: null, refObjet: null },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.instanceActeurAssocie)))],
          INSTANCEACTEURASSOCIE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { typeObjetConcerne: null, referenceObjetConcerne: null },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.instanceSegment)))],
          INSTANCESEGMENT_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { typeObjetConcerne: null, refObjetConcerne: null },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.criseRisqueAssocie)))],
          PROBLEMEPERTINENCE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.pricingRules)))],
          PRODUITASSOCIE_ADMIN_QUEUE,
          { operation: "$set", body: { refProduit: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.catalogues)))],
          CATALOGUE_ADMIN_QUEUE,
          { operation: "$pull", body: { produitService: this.getQuery()._id } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.detailsInventaires)))],
          DETAILSINVENTAIRE_ADMIN_QUEUE,
          { operation: "$set", body: { refArticle: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.detailLivraison)))],
          DETAILSOPERATIONLIVRAISON_ADMIN_QUEUE,
          { operation: "$set", body: { refProduit: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.avantageEnNature)))],
          AVANTAGEENNATURE_ADMIN_QUEUE,
          { operation: "$set", body: { refProduit1: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.avantagesEnNatures)))],
          AVANTAGEENNATURE_ADMIN_QUEUE,
          { operation: "$set", body: { refProduit2: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.retours)))],
          OBJETCONCERNEERETOUR_ADMIN_QUEUE,
          { operation: "$set", body: { refProduit: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.sav)))],
          SAV_ADMIN_QUEUE,
          { operation: "$set", body: { article: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.operationsLivraison)))],
          OPERATIONDELIVRAISON_ADMIN_QUEUE,
          { operation: "$pull", body: { article: this.getQuery()._id } }
        );
        let typeObjet = /*updateGroupByupdateMany with dot*/ GroupBy(
          doc,
          "objetsConcernes.typeObjet"
        );
        for (let item of Object.keys(typeObjet)) {
          if (item) {
            let references = GroupBy(typeObjet[item], "refObjet");
            for (let itemRef of Object.keys(references)) {
              if (itemRef) {
                let body;
                let key;
                if (item.toLowerCase() == "agendaevent_event") {
                  key = AGENDAEVENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      produitsEvent: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                }
                if (body) publishUpdate("update_items", itemRef, key, body);
              }
            }
          }
        }

        let files = [];

        doc.map((d) => {
          if (d.imageProduit) files.push(d.imageProduit);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let produitAssocie = [];
        let caracteristiqueAssocie = [];
        let codageProduitAssocie = [];
        let tarifIndicqtif = [];
        let tarifSaisonnierAssocie = [];
        let tarifVariable = [];
        let grilleAssocie = [];
        let tarifLivraison = [];
        let produitsEvent = [];

        doc.map((d) => {
          produitsEvent.push(...d.produitsEvent.map((v) => v._id || v));

          produitAssocie.push(...d.produitAssocie.map((v) => v._id || v));
          caracteristiqueAssocie.push(
            ...d.caracteristiqueAssocie.map((v) => v._id || v)
          );
          codageProduitAssocie.push(
            ...d.codageProduitAssocie.map((v) => v._id || v)
          );
          tarifIndicqtif.push(...d.tarifIndicqtif.map((v) => v._id || v));
          tarifSaisonnierAssocie.push(
            ...d.tarifSaisonnierAssocie.map((v) => v._id || v)
          );
          tarifVariable.push(...d.tarifVariable.map((v) => v._id || v));
          grilleAssocie.push(...d.grilleAssocie.map((v) => v._id || v));
          tarifLivraison.push(...d.tarifLivraison.map((v) => v._id || v));
        });
        if (produitAssocie.length) {
          promises.push(
            ProduitAssocie.updateMany(
              { _id: { $in: produitAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (produitsEvent.length) {
          promises.push(
            produitService
              .updateMany(
                { _id: { $in: produitsEvent } },
                { $set: { etatObjet: "code-2" } }
              )
              .exec()
          );
        }

        if (caracteristiqueAssocie.length) {
          promises.push(
            CaracteristiqueProduit.updateMany(
              { _id: { $in: caracteristiqueAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (codageProduitAssocie.length) {
          promises.push(
            CodageProduit.updateMany(
              { _id: { $in: codageProduitAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (tarifIndicqtif.length) {
          promises.push(
            TarifUIndicatif.updateMany(
              { _id: { $in: tarifIndicqtif } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (tarifSaisonnierAssocie.length) {
          promises.push(
            TarifSaisonnier.updateMany(
              { _id: { $in: tarifSaisonnierAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (tarifVariable.length) {
          promises.push(
            TarifUnitaireVariable.updateMany(
              { _id: { $in: tarifVariable } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (grilleAssocie.length) {
          promises.push(
            GrilleTarifaire.updateMany(
              { _id: { $in: grilleAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (tarifLivraison.length) {
          promises.push(
            TarifLivraison.updateMany(
              { _id: { $in: tarifLivraison } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let produitAssocie = [];
        let caracteristiqueAssocie = [];
        let codageProduitAssocie = [];
        let tarifIndicqtif = [];
        let tarifSaisonnierAssocie = [];
        let tarifVariable = [];
        let grilleAssocie = [];
        let tarifLivraison = [];
        let produitsEvent = [];

        doc.map((d) => {
          produitsEvent.push(...d.produitsEvent.map((v) => v._id || v));

          produitAssocie.push(...d.produitAssocie.map((v) => v._id || v));
          caracteristiqueAssocie.push(
            ...d.caracteristiqueAssocie.map((v) => v._id || v)
          );
          codageProduitAssocie.push(
            ...d.codageProduitAssocie.map((v) => v._id || v)
          );
          tarifIndicqtif.push(...d.tarifIndicqtif.map((v) => v._id || v));
          tarifSaisonnierAssocie.push(
            ...d.tarifSaisonnierAssocie.map((v) => v._id || v)
          );
          tarifVariable.push(...d.tarifVariable.map((v) => v._id || v));
          grilleAssocie.push(...d.grilleAssocie.map((v) => v._id || v));
          tarifLivraison.push(...d.tarifLivraison.map((v) => v._id || v));
        });
        if (produitAssocie.length) {
          promises.push(
            ProduitAssocie.updateMany(
              { _id: { $in: produitAssocie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }

        if (produitsEvent.length) {
          promises.push(
            produitService
              .updateMany(
                { _id: { $in: produitsEvent } },
                { $set: { etatObjet: "code-1" } }
              )
              .exec()
          );
        }
        if (caracteristiqueAssocie.length) {
          promises.push(
            CaracteristiqueProduit.updateMany(
              { _id: { $in: caracteristiqueAssocie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (codageProduitAssocie.length) {
          promises.push(
            CodageProduit.updateMany(
              { _id: { $in: codageProduitAssocie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (tarifIndicqtif.length) {
          promises.push(
            TarifUIndicatif.updateMany(
              { _id: { $in: tarifIndicqtif } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (tarifSaisonnierAssocie.length) {
          promises.push(
            TarifSaisonnier.updateMany(
              { _id: { $in: tarifSaisonnierAssocie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (tarifVariable.length) {
          promises.push(
            TarifUnitaireVariable.updateMany(
              { _id: { $in: tarifVariable } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (grilleAssocie.length) {
          promises.push(
            GrilleTarifaire.updateMany(
              { _id: { $in: grilleAssocie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (tarifLivraison.length) {
          promises.push(
            TarifLivraison.updateMany(
              { _id: { $in: tarifLivraison } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
      }

      if (this._update?.["$pull"]) {
        if (
          this._update?.["$pull"].madeInProduit &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].madeInProduit,
            ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"].garantieAssurance &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].garantieAssurance,
            INSTANCEGARANTIE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: {
                typeObjetConcerne: {
                  listeRefObjetsConcerne: this.getQuery()._id,
                },
              },
            }
          );
        if (
          this._update?.["$pull"].contenueMediaAssocie &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].contenueMediaAssocie,
            CONTENUMMEDIA_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"].analyseAssocie &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].analyseAssocie,
            ANALYSE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"].criseRisqueAssocie &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].criseRisqueAssocie,
            PROBLEMEPERTINENCE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"].catalogues &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].catalogues,
            CATALOGUE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { produitService: this.getQuery()._id },
            }
          );
        if (
          this._update?.["$pull"].operationsLivraison &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].operationsLivraison,
            OPERATIONDELIVRAISON_ADMIN_QUEUE,
            { operation: "$pull", body: { article: this.getQuery()._id } }
          );
      }
      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
produitServiceSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await produitService.find(this.getQuery()).lean();
    const promises = [];
    let produitAssocie = [];
    let caracteristiqueAssocie = [];
    let codageProduitAssocie = [];
    let tarifIndicqtif = [];
    let tarifSaisonnierAssocie = [];
    let tarifVariable = [];
    let grilleAssocie = [];
    let tarifLivraison = [];
    doc.map((d) => {
      produitAssocie.push(...d.produitAssocie.map((v) => v._id || v));
      caracteristiqueAssocie.push(
        ...d.caracteristiqueAssocie.map((v) => v._id || v)
      );
      codageProduitAssocie.push(
        ...d.codageProduitAssocie.map((v) => v._id || v)
      );
      tarifIndicqtif.push(...d.tarifIndicqtif.map((v) => v._id || v));
      tarifSaisonnierAssocie.push(
        ...d.tarifSaisonnierAssocie.map((v) => v._id || v)
      );
      tarifVariable.push(...d.tarifVariable.map((v) => v._id || v));
      grilleAssocie.push(...d.grilleAssocie.map((v) => v._id || v));
      tarifLivraison.push(...d.tarifLivraison.map((v) => v._id || v));
    });
    if (produitAssocie.length) {
      promises.push(
        ProduitAssocie.deleteMany({ _id: { $in: produitAssocie } }).exec()
      );
    }
    if (caracteristiqueAssocie.length) {
      promises.push(
        CaracteristiqueProduit.deleteMany({
          _id: { $in: caracteristiqueAssocie },
        }).exec()
      );
    }
    if (codageProduitAssocie.length) {
      promises.push(
        CodageProduit.deleteMany({ _id: { $in: codageProduitAssocie } }).exec()
      );
    }
    if (tarifIndicqtif.length) {
      promises.push(
        TarifUIndicatif.deleteMany({ _id: { $in: tarifIndicqtif } }).exec()
      );
    }
    if (tarifSaisonnierAssocie.length) {
      promises.push(
        TarifSaisonnier.deleteMany({
          _id: { $in: tarifSaisonnierAssocie },
        }).exec()
      );
    }
    if (tarifVariable.length) {
      promises.push(
        TarifUnitaireVariable.deleteMany({ _id: { $in: tarifVariable } }).exec()
      );
    }
    if (grilleAssocie.length) {
      promises.push(
        GrilleTarifaire.deleteMany({ _id: { $in: grilleAssocie } }).exec()
      );
    }
    if (tarifLivraison.length) {
      promises.push(
        TarifLivraison.deleteMany({ _id: { $in: tarifLivraison } }).exec()
      );
    }

    if (promises.length) await Promise.all(promises);

    next();
  } catch (error) {
    next(error);
  }
});
async function communicateWithClient(
  methode,
  doc,
  prevState,
  targetState,
  files
) {
  try {
    if (methode == "postUpdateMany" || doc?.etatDePublication) {
      switch (methode) {
        case "preFindOneAndUpdate":
          if (
            targetState &&
            targetState != "code_3417" &&
            prevState == "code_3417"
          ) {
            await PublishMessage(PRODUITSERVICE_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            if (doc.logo) files.push(doc.logo);

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(PRODUITSERVICE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(PRODUITSERVICE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }

          if (doc?.etatDePublication == "code_3417") {
            let files = [];
            //doc.map((d)=>{
            if (doc.imageProduit) files.push(doc.imageProduit);
            //})
            copyFiles(files);
            if (doc?.produitAssocie?.length) {
              PublishProduitAssocie(doc.produitAssocie);
            }
            if (doc?.caracteristiqueAssocie?.length) {
              caracteristiqueRepo.PublishData(doc.caracteristiqueAssocie);
            }
            if (doc?.codageProduitAssocie?.length) {
              PublishCodageProduit(doc.codageProduitAssocie);
            }

            if (doc?.tarifIndicqtif?.length) {
              PublishTarifUIndicatif(doc.tarifIndicqtif);
            }
            if (doc?.tarifSaisonnierAssocie?.length) {
              PublishTarifSaisonnier(doc.tarifSaisonnierAssocie);
            }
            if (doc?.tarifVariable?.length) {
              PublishTarifUnitaireVariable(doc.tarifVariable);
            }
            if (doc?.grilleAssocie?.length) {
              PublishGrilleTarifaire(doc.grilleAssocie);
            }
            if (doc?.tarifLivraison?.length) {
              PublishTarifLivraison(doc.tarifLivraison);
            }

            if (doc.madeInProduit.length)
              publishUpdate(
                "publish_data",
                doc.madeInProduit,
                ZONEGEOGRAPHIQUE_ADMIN_QUEUE
              );
            if (doc.distanction.length)
              publishUpdate(
                "publish_data",
                doc.distanction,
                DISTINCTION_ADMIN_QUEUE
              );
            if (doc.socialMediaAssocie.length)
              publishUpdate(
                "publish_data",
                doc.socialMediaAssocie,
                SOCIALMEDIA_ADMIN_QUEUE
              );
            if (doc.garantieAssurance.length)
              publishUpdate(
                "publish_data",
                doc.garantieAssurance,
                INSTANCEGARANTIE_ADMIN_QUEUE
              );
            if (doc.etatObjetAssocie.length)
              publishUpdate(
                "publish_data",
                doc.etatObjetAssocie,
                ETATOBJET_ADMIN_QUEUE
              );
            if (doc.contenueMediaAssocie.length)
              publishUpdate(
                "publish_data",
                doc.contenueMediaAssocie,
                CONTENUMMEDIA_ADMIN_QUEUE
              );
            if (doc.instanceOffre.length)
              publishUpdate(
                "publish_data",
                doc.instanceOffre,
                INSTANCEOFFRE_ADMIN_QUEUE
              );
            if (doc.indicationFraisAddi.length)
              publishUpdate(
                "publish_data",
                doc.indicationFraisAddi,
                INDICATIONFRAISADDITIONNELLE_ADMIN_QUEUE
              );
            if (doc.indicationStock.length)
              publishUpdate(
                "publish_data",
                doc.indicationStock,
                ARTICLESTOCK_ADMIN_QUEUE
              );
            if (doc.statistiqueDirectAssocie.length)
              publishUpdate(
                "publish_data",
                doc.statistiqueDirectAssocie,
                STATISTIQUESDIRECTES_ADMIN_QUEUE
              );
            if (doc.analyseAssocie.length)
              publishUpdate(
                "publish_data",
                doc.analyseAssocie,
                ANALYSE_ADMIN_QUEUE
              );
            if (doc.objetAssocie.length)
              publishUpdate(
                "publish_data",
                doc.objetAssocie,
                OBJETASSOCIEE_ADMIN_QUEUE
              );
            if (doc.instanceActeurAssocie.length)
              publishUpdate(
                "publish_data",
                doc.instanceActeurAssocie,
                INSTANCEACTEURASSOCIE_ADMIN_QUEUE
              );
            if (doc.instanceSegment.length)
              publishUpdate(
                "publish_data",
                doc.instanceSegment,
                INSTANCESEGMENT_ADMIN_QUEUE
              );
            if (doc.criseRisqueAssocie.length)
              publishUpdate(
                "publish_data",
                doc.criseRisqueAssocie,
                PROBLEMEPERTINENCE_ADMIN_QUEUE
              );
            if (doc.pricingRules.length)
              publishUpdate(
                "publish_data",
                doc.pricingRules,
                PRODUITASSOCIE_ADMIN_QUEUE
              );

            if (doc.catalogues.length)
              publishUpdate(
                "publish_data",
                doc.catalogues,
                CATALOGUE_ADMIN_QUEUE
              );
            if (doc.detailsInventaires.length)
              publishUpdate(
                "publish_data",
                doc.detailsInventaires,
                DETAILSINVENTAIRE_ADMIN_QUEUE
              );
            if (doc.detailLivraison.length)
              publishUpdate(
                "publish_data",
                doc.detailLivraison,
                DETAILSOPERATIONLIVRAISON_ADMIN_QUEUE
              );
            if (doc.avantageEnNature.length)
              publishUpdate(
                "publish_data",
                doc.avantageEnNature,
                AVANTAGEENNATURE_ADMIN_QUEUE
              );
            if (doc.avantagesEnNatures.length)
              publishUpdate(
                "publish_data",
                doc.avantagesEnNatures,
                AVANTAGEENNATURE_ADMIN_QUEUE
              );
            if (doc.retours.length)
              publishUpdate(
                "publish_data",
                doc.retours,
                OBJETCONCERNEERETOUR_ADMIN_QUEUE
              );
            if (doc.sav.length)
              publishUpdate("publish_data", doc.sav, SAV_ADMIN_QUEUE);
            if (doc.operationsLivraison.length)
              publishUpdate(
                "publish_data",
                doc.operationsLivraison,
                OPERATIONDELIVRAISON_ADMIN_QUEUE
              );
            if (doc.fournisseurAssocie) {
              publishUpdate(
                "publish_data",
                doc.fournisseurAssocie,
                PROTAGONISTEPOTONTIEL_ADMIN_QUEUE
              );
            }

            if (doc.nonDisponibilite) {
              publishUpdate(
                "publish_data",
                doc.nonDisponibilite,
                NONDISPONIBILITE_ADMIN_QUEUE
              );
            }

            if (doc.disponibiliteContractuelle) {
              publishUpdate(
                "publish_data",
                doc.disponibiliteContractuelle,
                DISPONIBILITECONTRACTUELLE_ADMIN_QUEUE
              );
            }
          }
          return;
        case "postUpdateMany":
          await PublishMessage(PRODUITSERVICE_CLIENT_QUEUE, {
            operation: "REMOVE_ITEMS",
            data: { condition: doc },
          });
          removeFiles(files);

          return;

        case "publishData":
          return;

        case "translate":
          return;
      }
    }
  } catch (error) {
    console.error(" communicateWithClient error==>", error);
  }
}
//add other hooks here
const produitService = mongoose.model("produitService", produitServiceSchema);
module.exports = produitService;
const ProduitAssocie = require("../models/produitAssocie.model");
const CaracteristiqueProduit = require("../models/caracteristiqueProduit.model");
const CodageProduit = require("../models/codageProduit.model");
const TarifUIndicatif = require("../models/tarifUIndicatif.model");
const TarifSaisonnier = require("../models/tarifSaisonnier.model");
const TarifUnitaireVariable = require("../models/tarifUnitaireVariable.model");
const GrilleTarifaire = require("../models/grilleTarifaire.model");
const TarifLivraison = require("./tarifLivraison.model");
const {
  PublishData: PublishProduitAssocie,
} = require("./repositories/produitAssocie.repositorie");
const caracteristiqueRepo = require("./repositories/caracteristiqueProduit.repositorie");
const {
  PublishData: PublishCodageProduit,
} = require("./repositories/codageProduit.repositorie");
const {
  PublishData: PublishTarifUIndicatif,
} = require("./repositories/tarifUIndicatif.repositorie");
const {
  PublishData: PublishTarifSaisonnier,
} = require("./repositories/tarifSaisonnier.repositorie");
const {
  PublishData: PublishTarifUnitaireVariable,
} = require("./repositories/tarifUnitaireVariable.repositorie");
const {
  PublishData: PublishGrilleTarifaire,
} = require("./repositories/grilleTarifaire.repositorie");
const {
  PublishData: PublishTarifLivraison,
} = require("./repositories/tarifLivraison.repositorie");

const { PublishMessage } = require("../helpers/communications");

const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  copyFiles,
  removeFiles,
  GroupBy,
  flatDeep,
  getDiffArray,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  ZONEGEOGRAPHIQUE_ADMIN_RPC,
  DISTINCTION_ADMIN_RPC,
  SOCIALMEDIA_ADMIN_RPC,
  INSTANCEGARANTIE_ADMIN_RPC,
  ETATOBJET_ADMIN_RPC,
  CONTENUMMEDIA_ADMIN_RPC,
  OFFREPROMOTIONNELLE_ADMIN_RPC,
  INDICATIONFRAISADDITIONNELLE_ADMIN_RPC,
  STOCK_ADMIN_RPC,
  STATISTIQUESDIRECTES_ADMIN_RPC,
  ANALYSE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  INSTANCEACTEURASSOCIE_ADMIN_RPC,
  INSTANCESEGMENT_ADMIN_RPC,
  PROBLEMEPERTINENCE_ADMIN_RPC,
  DETAILSINVENTAIRE_ADMIN_RPC,
  DETAILSOPERATIONLIVRAISON_ADMIN_RPC,
  OBJETCONCERNEERETOUR_ADMIN_RPC,
  SAV_ADMIN_RPC,
  ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
  MARQUE_ADMIN_RPC,
  MARQUE_ADMIN_QUEUE,
  DISTINCTION_ADMIN_QUEUE,
  SOCIALMEDIA_ADMIN_QUEUE,
  INSTANCEGARANTIE_ADMIN_QUEUE,
  ETATOBJET_ADMIN_QUEUE,
  CONTENUMMEDIA_ADMIN_QUEUE,
  OFFREPROMOTIONNELLE_ADMIN_QUEUE,
  INDICATIONFRAISADDITIONNELLE_ADMIN_QUEUE,
  ARTICLESTOCK_ADMIN_QUEUE,
  STATISTIQUESDIRECTES_ADMIN_QUEUE,
  ANALYSE_ADMIN_QUEUE,
  OBJETASSOCIEE_ADMIN_QUEUE,
  INSTANCEACTEURASSOCIE_ADMIN_QUEUE,
  INSTANCESEGMENT_ADMIN_QUEUE,
  PROBLEMEPERTINENCE_ADMIN_QUEUE,
  PRODUITASSOCIE_ADMIN_RPC,
  PRODUITASSOCIE_ADMIN_QUEUE,
  CATALOGUE_ADMIN_RPC,
  CATALOGUE_ADMIN_QUEUE,
  DETAILSINVENTAIRE_ADMIN_QUEUE,
  DETAILSOPERATIONLIVRAISON_ADMIN_QUEUE,
  AVANTAGEENNATURE_ADMIN_RPC,
  AVANTAGEENNATURE_ADMIN_QUEUE,
  OBJETCONCERNEERETOUR_ADMIN_QUEUE,
  SAV_ADMIN_QUEUE,
  OPERATIONDELIVRAISON_ADMIN_RPC,
  OPERATIONDELIVRAISON_ADMIN_QUEUE,
  PROTAGONISTEPOTONTIEL_ADMIN_RPC,
  PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
  PRODUITSERVICE_CLIENT_QUEUE,
  ACTEURSPRO_ADMIN_QUEUE,
  MONNAIE_ADMIN_RPC,
  INSTANCEOFFRE_ADMIN_RPC,
  INSTANCEOFFRE_ADMIN_QUEUE,
  RESERVATION_ADMIN_QUEUE,
  AGENDAEVENT_ADMIN_QUEUE,
  INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE,
  NONDISPONIBILITE_ADMIN_RPC,
  DISPONIBILITECONTRACTUELLE_ADMIN_QUEUE,
  NONDISPONIBILITE_ADMIN_QUEUE,
  DISPONIBILITECONTRACTUELLE_ADMIN_RPC,
  FAQ_ADMIN_QUEUE,
  FAQ_ADMIN_RPC,
} = require("../config");