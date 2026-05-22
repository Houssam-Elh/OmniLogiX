const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let acteursProSchema = new Schema(
  {
    etatDePublication: {
      type: String,
      required: true,
      enum: [
        "code_541",
        "code_223",
        "code_224",
        "code_550",
        "code_318",
        "code_3417",
      ],
    },
    refActorSocioEco: { type: String, required: true, unique: true },
    typeStructure: { type: Schema.Types.Mixed, required: true },
    statutStrcture: { type: Schema.Types.Mixed, required: true },
    activitePrincipale: { type: Schema.Types.Mixed, required: true },
    secteurActivite: { type: Schema.Types.ObjectId, required: true },
    translations: {
      type: [
        {
          language: { type: String },
          nomStructure: { type: String, required: true },
          slogan: { type: String },
          descriptionActeur: { type: String },
          commentaireInterne: { type: String },
        },
      ],
    },
    logo: { type: String },
    paysOrigine: { type: Schema.Types.Mixed, required: true },
    dateCreation: { type: Date, required: true },
    notation: { type: Number },
    taille: { type: Number },
    etat: { type: String, enum: ["code-1", "code_1728"], required: true },
    email: { type: String, required: true },
    telephone: { type: String, required: true },
    fixe: { type: String },
    autreTelephone1: { type: String },
    autreTelephone2: { type: String },
    siteWeb: { type: String },
    // nationalite: [{ type: Schema.Types.Mixed }],
    languesParles: [{ type: Schema.Types.Mixed }],
    isFournisseur: { type: Boolean },
    protagoniste: { type: ObjectId },
    coordonnees: { type: [ObjectId] },
    evenement: { type: [ObjectId] },
    distinctions: [{ type: Schema.Types.ObjectId }],
    organigrammeStructure: [{ type: Schema.Types.ObjectId }],
    organigrammePersonnel: { type: [ObjectId] },
    contenuMMEDIA: { type: [ObjectId] },
    histoire: [{ type: Schema.Types.ObjectId }],
    socialMedia: [{ type: Schema.Types.ObjectId }],
    acteursAssocies: [
      { type: Schema.Types.ObjectId, ref: "relationInterActeur" },
    ],
    promotions: [{ type: Schema.Types.ObjectId }],
    statistiquesDirectes: [{ type: Schema.Types.ObjectId }],
    traceFournisseur: { type: [ObjectId] },
    parrainePar: [{ type: Schema.Types.ObjectId }],
    actionnaires: [{ type: Schema.Types.ObjectId }],
    conseilAdministratif: [{ type: Schema.Types.ObjectId }],
    etatObjet: { type: String, default: "code-1", enum: ["code-1", "code-2"] },
    abonnees: { type: [ObjectId] },
    rdv: [{ type: Schema.Types.ObjectId }],
    horaire: { type: [ObjectId] },
    contrat: [{ type: Schema.Types.ObjectId }],
    inbox: { type: [ObjectId] },
    expressions: { type: [ObjectId] },
    selection: { type: [ObjectId] },
    informationComplementaire: [{ type: Schema.Types.ObjectId }],
    representationMarque: [{ type: Schema.Types.ObjectId }],
    candidatureSpontane: { type: [ObjectId] },
    objetsAssocies: [{ type: Schema.Types.ObjectId }],
    notifications: [{ type: Schema.Types.ObjectId }],
    recherches: { type: [ObjectId] },
    offres: { type: [ObjectId] },
    favories: { type: [ObjectId] },
    acteursEcosysteme: { type: ObjectId },
    caracteristiques: [{ type: Schema.Types.ObjectId }],
    identitesAdministratifs: [{ type: Schema.Types.ObjectId }],
    actionsSocialesSolidaires: [{ type: Schema.Types.ObjectId }],
    temoignage: [{ type: Schema.Types.ObjectId }],
    referencesProfessionnelles: [{ type: Schema.Types.ObjectId }],
    myEservice: [{ type: Schema.Types.ObjectId, ref: "myEservice" }],
    catalogue: [{ type: Schema.Types.ObjectId }],
    produitService: [{ type: Schema.Types.ObjectId }],
    faq: [{ type: Schema.Types.ObjectId }],
    //#region new attribut declaration
    coordonneesGeo: [{ type: Schema.Types.ObjectId }],
    mMEDIA: [{ type: Schema.Types.ObjectId }],
    objetsConcernes: {
      type: [
        {
          refObjet: { type: Schema.Types.ObjectId },
          typeObjet: { type: String },
        },
      ],
    },
    motDirecteur: { type: Schema.Types.ObjectId },
    presentation: { type: Schema.Types.ObjectId },
    notreHistoire: { type: Schema.Types.ObjectId },
    notreDevise: { type: Schema.Types.ObjectId },
    notrePositionnement: { type: Schema.Types.ObjectId },
    documentAssocie: [{ type: Schema.Types.ObjectId }],
    conseilPratiques: { type: Schema.Types.ObjectId },
    //#endregion
    reclamation: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

// autoPopulate hook

const populateField = [
  { path: "acteursAssocies", match: { etatObjet: "code-1" }, populate: [] },
  { path: "myEservice", match: { etatObjet: "code-1" }, populate: [] },
];
acteursProSchema.pre("aggregate", function (next) {
  try {
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
  } catch (error) {
    next(error);
  }
});
acteursProSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

//rewrite insertMany
acteursProSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    this.populate(doc, populateField);

    //#region new insert many bloc
    let coordonneesGeo = GroupBy(doc, "coordonneesGeo");
    for (let item of Object.keys(coordonneesGeo)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(coordonneesGeo[item].map((d) => d.coordonneesGeo))
            ),
          ],
          COORDONNEEGEO_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: coordonneesGeo[item].map(
                  (i) =>
                    (i = {
                      refObjetConcerne: i._id,
                      typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
                    })
                ),
              },
            },
          }
        );
    }
    let mMEDIA = GroupBy(doc, "mMEDIA");
    for (let item of Object.keys(mMEDIA)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(mMEDIA[item].map((d) => d.mMEDIA)))],
          CONTENUMMEDIA_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: mMEDIA[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "ACTEURSPRO_ACTEURPROFESSIONEL",
                    })
                ),
              },
            },
          }
        );
    }
    let notifications = GroupBy(doc, "notifications");
    for (let item of Object.keys(notifications)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(notifications[item].map((d) => d.notifications))
            ),
          ],
          NOTIFICATION_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              personneConcerne: {
                $each: notifications[item].map(
                  (i) =>
                    (i = {
                      refPersonneConcerne: i._id,
                      typePersonneConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
                    })
                ),
              },
            },
          }
        );
    }

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
            if (item.toLowerCase() == "acteursecosysteme_acteurecosysteme") {
              key = ACTEURSECOSYSTEME_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  acteurSocioEconomique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "organisationconcernee_protagoniste"
            ) {
              key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  annuaireActeursPro: {
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

//hooks
let prevState = null;
/*new*/ /*new20*/ async function distantRequest(doc) {
  try {
    console.log("Entred to Distant Request ");
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                [
                  "typeStructure",
                  "statutStrcture",
                  "activitePrincipale",
                  "secteurActivite",
                  "paysOrigine",
                  // "nationalite",
                  "languesParles",
                ],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(doc, FAQ_ADMIN_RPC, ["faq"], "VIEW_ITEMS"),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                [
                  "typeStructure",
                  "statutStrcture",
                  "activitePrincipale",
                  "secteurActivite",
                  "paysOrigine",
                  // "nationalite",
                  "languesParles",
                ],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                COORDONNEEGEO_ADMIN_RPC,
                ["coordonneesGeo"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-horaire -zones -objetsConcernes" } }
              ),
              sendRPCRequest(
                doc,
                DISTINCTION_ADMIN_RPC,
                ["distinctions"],
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
                ORGANIGRAMMESTRUCTURE_ADMIN_RPC,
                ["organigrammeStructure"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-acteur -refObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                CONTENUMMEDIA_ADMIN_RPC,
                ["mMEDIA"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-auteurs -objetAssocie -objetsConcernes",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                HISTOIRE_ADMIN_RPC,
                ["histoire"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-objetsAssocies -etats -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                SOCIALMEDIA_ADMIN_RPC,
                ["socialMedia"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-objetAssocie " } }
              ),
              sendRPCRequest(
                doc,
                OFFREPROMOTIONNELLE_ADMIN_RPC,
                ["promotions"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-refPricingRule -instanceCritere -regleAssocie -statistique -acteurPro",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                STATISTIQUESDIRECTES_ADMIN_RPC,
                ["statistiquesDirectes"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                PARRAINEPAR_ADMIN_RPC,
                ["parrainePar"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-refTemoignage -refRepresentation -objetAssocie -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                ACTIONNAIRE_ADMIN_RPC,
                ["actionnaires"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-refPersonneAuteur -refOrganisationAuteur -refActeurSocioEconomique -refObjetAccosie -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                CONSEILADMINISTRATION_ADMIN_RPC,
                ["conseilAdministratif"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-refObjetAssocie -refauteurSocioEconomique -acteurConcerne",
                  },
                }
              ),
              sendRPCRequest(doc, RENCONTRE_ADMIN_RPC, ["rdv"], "VIEW_ITEMS", {
                queryOptions: {
                  select:
                    "-protagoniste -programme -communiqueDePresse -event -lieu -documentsAsscocies -objetsAssocies -bilan -instanceDocument -mailing -operationEnLigne -instructionDirectives -objetConcerne -cout -dateSpecifique -acteurConcerne",
                },
              }),
              sendRPCRequest(
                doc,
                INSTANCECONTRAT_ADMIN_RPC,
                ["contrat"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-refContratModel -objetsAssocies -refObjetContrat",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                REPRESENTATIONMARQUEGROUPEENTREPRISE_ADMIN_RPC,
                ["representationMarque"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-objetAssocie -acteur -parrainePar -instanceContenuMMedia",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                OBJETASSOCIEE_ADMIN_RPC,
                ["objetsAssocies"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObjet" } }
              ),
              sendRPCRequest(
                doc,
                NOTIFICATION_ADMIN_RPC,
                ["notifications"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-etats -echangesCommunications -objetsAssocies -personneConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                INSTANCECARACTERISTIQUE_ADMIN_RPC,
                ["caracteristiques"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                ENREGISTREMENTLEGAL_ADMIN_RPC,
                ["identitesAdministratifs"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-acteur" } }
              ),
              sendRPCRequest(
                doc,
                ACTIONSOCIALSOLIDAIRE_ADMIN_RPC,
                ["actionsSocialesSolidaires"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-acteur -objetAssocie -contenuMMedia",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                TEMOIGNAGE_ADMIN_RPC,
                ["temoignage"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-objetAssocie -objetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                REFERENCESPROFESSIONNELLE_ADMIN_RPC,
                ["referencesProfessionnelles"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-acteur -objetAssocie -instanceContenuMMEDIA",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                INFORMATIONCOMPLEMENTAIRE_ADMIN_RPC,
                ["informationComplementaire"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-objetAssocie -refObjetConcerne" } }
              ),
              sendRPCRequest(doc, HORAIRE_ADMIN_RPC, ["horaire"], "VIEW_ITEMS"),
              sendRPCRequest(
                doc,
                ORGANIGRAMMEPERSONNEL_ADMIN_RPC,
                ["organigrammePersonnel"],
                "VIEW_ITEMS"
              ),
              sendRPCRequest(
                doc,
                EXPRESSION_ADMIN_RPC,
                ["expressions"],
                "VIEW_ITEMS"
              ),
              sendRPCRequest(
                doc,
                PROTAGONISTE_ADMIN_RPC,
                ["protagoniste"],
                "VIEW_ITEM"
              ),
              sendRPCRequest(
                doc,
                AGENDAEVENT_ADMIN_RPC,
                ["evenement"],
                "VIEW_ITEMS"
              ),
              sendRPCRequest(
                doc,
                CATALOGUE_ADMIN_RPC,
                ["catalogue"],
                "VIEW_ITEMS"
              ),
              sendRPCRequest(
                doc,
                PRODUITSERVICE_ADMIN_RPC,
                ["produitService"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-fournisseurAssocie -madeInProduit -paysTVADefaut -marqueAssocie -distanction -socialMediaAssocie -garantieAssurance -etatObjetAssocie -contenueMediaAssocie -instanceOffre -indicationFraisAddi -indicationStock -parametreExped -statistiqueDirectAssocie -analyseAssocie -objetAssocie -instanceActeurAssocie -instanceSegment -criseRisqueAssocie",
                  },
                }
              ),
              sendRPCRequest(doc, FAQ_ADMIN_RPC, ["faq"], "VIEW_ITEMS"),
              // motDirecteur
              sendRPCRequest(
                doc,
                POSTARTICLE_ADMIN_RPC,
                ["motDirecteur"],
                "VIEW_ITEM"
              ),
              sendRPCRequest(
                doc,
                POSTARTICLE_ADMIN_RPC,
                ["presentation"],
                "VIEW_ITEM"
              ),
              sendRPCRequest(
                doc,
                POSTARTICLE_ADMIN_RPC,
                ["notreHistoire"],
                "VIEW_ITEM"
              ),
              sendRPCRequest(
                doc,
                POSTARTICLE_ADMIN_RPC,
                ["notreDevise"],
                "VIEW_ITEM"
              ),
              sendRPCRequest(
                doc,
                POSTARTICLE_ADMIN_RPC,
                ["notrePositionnement"],
                "VIEW_ITEM"
              ),
              sendRPCRequest(
                doc,
                PARUDANSLAPRESSE_ADMIN_RPC,
                ["paruDansLaPress"],
                "VIEW_ITEMS"
              ),
              sendRPCRequest(
                doc,
                CONTACTEZNOUS_ADMIN_RPC,
                ["contact"],
                "VIEW_ITEMS"
              ),
              sendRPCRequest(
                doc,
                DOCUMENTREFERENCE_ADMIN_RPC,
                ["documentAssocie"],
                "VIEW_ITEMS"
              ),
              sendRPCRequest(
                doc,
                RUBRIQUE_ADMIN_RPC,
                ["conseilPratiques"],
                "VIEW_ITEM"
              ),

              sendRPCRequest(
                doc,
                RECLAMATION_ADMIN_RPC,
                ["reclamation"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-objetConcerne -traitement -plainte -instanceProtagoniste -analyseSpecifique -echangeEtCommunication -instanceCaracteristique",
                  },
                }
              ),
            ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["typeStructure"])
              d["typeStructure"] =
                result[0].find(
                  (item) =>
                    item._id == (d["typeStructure"]._id || d["typeStructure"])
                ) || d["typeStructure"];
            if (d["statutStrcture"])
              d["statutStrcture"] =
                result[0].find(
                  (item) =>
                    item._id == (d["statutStrcture"]._id || d["statutStrcture"])
                ) || d["statutStrcture"];
            if (d["activitePrincipale"])
              d["activitePrincipale"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["activitePrincipale"]._id || d["activitePrincipale"])
                ) || d["activitePrincipale"];
            if (d["secteurActivite"])
              d["secteurActivite"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["secteurActivite"]._id || d["secteurActivite"])
                ) || d["secteurActivite"];
            if (d["paysOrigine"])
              d["paysOrigine"] =
                result[0].find(
                  (item) =>
                    item._id == (d["paysOrigine"]._id || d["paysOrigine"])
                ) || d["paysOrigine"];
            // if (d["nationalite"] && d["nationalite"].length)
            //   d["nationalite"] = d["nationalite"].map(
            //     (d) =>
            //       (d = result[0].find((item) => item._id == (d._id || d)) || d)
            //   );
            if (d["languesParles"] && d["languesParles"].length)
              d["languesParles"] = d["languesParles"].map(
                (d) =>
                  (d = result[0].find((item) => item._id == (d._id || d)) || d)
              );
            if (d["faq"] && d["faq"].length)
              d["faq"] = d["faq"].map(
                (d) =>
                  (d = result[1].find((item) => item._id == (d._id || d)) || d)
              );
          });
        } else {
          if (doc["typeStructure"])
            doc["typeStructure"] =
              result[0].find(
                (item) =>
                  item._id == (doc["typeStructure"]._id || doc["typeStructure"])
              ) || doc["typeStructure"];
          if (doc["statutStrcture"])
            doc["statutStrcture"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["statutStrcture"]._id || doc["statutStrcture"])
              ) || doc["statutStrcture"];
          if (doc["activitePrincipale"])
            doc["activitePrincipale"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["activitePrincipale"]._id || doc["activitePrincipale"])
              ) || doc["activitePrincipale"];
          if (doc["secteurActivite"])
            doc["secteurActivite"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["secteurActivite"]._id || doc["secteurActivite"])
              ) || doc["secteurActivite"];
          if (doc["paysOrigine"])
            doc["paysOrigine"] =
              result[0].find(
                (item) =>
                  item._id == (doc["paysOrigine"]._id || doc["paysOrigine"])
              ) || doc["paysOrigine"];
          // if (doc["nationalite"] && doc["nationalite"].length)
          //   doc["nationalite"] = doc["nationalite"].map(
          //     (d) =>
          //       (d = result[0].find((item) => item._id == (d._id || d)) || d)
          //   );
          if (doc["languesParles"] && doc["languesParles"].length)
            doc["languesParles"] = doc["languesParles"].map(
              (d) =>
                (d = result[0].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["coordonneesGeo"] && doc["coordonneesGeo"].length)
            doc["coordonneesGeo"] = doc["coordonneesGeo"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["distinctions"] && doc["distinctions"].length)
            doc["distinctions"] = doc["distinctions"].map(
              (d) =>
                (d = result[2].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["organigrammeStructure"] &&
            doc["organigrammeStructure"].length
          )
            doc["organigrammeStructure"] = doc["organigrammeStructure"].map(
              (d) =>
                (d = result[3].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["mMEDIA"] && doc["mMEDIA"].length)
            doc["mMEDIA"] = doc["mMEDIA"].map(
              (d) =>
                (d = result[4].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["histoire"] && doc["histoire"].length)
            doc["histoire"] = doc["histoire"].map(
              (d) =>
                (d = result[5].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["socialMedia"] && doc["socialMedia"].length)
            doc["socialMedia"] = doc["socialMedia"].map(
              (d) =>
                (d = result[6].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["promotions"] && doc["promotions"].length)
            doc["promotions"] = doc["promotions"].map(
              (d) =>
                (d = result[7].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["statistiquesDirectes"] && doc["statistiquesDirectes"].length)
            doc["statistiquesDirectes"] = doc["statistiquesDirectes"].map(
              (d) =>
                (d = result[8].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["parrainePar"] && doc["parrainePar"].length)
            doc["parrainePar"] = doc["parrainePar"].map(
              (d) =>
                (d = result[9].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["actionnaires"] && doc["actionnaires"].length)
            doc["actionnaires"] = doc["actionnaires"].map(
              (d) =>
                (d = result[10].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["conseilAdministratif"] && doc["conseilAdministratif"].length)
            doc["conseilAdministratif"] = doc["conseilAdministratif"].map(
              (d) =>
                (d = result[11].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["rdv"] && doc["rdv"].length)
            doc["rdv"] = doc["rdv"].map(
              (d) =>
                (d = result[12].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["contrat"] && doc["contrat"].length)
            doc["contrat"] = doc["contrat"].map(
              (d) =>
                (d = result[13].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["representationMarque"] && doc["representationMarque"].length)
            doc["representationMarque"] = doc["representationMarque"].map(
              (d) =>
                (d = result[14].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["objetsAssocies"] && doc["objetsAssocies"].length)
            doc["objetsAssocies"] = doc["objetsAssocies"].map(
              (d) =>
                (d = result[15].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["notifications"] && doc["notifications"].length)
            doc["notifications"] = doc["notifications"].map(
              (d) =>
                (d = result[16].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["caracteristiques"] && doc["caracteristiques"].length)
            doc["caracteristiques"] = doc["caracteristiques"].map(
              (d) =>
                (d = result[17].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["identitesAdministratifs"] &&
            doc["identitesAdministratifs"].length
          )
            doc["identitesAdministratifs"] = doc["identitesAdministratifs"].map(
              (d) =>
                (d = result[18].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["actionsSocialesSolidaires"] &&
            doc["actionsSocialesSolidaires"].length
          )
            doc["actionsSocialesSolidaires"] = doc[
              "actionsSocialesSolidaires"
            ].map(
              (d) =>
                (d = result[19].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["temoignage"] && doc["temoignage"].length)
            doc["temoignage"] = doc["temoignage"].map(
              (d) =>
                (d = result[20].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["referencesProfessionnelles"] &&
            doc["referencesProfessionnelles"].length
          )
            doc["referencesProfessionnelles"] = doc[
              "referencesProfessionnelles"
            ].map(
              (d) =>
                (d = result[21].find((item) => item._id == (d._id || d)) || d)
            );

          if (
            doc["informationComplementaire"] &&
            doc["informationComplementaire"].length
          )
            doc["informationComplementaire"] = doc[
              "informationComplementaire"
            ].map(
              (d) =>
                (d = result[22].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["horaire"] && doc["horaire"].length)
            doc["horaire"] = doc["horaire"].map(
              (d) =>
                (d = result[23].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["organigrammePersonnel"] &&
            doc["organigrammePersonnel"].length
          )
            doc["organigrammePersonnel"] = doc["organigrammePersonnel"].map(
              (d) =>
                (d = result[24].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["expressions"] && doc["expressions"].length)
            doc["expressions"] = doc["expressions"].map(
              (d) =>
                (d = result[25].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["protagoniste"] && result[26])
            doc["protagoniste"] = result[26] || doc["protagoniste"];

          if (doc["evenement"] && doc["evenement"].length)
            doc["evenement"] = doc["evenement"].map(
              (d) =>
                (d = result[27].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["catalogue"] && doc["catalogue"].length)
            doc["catalogue"] = doc["catalogue"].map(
              (d) =>
                (d = result[28].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["produitService"] && doc["produitService"].length)
            doc["produitService"] = doc["produitService"].map(
              (d) =>
                (d = result[29].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["faq"] && doc["faq"].length)
            doc["faq"] = doc["faq"].map(
              (d) =>
                (d = result[30].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["motDirecteur"])
            doc["motDirecteur"] = result[31] || doc["motDirecteur"];

          if (doc["presentation"])
            doc["presentation"] = result[32] || doc["presentation"];

          if (doc["notreHistoire"])
            doc["notreHistoire"] = result[33] || doc["notreHistoire"];

          if (doc["notreDevise"])
            doc["notreDevise"] = result[34] || doc["notreDevise"];

          if (doc["notrePositionnement"])
            doc["notrePositionnement"] =
              result[35] || doc["notrePositionnement"];

          if (doc["paruDansLaPress"] && doc["paruDansLaPress"].length)
            doc["paruDansLaPress"] = doc["paruDansLaPress"].map(
              (d) =>
                (d = result[36].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["contact"] && doc["contact"].length)
            doc["contact"] = doc["contact"].map(
              (d) =>
                (d = result[37].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["documentAssocie"] && doc["documentAssocie"].length)
            doc["documentAssocie"] = doc["documentAssocie"].map(
              (d) =>
                (d = result[38].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["conseilPratiques"])
            doc["conseilPratiques"] = result[39] || doc["conseilPratiques"];

          if (doc["reclamation"] && doc["reclamation"].length)
            doc["reclamation"] = doc["reclamation"].map(
              (d) =>
                (d = result[40].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}
acteursProSchema.post(/find.*|save/, async function (doc, next) {
  try {
    if (doc) {
      await distantRequest(doc);
      next();
    }
  } catch (err) {
    next(err);
  }
});
acteursProSchema.post("save", async function (doc, next) {
  try {
    if (this.relationAssocie?.length) {
      console.log(" this.relationAssocie ", this.relationAssocie);
      await RelationInterActeur.updateMany(
        { _id: { $in: this.relationAssocie } },
        { $addToSet: { acteurAssocie: this._id } }
      );
    }

    //#region new save bloc
    if (doc.coordonneesGeo.length)
      publishUpdate(
        "update_items",
        doc.coordonneesGeo,
        COORDONNEEGEO_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjetConcerne: doc._id,
              typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
            },
          },
        }
      );
    if (doc.distinctions.length)
      publishUpdate("update_items", doc.distinctions, DISTINCTION_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          referenceObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      });
    if (doc.organigrammeStructure.length)
      publishUpdate(
        "update_items",
        doc.organigrammeStructure,
        ORGANIGRAMMESTRUCTURE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
          },
        }
      );
    if (doc.mMEDIA.length)
      publishUpdate("update_items", doc.mMEDIA, CONTENUMMEDIA_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "ACTEURSPRO_ACTEURPROFESSIONEL",
          },
        },
      });
    if (doc.histoire.length)
      publishUpdate("update_items", doc.histoire, HISTOIRE_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      });
    if (doc.socialMedia.length)
      publishUpdate("update_items", doc.socialMedia, SOCIALMEDIA_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          objetConcene: doc._id,
          typeObjetConcene: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      });
    if (doc.promotions.length)
      publishUpdate(
        "update_items",
        doc.promotions,
        OFFREPROMOTIONNELLE_ADMIN_QUEUE,
        { operation: "$set", body: { acteurPro: doc._id } }
      );
    if (doc.statistiquesDirectes.length)
      publishUpdate(
        "update_items",
        doc.statistiquesDirectes,
        STATISTIQUESDIRECTES_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcene: "ACTEURSPRO_ACTEURPROFESSIONEL",
          },
        }
      );
    if (doc.parrainePar.length)
      publishUpdate("update_items", doc.parrainePar, PARRAINEPAR_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      });
    if (doc.actionnaires.length)
      publishUpdate("update_items", doc.actionnaires, ACTIONNAIRE_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      });
    if (doc.conseilAdministratif.length)
      publishUpdate(
        "update_items",
        doc.conseilAdministratif,
        CONSEILADMINISTRATION_ADMIN_QUEUE,
        { operation: "$set", body: { acteurConcerne: doc._id } }
      );
    if (doc.rdv.length)
      publishUpdate("update_items", doc.rdv, RENCONTRE_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          acteurConcerne: doc._id,
          typeActeur: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      });
    if (doc.contrat.length)
      publishUpdate("update_items", doc.contrat, INSTANCECONTRAT_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObjetContrat: doc._id,
          typeObjetContrat: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      });
    if (doc.representationMarque.length)
      publishUpdate(
        "update_items",
        doc.representationMarque,
        REPRESENTATIONMARQUEGROUPEENTREPRISE_ADMIN_QUEUE,
        { operation: "$set", body: { acteur: doc._id } }
      );
    if (doc.objetsAssocies.length)
      publishUpdate(
        "update_items",
        doc.objetsAssocies,
        OBJETASSOCIEE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjet: doc._id,
            typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
          },
        }
      );
    if (doc.notifications.length)
      publishUpdate(
        "update_items",
        doc.notifications,
        NOTIFICATION_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            personneConcerne: {
              refPersonneConcerne: doc._id,
              typePersonneConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
            },
          },
        }
      );
    // if (doc.caracteristiques.length)
    //   publishUpdate(
    //     "update_items",
    //     doc.caracteristiques,
    //     INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
    //     {
    //       operation: "$set",
    //       body: {
    //         refObjetConcerne: doc._id,
    //         typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
    //       },
    //     }
    //   );
    if (doc.identitesAdministratifs.length)
      publishUpdate(
        "update_items",
        doc.identitesAdministratifs,
        ENREGISTREMENTLEGAL_ADMIN_QUEUE,
        { operation: "$set", body: { acteur: doc._id } }
      );
    if (doc.actionsSocialesSolidaires.length)
      publishUpdate(
        "update_items",
        doc.actionsSocialesSolidaires,
        ACTIONSOCIALSOLIDAIRE_ADMIN_QUEUE,
        { operation: "$set", body: { acteur: doc._id } }
      );
    if (doc.temoignage.length)
      publishUpdate("update_items", doc.temoignage, TEMOIGNAGE_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          objetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      });
    if (doc.referencesProfessionnelles.length)
      publishUpdate(
        "update_items",
        doc.referencesProfessionnelles,
        REFERENCESPROFESSIONNELLE_ADMIN_QUEUE,
        { operation: "$set", body: { acteur: doc._id } }
      );
    if (doc.informationComplementaire.length)
      publishUpdate(
        "update_items",
        doc.informationComplementaire,
        INFORMATIONCOMPLEMENTAIRE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
          },
        }
      );

    if (doc.objetsConcernes.length) {
      let typeObjet = GroupBy(doc.objetsConcernes, "typeObjet");
      for (let item of Object.keys(typeObjet)) {
        if (item) {
          let body;
          let key;
          if (item.toLowerCase() == "acteursecosysteme_acteurecosysteme") {
            key = ACTEURSECOSYSTEME_ADMIN_QUEUE;
            body = {
              operation: "$set",
              body: { acteurSocioEconomique: doc._id },
            };
          } else if (
            item.toLowerCase() == "acteursecosysteme_acteurecosysteme"
          ) {
            key = ACTEURSECOSYSTEME_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { acteurSocioEconomique: doc._id },
            };
          } else if (
            item.toLowerCase() == "organisationconcernee_protagoniste"
          ) {
            key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
            body = { operation: "$set", body: { annuaireActeursPro: doc._id } };
          } else if (
            item.toLowerCase() == "organisationconcernee_protagoniste"
          ) {
            key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { annuaireActeursPro: doc._id },
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
    } //#enregion new save bloc
    next();
  } catch (error) {
    next(error);
  }
});
let itemToCheck = {};

acteursProSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await acteursPro.findOne(this.getQuery()).lean();

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["coordonneesGeo"] = doc.coordonneesGeo;
      itemToCheck["distinctions"] = doc.distinctions;
      itemToCheck["organigrammeStructure"] = doc.organigrammeStructure;
      itemToCheck["mMEDIA"] = doc.mMEDIA;
      itemToCheck["histoire"] = doc.histoire;
      itemToCheck["socialMedia"] = doc.socialMedia;
      itemToCheck["promotions"] = doc.promotions;
      itemToCheck["statistiquesDirectes"] = doc.statistiquesDirectes;
      itemToCheck["parrainePar"] = doc.parrainePar;
      itemToCheck["actionnaires"] = doc.actionnaires;
      itemToCheck["conseilAdministratif"] = doc.conseilAdministratif;
      itemToCheck["rdv"] = doc.rdv;
      itemToCheck["contrat"] = doc.contrat;
      itemToCheck["representationMarque"] = doc.representationMarque;
      itemToCheck["objetsAssocies"] = doc.objetsAssocies;
      itemToCheck["notifications"] = doc.notifications;
      itemToCheck["caracteristiques"] = doc.caracteristiques;
      itemToCheck["identitesAdministratifs"] = doc.identitesAdministratifs;
      itemToCheck["actionsSocialesSolidaires"] = doc.actionsSocialesSolidaires;
      itemToCheck["temoignage"] = doc.temoignage;
      itemToCheck["referencesProfessionnelles"] =
        doc.referencesProfessionnelles;
      itemToCheck["informationComplementaire"] = doc.informationComplementaire;
      itemToCheck["objetsConcernes"] = doc.objetsConcernes;
      //#endregion new pre find and update bloc
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const relationAssocieIds = this._update?.["$set"]?.relationAssocie;
      if (
        relationAssocieIds &&
        doc?.relationAssocie &&
        doc?.relationAssocie != relationAssocieIds
      ) {
        let ids = doc?.relationAssocie
          .map((item) => item._id || item)
          .filter((item) => !relationAssocieIds.includes(item));
        await RelationInterActeur.updateMany(
          { _id: { $in: ids } },
          { $pull: { acteurAssocie: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
acteursProSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    //#region new post find and update bloc
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
            if (item.toLowerCase() == "acteursecosysteme_acteurecosysteme") {
              key = ACTEURSECOSYSTEME_ADMIN_QUEUE;
              body = {
                operation: "$pull",
                body: { acteurSocioEconomique: doc._id },
              };
            } else if (
              item.toLowerCase() == "organisationconcernee_protagoniste"
            ) {
              key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
              body = {
                operation: "$pull",
                body: { annuaireActeursPro: doc._id },
              };
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
            if (item.toLowerCase() == "acteursecosysteme_acteurecosysteme") {
              key = ACTEURSECOSYSTEME_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { acteurSocioEconomique: doc._id },
              };
            } else if (
              item.toLowerCase() == "organisationconcernee_protagoniste"
            ) {
              key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { annuaireActeursPro: doc._id },
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

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["coordonneesGeo"], newData: doc.coordonneesGeo },
      COORDONNEEGEO_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjetConcerne: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["distinctions"], newData: doc.distinctions },
      DISTINCTION_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { referenceObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          referenceObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["organigrammeStructure"],
        newData: doc.organigrammeStructure,
      },
      ORGANIGRAMMESTRUCTURE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["mMEDIA"], newData: doc.mMEDIA },
      CONTENUMMEDIA_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "ACTEURSPRO_ACTEURPROFESSIONEL",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["histoire"], newData: doc.histoire },
      HISTOIRE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["socialMedia"], newData: doc.socialMedia },
      SOCIALMEDIA_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { objetConcene: null, typeObjetConcene: null },
        bodyPush: {
          objetConcene: doc._id,
          typeObjetConcene: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["promotions"], newData: doc.promotions },
      OFFREPROMOTIONNELLE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { acteurPro: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["statistiquesDirectes"],
        newData: doc.statistiquesDirectes,
      },
      STATISTIQUESDIRECTES_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcene: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcene: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["parrainePar"], newData: doc.parrainePar },
      PARRAINEPAR_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["actionnaires"], newData: doc.actionnaires },
      ACTIONNAIRE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["conseilAdministratif"],
        newData: doc.conseilAdministratif,
      },
      CONSEILADMINISTRATION_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { acteurConcerne: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["rdv"], newData: doc.rdv },
      RENCONTRE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { acteurConcerne: null, typeActeur: null },
        bodyPush: {
          acteurConcerne: doc._id,
          typeActeur: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["contrat"], newData: doc.contrat },
      INSTANCECONTRAT_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetContrat: null, typeObjetContrat: null },
        bodyPush: {
          refObjetContrat: doc._id,
          typeObjetContrat: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["representationMarque"],
        newData: doc.representationMarque,
      },
      REPRESENTATIONMARQUEGROUPEENTREPRISE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { acteur: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["objetsAssocies"], newData: doc.objetsAssocies },
      OBJETASSOCIEE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjet: null, typeObjetConcerne: null },
        bodyPush: {
          refObjet: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["notifications"], newData: doc.notifications },
      NOTIFICATION_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { personneConcerne: { refPersonneConcerne: doc._id } },
        bodyPush: {
          personneConcerne: {
            refPersonneConcerne: doc._id,
            typePersonneConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["caracteristiques"],
        newData: doc.caracteristiques,
      },
      INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["identitesAdministratifs"],
        newData: doc.identitesAdministratifs,
      },
      ENREGISTREMENTLEGAL_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { acteur: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["actionsSocialesSolidaires"],
        newData: doc.actionsSocialesSolidaires,
      },
      ACTIONSOCIALSOLIDAIRE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { acteur: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["temoignage"], newData: doc.temoignage },
      TEMOIGNAGE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { objetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          objetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["referencesProfessionnelles"],
        newData: doc.referencesProfessionnelles,
      },
      REFERENCESPROFESSIONNELLE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { acteur: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["informationComplementaire"],
        newData: doc.informationComplementaire,
      },
      INFORMATIONCOMPLEMENTAIRE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "ACTEURSPRO_ACTEURPROFESSIONEL",
        },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);
    if (doc.relationAssocie?.length) {
      await RelationInterActeur.updateMany(
        { _id: { $in: doc.relationAssocie.map((d) => d._id || d) } },
        { $addToSet: { acteurAssocie: doc._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
acteursProSchema.post("updateMany", async function (docs, next) {
  try {
    console.log(' this._update?.["$addToSet"]', this._update);
    // console.log("post updqte", this._update?.["$addToSet"], this.getQuery());
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      //#region new addToSet bloc

      if (this._update?.["$addToSet"]?.objetsConcernes && docs.modifiedCount) {
        let body;
        let key;
        if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "acteursecosysteme_acteurecosysteme"
        ) {
          key = ACTEURSECOSYSTEME_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              acteurSocioEconomique: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "organisationconcernee_protagoniste"
        ) {
          key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              annuaireActeursPro: { $each: this.getQuery()?._id?.["$in"] },
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
      //#endregion new addToSet bloc

      if (this._update?.["$addToSet"].relationAssocie) {
        await RelationInterActeur.updateOne(
          { _id: this._update?.["$addToSet"]?.relationAssocie },
          {
            $addToSet: { acteurAssocie: { $each: this.getQuery()._id["$in"] } },
          }
        );
      }
    } else {
      let doc = await acteursPro.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.coordonneesGeo)))],
          COORDONNEEGEO_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: {
              objetsConcernes: { refObjetConcerne: this.getQuery()._id },
            },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.distinctions)))],
          DISTINCTION_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.organigrammeStructure)))],
          ORGANIGRAMMESTRUCTURE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.mMEDIA)))],
          CONTENUMMEDIA_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.histoire)))],
          HISTOIRE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.socialMedia)))],
          SOCIALMEDIA_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.promotions)))],
          OFFREPROMOTIONNELLE_ADMIN_QUEUE,
          { operation: "$set", body: { acteurPro: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.statistiquesDirectes)))],
          STATISTIQUESDIRECTES_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.parrainePar)))],
          PARRAINEPAR_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.actionnaires)))],
          ACTIONNAIRE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.conseilAdministratif)))],
          CONSEILADMINISTRATION_ADMIN_QUEUE,
          { operation: "$set", body: { acteurConcerne: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.rdv)))],
          RENCONTRE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.contrat)))],
          INSTANCECONTRAT_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.representationMarque)))],
          REPRESENTATIONMARQUEGROUPEENTREPRISE_ADMIN_QUEUE,
          { operation: "$set", body: { acteur: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.objetsAssocies)))],
          OBJETASSOCIEE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.notifications)))],
          NOTIFICATION_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: {
              personneConcerne: { refPersonneConcerne: this.getQuery()._id },
            },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.caracteristiques)))],
          INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.identitesAdministratifs)))],
          ENREGISTREMENTLEGAL_ADMIN_QUEUE,
          { operation: "$set", body: { acteur: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.actionsSocialesSolidaires)))],
          ACTIONSOCIALSOLIDAIRE_ADMIN_QUEUE,
          { operation: "$set", body: { acteur: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.temoignage)))],
          TEMOIGNAGE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.referencesProfessionnelles)))],
          REFERENCESPROFESSIONNELLE_ADMIN_QUEUE,
          { operation: "$set", body: { acteur: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.informationComplementaire)))],
          INFORMATIONCOMPLEMENTAIRE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
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
                if (
                  item.toLowerCase() == "acteursecosysteme_acteurecosysteme"
                ) {
                  key = ACTEURSECOSYSTEME_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      acteurSocioEconomique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "organisationconcernee_protagoniste"
                ) {
                  key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      annuaireActeursPro: {
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

        //#endregion new archive bloc

        let files = [];

        doc.map((d) => {
          if (d.logo) files.push(d.logo);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let myEservice = [];
        doc.map((d) => {
          myEservice.push(...d.myEservice.map((v) => v._id || v));
        });
        if (myEservice.length) {
          promises.push(
            MyEservice.updateMany(
              { _id: { $in: myEservice } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let relationAssocie = [];
        let myEservice = [];

        doc.map((d) => {
          relationAssocie.push(...d.relationAssocie.map((v) => v._id || v));
          myEservice.push(...d.myEservice.map((v) => v._id || v));
        });
        if (relationAssocie.length) {
          promises.push(
            RelationInterActeur.updateMany(
              { _id: { $in: relationAssocie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (myEservice.length) {
          promises.push(
            MyEservice.updateMany(
              { _id: { $in: myEservice } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
      }

      //#region new pull bloc
      if (this._update?.["$pull"]) {
        if (
          this._update?.["$pull"]?.coordonneesGeo &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].coordonneesGeo,
            COORDONNEEGEO_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: {
                objetsConcernes: { refObjetConcerne: this.getQuery()._id },
              },
            }
          );
        if (
          this._update?.["$pull"]?.mMEDIA &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].mMEDIA,
            CONTENUMMEDIA_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"]?.notifications &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].notifications,
            NOTIFICATION_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: {
                personneConcerne: { refPersonneConcerne: this.getQuery()._id },
              },
            }
          );
      }
      //#endregion new pull bloc
      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
acteursProSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await acteursPro.find(this.getQuery()).lean();
    const promises = [];
    let myEservice = [];
    doc.map((d) => {
      myEservice.push(...d.myEservice.map((v) => v._id || v));
    });
    if (myEservice.length) {
      promises.push(MyEservice.deleteMany({ _id: { $in: myEservice } }).exec());
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
            console.log("remove");
            await PublishMessage(ACTEURSPRO_CLIENT_QUEUE, {
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
            console.log("update");

            await PublishMessage(ACTEURSPRO_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(ACTEURSPRO_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }

          if (doc?.etatDePublication == "code_3417") {
            let files = [];
            if (doc.logo) files.push(doc.logo);
            copyFiles(files);
            if (doc?.relationAssocie?.length) {
              PublishRelationInterActeur(doc.relationAssocie);
            }
            if (doc?.myEservice?.length) {
              PublishMyEservice(doc.myEservice);
            }
            //#region new publish bloc
            if (doc.horaire.length)
              publishUpdate("publish_data", doc.horaire, HORAIRE_ADMIN_QUEUE);
            console.log(
              "🚀 ~ communicateWithClient ~ oc.coordonneesGeo:",
              doc.coordonneesGeo
            );
            if (doc.coordonneesGeo.length)
              publishUpdate(
                "publish_data",
                doc.coordonneesGeo,
                COORDONNEEGEO_ADMIN_QUEUE
              );
            if (doc.distinctions.length)
              publishUpdate(
                "publish_data",
                doc.distinctions,
                DISTINCTION_ADMIN_QUEUE
              );
            if (doc.protagoniste) {
              publishUpdate(
                "publish_data",
                doc.protagoniste,
                PROTAGONISTE_ADMIN_QUEUE
              );
            }
            if (doc.organigrammeStructure.length)
              publishUpdate(
                "publish_data",
                doc.organigrammeStructure,
                ORGANIGRAMMESTRUCTURE_ADMIN_QUEUE
              );
            if (doc.mMEDIA.length)
              publishUpdate(
                "publish_data",
                doc.mMEDIA,
                CONTENUMMEDIA_ADMIN_QUEUE
              );
            if (doc.histoire.length)
              publishUpdate("publish_data", doc.histoire, HISTOIRE_ADMIN_QUEUE);
            if (doc.socialMedia.length)
              publishUpdate(
                "publish_data",
                doc.socialMedia,
                SOCIALMEDIA_ADMIN_QUEUE
              );
            if (doc.promotions.length)
              publishUpdate(
                "publish_data",
                doc.promotions,
                OFFREPROMOTIONNELLE_ADMIN_QUEUE
              );
            if (doc.statistiquesDirectes.length)
              publishUpdate(
                "publish_data",
                doc.statistiquesDirectes,
                STATISTIQUESDIRECTES_ADMIN_QUEUE
              );
            if (doc.parrainePar.length)
              publishUpdate(
                "publish_data",
                doc.parrainePar,
                PARRAINEPAR_ADMIN_QUEUE
              );
            if (doc.actionnaires.length)
              publishUpdate(
                "publish_data",
                doc.actionnaires,
                ACTIONNAIRE_ADMIN_QUEUE
              );
            if (doc.conseilAdministratif.length)
              publishUpdate(
                "publish_data",
                doc.conseilAdministratif,
                CONSEILADMINISTRATION_ADMIN_QUEUE
              );
            if (doc.rdv.length)
              publishUpdate("publish_data", doc.rdv, RENCONTRE_ADMIN_QUEUE);
            if (doc.contrat.length)
              publishUpdate(
                "publish_data",
                doc.contrat,
                INSTANCECONTRAT_ADMIN_QUEUE
              );
            if (doc.faq.length) {
              publishUpdate("publish_data", doc.faq, FAQ_ADMIN_QUEUE);
            }
            if (doc.representationMarque.length)
              publishUpdate(
                "publish_data",
                doc.representationMarque,
                REPRESENTATIONMARQUEGROUPEENTREPRISE_ADMIN_QUEUE
              );
            if (doc.objetsAssocies.length)
              publishUpdate(
                "publish_data",
                doc.objetsAssocies,
                OBJETASSOCIEE_ADMIN_QUEUE
              );
            if (doc.notifications.length)
              publishUpdate(
                "publish_data",
                doc.notifications,
                NOTIFICATION_ADMIN_QUEUE
              );
            if (doc.caracteristiques.length)
              publishUpdate(
                "publish_data",
                doc.caracteristiques,
                INSTANCECARACTERISTIQUE_ADMIN_QUEUE
              );
            if (doc.identitesAdministratifs.length)
              publishUpdate(
                "publish_data",
                doc.identitesAdministratifs,
                ENREGISTREMENTLEGAL_ADMIN_QUEUE
              );
            if (doc.actionsSocialesSolidaires.length)
              publishUpdate(
                "publish_data",
                doc.actionsSocialesSolidaires,
                ACTIONSOCIALSOLIDAIRE_ADMIN_QUEUE
              );
            if (doc.temoignage.length)
              publishUpdate(
                "publish_data",
                doc.temoignage,
                TEMOIGNAGE_ADMIN_QUEUE
              );
            if (doc.referencesProfessionnelles.length)
              publishUpdate(
                "publish_data",
                doc.referencesProfessionnelles,
                REFERENCESPROFESSIONNELLE_ADMIN_QUEUE
              );
            if (doc.informationComplementaire.length)
              publishUpdate(
                "publish_data",
                doc.informationComplementaire,
                INFORMATIONCOMPLEMENTAIRE_ADMIN_QUEUE
              );
            if (doc.evenement.length)
              publishUpdate(
                "publish_data",
                doc.evenement,
                AGENDAEVENT_ADMIN_QUEUE
              );
            if (doc.catalogue.length)
              publishUpdate(
                "publish_data",
                doc.catalogue,
                CATALOGUE_ADMIN_QUEUE
              );

            if (doc.motDirecteur)
              publishUpdate(
                "publish_data",
                doc.motDirecteur,
                POSTARTICLE_ADMIN_QUEUE
              );
            if (doc.presentation)
              publishUpdate(
                "publish_data",
                doc.presentation,
                POSTARTICLE_ADMIN_QUEUE
              );
            if (doc.notreHistoire)
              publishUpdate(
                "publish_data",
                doc.notreHistoire,
                POSTARTICLE_ADMIN_QUEUE
              );
            if (doc.notreDevise)
              publishUpdate(
                "publish_data",
                doc.notreDevise,
                POSTARTICLE_ADMIN_QUEUE
              );
            if (doc.notrePositionnement)
              publishUpdate(
                "publish_data",
                doc.notrePositionnement,
                POSTARTICLE_ADMIN_QUEUE
              );
            //#endregion new publish bloc
          }
          return;
        case "postUpdateMany":
          console.log("-------- 2");
          await PublishMessage(ACTEURSPRO_CLIENT_QUEUE, {
            operation: "REMOVE_ITEMS",
            data: { condition: doc },
          });
          removeFiles(files);

          return;

        case "publishData":
          console.log("-------- 3");

          return;

        case "translate":
          console.log("-------- 4");

          return;
      }
    }
  } catch (error) {
    console.error("acteursPro communicateWithClient error==>", error);
  }
}

// add other hooks here
const acteursPro = mongoose.model("acteursPro", acteursProSchema);
module.exports = acteursPro;
const RelationInterActeur = require("../models/relationInterActeur.model");
const MyEservice = require("../models/myEservice.model");

const {
  PublishData: PublishRelationInterActeur,
} = require("./repositories/relationInterActeur.repositorie");
const {
  PublishData: PublishMyEservice,
} = require("./repositories/myEservice.repositorie");

/*






































































*/

const { PublishMessage } = require("../helpers/communications");
const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  getDiffArray,
  copyFiles,
  removeFiles,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  COORDONNEEGEO_ADMIN_RPC,
  DISTINCTION_ADMIN_RPC,
  ORGANIGRAMMESTRUCTURE_ADMIN_RPC,
  CONTENUMMEDIA_ADMIN_RPC,
  HISTOIRE_ADMIN_RPC,
  SOCIALMEDIA_ADMIN_RPC,
  OFFREPROMOTIONNELLE_ADMIN_RPC,
  STATISTIQUESDIRECTES_ADMIN_RPC,
  PARRAINEPAR_ADMIN_RPC,
  ACTIONNAIRE_ADMIN_RPC,
  CONSEILADMINISTRATION_ADMIN_RPC,
  RENCONTRE_ADMIN_RPC,
  INSTANCECONTRAT_ADMIN_RPC,
  REPRESENTATIONMARQUEGROUPEENTREPRISE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  NOTIFICATION_ADMIN_RPC,
  INSTANCECARACTERISTIQUE_ADMIN_RPC,
  ENREGISTREMENTLEGAL_ADMIN_RPC,
  ACTIONSOCIALSOLIDAIRE_ADMIN_RPC,
  TEMOIGNAGE_ADMIN_RPC,
  REFERENCESPROFESSIONNELLE_ADMIN_RPC,
  INFORMATIONCOMPLEMENTAIRE_ADMIN_RPC,
  COORDONNEEGEO_ADMIN_QUEUE,
  DISTINCTION_ADMIN_QUEUE,
  ORGANIGRAMMESTRUCTURE_ADMIN_QUEUE,
  CONTENUMMEDIA_ADMIN_QUEUE,
  HISTOIRE_ADMIN_QUEUE,
  SOCIALMEDIA_ADMIN_QUEUE,
  OFFREPROMOTIONNELLE_ADMIN_QUEUE,
  STATISTIQUESDIRECTES_ADMIN_QUEUE,
  PARRAINEPAR_ADMIN_QUEUE,
  ACTIONNAIRE_ADMIN_QUEUE,
  CONSEILADMINISTRATION_ADMIN_QUEUE,
  RENCONTRE_ADMIN_QUEUE,
  INSTANCECONTRAT_ADMIN_QUEUE,
  REPRESENTATIONMARQUEGROUPEENTREPRISE_ADMIN_QUEUE,
  OBJETASSOCIEE_ADMIN_QUEUE,
  NOTIFICATION_ADMIN_QUEUE,
  INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
  IDENTITESADMINISTRATIVES_ADMIN_QUEUE,
  ACTIONSOCIALSOLIDAIRE_ADMIN_QUEUE,
  TEMOIGNAGE_ADMIN_QUEUE,
  REFERENCESPROFESSIONNELLE_ADMIN_QUEUE,
  INFORMATIONCOMPLEMENTAIRE_ADMIN_QUEUE,
  ACTEURSECOSYSTEME_ADMIN_QUEUE,
  ORGANISATIONCONCERNEE_ADMIN_QUEUE,
  ACTEURSPRO_CLIENT_QUEUE,
  ORGANIGRAMMEPERSONNEL_ADMIN_QUEUE,
  ORGANIGRAMMEPERSONNEL_ADMIN_RPC,
  EXPRESSION_ADMIN_RPC,
  ACTEURSECOSYSTEME_ACTEURECOSYSTEME_ADMIN_QUEUE,
  HORAIRE_ADMIN_RPC,
  PROTAGONISTE_ADMIN_RPC,
  AGENDAEVENT_ADMIN_RPC,
  CATALOGUE_ADMIN_RPC,
  PRODUITSERVICE_ADMIN_RPC,
  ENREGISTREMENTLEGAL_ADMIN_QUEUE,
  HORAIRE_ADMIN_QUEUE,
  AGENDAEVENT_ADMIN_QUEUE,
  FAQ_ADMIN_RPC,
  FAQ_ADMIN_QUEUE,
  CATALOGUE_ADMIN_QUEUE,
  PROTAGONISTE_ADMIN_QUEUE,
  POSTARTICLE_ADMIN_RPC,
  POSTARTICLE_ADMIN_QUEUE,
  PARUDANSLAPRESSE_ADMIN_RPC,
  CONTACTEZNOUS_ADMIN_RPC,
  DOCUMENTREFERENCE_ADMIN_RPC,
  RUBRIQUE_ADMIN_RPC,
  RECLAMATION_ADMIN_RPC,
} = require("../config");
