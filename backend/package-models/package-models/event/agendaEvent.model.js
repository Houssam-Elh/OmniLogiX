const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let agendaEventSchema = new Schema(
  {
    etatEvent: {
      type: String,
      required: true,
      enum: ["code_318", "code_319", "code_224"],
    },
    etatObjet: { type: String, default: "code-1" },
    referenceEvent: { type: String, required: true, unique: true },
    categorieEvent: { type: Schema.Types.Mixed, required: true },
    presentielEnligne: {
      type: String,
      required: true,
      enum: ["code_280", "code_281", "code_8505"],
    },
    translations: {
      type: [
        {
          language: { type: String },
          designation: { type: String, required: true },
          slogan: { type: String },
          description: { type: String },
        },
      ],
    },
    images: { type: [String] },
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },
    multiSessions: { type: Boolean },
    multiSites: { type: Boolean },
    accessibilite: {
      type: String,
      required: true,
      enum: [
        "code_8493", //"event public"
        "code_8496", //"accés libre (gratuite)"
        "code_8498", //"event privé (payant)"
        "code_8499", //"event privé (sur invitation)"
        "code_8501", //"privée (payant ou sur invitation)"
        "code_8502", //"certains programmes sont payants"
      ],
    },
    avecDistributionRecompensesPrix: { type: Boolean },
    reservationObligatoire: { type: Boolean },
    relationInterEventParent: {
      type: Schema.Types.ObjectId,
      ref: "relationInterEvent",
    },
    relationInterEventAssocie: [
      { type: Schema.Types.ObjectId, ref: "relationInterEvent" },
    ],
    programmeEvent: [{ type: Schema.Types.ObjectId, ref: "programmeEvent" }],
    instanceElementAssocie: [
      { type: Schema.Types.ObjectId, ref: "instanceElementAssocie" },
    ],
    probleme: [{ type: Schema.Types.ObjectId }],
    reservation: [{ type: Schema.Types.ObjectId }],
    faq: [{ type: Schema.Types.ObjectId }],
    produitServices: [{ type: Schema.Types.ObjectId }],
    indicationTarifaire: [{ type: Schema.Types.ObjectId }],
    protagonistePotentiel: [{ type: Schema.Types.ObjectId }],
    recompence: [{ type: Schema.Types.ObjectId }],
    rapportBilan: [{ type: Schema.Types.ObjectId }],
    echangeCommunication: [{ type: Schema.Types.ObjectId }],
    instructions: [{ type: Schema.Types.ObjectId }],
    etatDeObjet: [{ type: Schema.Types.ObjectId }],
    statistiquesDirectes: [{ type: Schema.Types.ObjectId }],
    conditions: [{ type: Schema.Types.ObjectId }],
    instanceCarateristique: [{ type: Schema.Types.ObjectId }],
    lieuConcerne: [{ type: Schema.Types.ObjectId }],
    modeleReservation: [{ type: Schema.Types.ObjectId }],
    referenceDocumentsAppuisPreuve: [{ type: Schema.Types.ObjectId }],
    platform: {
      type: [
        {
          nomPlatform: { type: Schema.Types.Mixed, required: true },
          lienAcces: { type: String },
          lienTelegarchementPlatform: { type: String },
          dateOuverture: { type: Date, required: true },
          dateCloture: { type: Date, required: true },
        },
      ],
    },
    nbrPersonnesAssi: { type: Number },
    nbrPersonnesNonAssi: { type: Number },
    acteurs: {
      type: [
        {
          typeObjetConcerne: String,
          refObjetConcerne: Schema.Types.ObjectId,
        },
      ],
    },
    eventAvecVentProduiService: { type: Boolean },
    eventAvecProduitServiceIncludDansLaReservation: { type: Boolean },

    produitsEvent: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

agendaEventSchema.pre("aggregate", function (next) {
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
agendaEventSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      { path: "categorieEvent", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "relationInterEventAssocie",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "programmeEvent", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "instanceElementAssocie",
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
/*new*/ /*new20*/ async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["categorieEvent"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                LIEUCONCERNE_ADMIN_RPC,
                ["lieuConcerne"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-horaire -zones -objetsConcernes" } }
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["categorieEvent"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                PROBLEMEPERTINENCE_ADMIN_RPC,
                ["probleme"],
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
                INSTANCERESERVATION_ADMIN_RPC,
                ["reservation"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-classeReservarion -instanceAssurance -commande -instancePaiement -documentAssociee -objetAssocie -documentDemande -taxeAssociee -acteurConcerne -startDirect -relances -coutEngendre -inclusion -analyseSituation -suivi -demarcheAdministrations -actionEntreprendre -instruction -objetConcerneOperation -lieu -instanceProduitServiceConcerne -echangeCommunication",
                  },
                }
              ),
              sendRPCRequest(doc, FAQ_ADMIN_RPC, ["faq"], "VIEW_ITEMS", {
                queryOptions: {
                  select: "-objetsAssocies -etats -objetsConcernes",
                },
              }),
              sendRPCRequest(
                doc,
                INSTANCEPRODUITSERVICE_ADMIN_RPC,
                ["produitServices"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-produitService -instanceAssurance -instanceReservation -instruction -actionEntreprendre -acteurConcerne -lieu -event",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                INDICATIONTARIFAIRE_ADMIN_RPC,
                ["indicationTarifaire"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-regleInclusionExclusion -instanceCritere -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                PROTAGONISTEPOTONTIEL_ADMIN_RPC,
                ["protagonistePotentiel"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-documentsLegals -moment -etats -opportinutes -risques -criteresConditions -echangesCommunications -incidents -elementsBudgets -activites -objetsAssocies -caracteristiques -referentiels -instructions -reglesActivations -echangesEtCommunications -objetsConcernes",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                RECOMPENSE_ADMIN_RPC,
                ["recompence"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-instanceCaracteristique -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                MODELEBILAN_ADMIN_RPC,
                ["rapportBilan"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-statistique -motsCles -organisations -auteurs -individus -objetsAssocies -docsAssocies -analyses -suivis -activites -echanges -devis -commande -partages -telechargements -annotations -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                ECHANGECOMMUNICATION_ADMIN_RPC,
                ["echangeCommunication"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-docAssocie -objetAssocie -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                INSTRUCTION_ADMIN_RPC,
                ["instructions"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-etat -processusProcedure -docReferenceAssocie -objetsConcemes -objetsAssocies -objetsParent",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                ETATOBJET_ADMIN_RPC,
                ["etatDeObjet"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObject" } }
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
                INSTANCECARACTERISTIQUE_ADMIN_RPC,
                ["conditions", "instanceCarateristique"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                LIEUCONCERNE_ADMIN_RPC,
                ["lieuConcerne"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-horaire -zones -objetsConcernes" } }
              ),
              sendRPCRequest(
                doc,
                RESERVATION_ADMIN_RPC,
                ["modeleReservation"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-instancesContrat -objetsConcernes",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                DOCUMENTREFERENCE_ADMIN_RPC,
                ["referenceDocumentsAppuisPreuve"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-statistiquesDirectes -contenuMMedia -etats -objetsConcernes -objetsAssocies -moments",
                  },
                }
              ),

              sendRPCRequest(
                doc,
                PRODUITSERVICE_ADMIN_RPC,
                ["produitsEvent"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-fournisseurAssocie -madeInProduit -paysTVADefaut -marqueAssocie -distanction -socialMediaAssocie -garantieAssurance -etatObjetAssocie -contenueMediaAssocie -instanceOffre -indicationFraisAddi -indicationStock -parametreExped -statistiqueDirectAssocie -analyseAssocie -objetAssocie -instanceActeurAssocie -instanceSegment -criseRisqueAssocie",
                  },
                }
              ),
            ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["categorieEvent"])
              d["categorieEvent"] =
                result[0].find(
                  (item) =>
                    item._id == (d["categorieEvent"]._id || d["categorieEvent"])
                ) || d["categorieEvent"];

            // if (d["lieuConcerne"])
            //   d["lieuConcerne"] =
            //     result[1].find(
            //       (item) =>
            //         item._id == (d["lieuConcerne"]._id || d["lieuConcerne"])
            //     ) || d["lieuConcerne"];

            if (d["lieuConcerne"] && d["lieuConcerne"].length)
              d["lieuConcerne"] = d["lieuConcerne"].map(
                (d) =>
                  (d = result[1].find((item) => item._id == (d._id || d)) || d)
              );
          });
        } else {
          if (doc["categorieEvent"])
            doc["categorieEvent"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["categorieEvent"]._id || doc["categorieEvent"])
              ) || doc["categorieEvent"];
          if (doc["probleme"] && doc["probleme"].length)
            doc["probleme"] = doc["probleme"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["reservation"] && doc["reservation"].length)
            doc["reservation"] = doc["reservation"].map(
              (d) =>
                (d = result[2].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["faq"] && doc["faq"].length)
            doc["faq"] = doc["faq"].map(
              (d) =>
                (d = result[3].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["produitServices"] && doc["produitServices"].length)
            doc["produitServices"] = doc["produitServices"].map(
              (d) =>
                (d = result[4].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["indicationTarifaire"] && doc["indicationTarifaire"].length)
            doc["indicationTarifaire"] = doc["indicationTarifaire"].map(
              (d) =>
                (d = result[5].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["protagonistePotentiel"] &&
            doc["protagonistePotentiel"].length
          )
            doc["protagonistePotentiel"] = doc["protagonistePotentiel"].map(
              (d) =>
                (d = result[6].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["recompence"] && doc["recompence"].length)
            doc["recompence"] = doc["recompence"].map(
              (d) =>
                (d = result[7].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["rapportBilan"] && doc["rapportBilan"].length)
            doc["rapportBilan"] = doc["rapportBilan"].map(
              (d) =>
                (d = result[8].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["echangeCommunication"] && doc["echangeCommunication"].length)
            doc["echangeCommunication"] = doc["echangeCommunication"].map(
              (d) =>
                (d = result[9].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["instructions"] && doc["instructions"].length)
            doc["instructions"] = doc["instructions"].map(
              (d) =>
                (d = result[10].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["etatDeObjet"] && doc["etatDeObjet"].length)
            doc["etatDeObjet"] = doc["etatDeObjet"].map(
              (d) =>
                (d = result[11].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["statistiquesDirectes"] && doc["statistiquesDirectes"].length)
            doc["statistiquesDirectes"] = doc["statistiquesDirectes"].map(
              (d) =>
                (d = result[12].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["conditions"] && doc["conditions"].length)
            doc["conditions"] = doc["conditions"].map(
              (d) =>
                (d = result[13].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["instanceCarateristique"] &&
            doc["instanceCarateristique"].length
          )
            doc["instanceCarateristique"] = doc["instanceCarateristique"].map(
              (d) =>
                (d = result[13].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["lieuConcerne"] && doc["lieuConcerne"].length)
            doc["lieuConcerne"] = doc["lieuConcerne"].map(
              (d) =>
                (d = result[14].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["modeleReservation"] && doc["modeleReservation"].length)
            doc["modeleReservation"] = doc["modeleReservation"].map(
              (d) =>
                (d = result[15].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["referenceDocumentsAppuisPreuve"] &&
            doc["referenceDocumentsAppuisPreuve"].length
          )
            doc["referenceDocumentsAppuisPreuve"] = doc[
              "referenceDocumentsAppuisPreuve"
            ].map(
              (d) =>
                (d = result[16].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["produitsEvent"] && doc["produitsEvent"].length)
            doc["produitsEvent"] = doc["produitsEvent"].map(
              (d) =>
                (d = result[17].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
agendaEventSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

agendaEventSchema.post("save", async function (doc, next) {
  try {
    if (this.relationInterEventParent) {
      await RelationInterEvent.updateOne(
        { _id: this.relationInterEventParent.toString() },
        { $addToSet: { agendaEventAssocie: this._id } }
      );
    }

    if (doc.probleme.length)
      publishUpdate(
        "update_items",
        doc.probleme,
        PROBLEMEPERTINENCE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "AGENDAEVENT_EVENT",
            },
          },
        }
      );
    if (doc.reservation.length)
      publishUpdate(
        "update_items",
        doc.reservation,
        INSTANCERESERVATION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { objetConcerneOperation: doc._id } }
      );
    if (doc.faq.length)
      publishUpdate("update_items", doc.faq, FAQ_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "AGENDAEVENT_EVENT",
          },
        },
      });
    if (doc.lieuConcerne.length)
      publishUpdate(
        "update_items",
        doc.lieuConcerne,
        LIEUCONCERNE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "AGENDAEVENT_EVENT",
            },
          },
        }
      );
    if (doc.produitServices.length)
      publishUpdate(
        "update_items",
        doc.produitServices,
        INSTANCEPRODUITSERVICE_ADMIN_QUEUE,
        { operation: "$set", body: { event: doc._id } }
      );
    if (doc.indicationTarifaire.length)
      publishUpdate(
        "update_items",
        doc.indicationTarifaire,
        INDICATIONTARIFAIRE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "AGENDAEVENT_EVENT",
          },
        }
      );
    if (doc.protagonistePotentiel.length)
      publishUpdate(
        "update_items",
        doc.protagonistePotentiel,
        PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "AGENDAEVENT_EVENT",
            },
          },
        }
      );

    if (doc.produitsEvent.length)
      publishUpdate(
        "update_items",
        doc.produitsEvent,
        PRODUITSERVICE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "AGENDAEVENT_EVENT",
            },
          },
        }
      );

    if (doc.recompence.length)
      publishUpdate("update_items", doc.recompence, RECOMPENSE_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "AGENDAEVENT_EVENT",
        },
      });
    if (doc.rapportBilan.length)
      publishUpdate("update_items", doc.rapportBilan, MODELEBILAN_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "AGENDAEVENT_EVENT",
        },
      });
    if (doc.echangeCommunication.length)
      publishUpdate(
        "update_items",
        doc.echangeCommunication,
        ECHANGECOMMUNICATION_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "AGENDAEVENT_EVENT",
          },
        }
      );
    if (doc.instructions.length)
      publishUpdate("update_items", doc.instructions, INSTRUCTION_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: {
          objetsParent: { refObjet: doc._id, typeObjet: "AGENDAEVENT_EVENT" },
        },
      });
    if (doc.etatDeObjet.length)
      publishUpdate("update_items", doc.etatDeObjet, ETATOBJET_ADMIN_QUEUE, {
        operation: "$set",
        body: { refObject: doc._id, typeObject: "AGENDAEVENT_EVENT" },
      });
    if (doc.statistiquesDirectes.length)
      publishUpdate(
        "update_items",
        doc.statistiquesDirectes,
        STATISTIQUESDIRECTES_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcene: "AGENDAEVENT_EVENT",
          },
        }
      );
    if (doc.conditions.length)
      publishUpdate(
        "update_items",
        doc.conditions,
        INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "AGENDAEVENT_EVENT_CONDITION",
          },
        }
      );
    if (doc.instanceCarateristique.length)
      publishUpdate(
        "update_items",
        doc.instanceCarateristique,
        INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "AGENDAEVENT_EVENT",
          },
        }
      );
    if (doc.acteurs.length) {
      let data = GroupBy(doc.acteurs, "typeObjetConcerne");
      for (let item of Object.keys(data)) {
        if (item) {
          let body;
          let key;
          if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
            key = ACTEURSPRO_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { evenement: doc._id } };
          }
          if (body)
            publishUpdate(
              "update_items",
              data[item].map((i) => i.refObjetConcerne),
              key,
              body
            );
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
agendaEventSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    let relationInterEventParent = GroupBy(doc, "relationInterEventParent");
    for (let item of Object.keys(relationInterEventParent)) {
      if (item)
        await RelationInterEvent.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              agendaEventAssocie: {
                $each: relationInterEventParent[item].map((d) => d._id),
              },
            },
          }
        );
    }
    let lieuConcerne = GroupBy(doc, "lieuConcerne");
    for (let item of Object.keys(lieuConcerne)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(lieuConcerne[item].map((d) => d.lieuConcerne)))],
          LIEUCONCERNE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: lieuConcerne[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "INSTANCEELEMENTASSOCIE_EVENT",
                    })
                ),
              },
            },
          }
        );
    }
    let probleme = GroupBy(doc, "probleme");
    for (let item of Object.keys(probleme)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(probleme[item].map((d) => d.probleme)))],
          PROBLEMEPERTINENCE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: probleme[item].map(
                  (i) =>
                    (i = { refObjet: i._id, typeObjet: "AGENDAEVENT_EVENT" })
                ),
              },
            },
          }
        );
    }
    let reservation = GroupBy(doc, "reservation");
    for (let item of Object.keys(reservation)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(reservation[item].map((d) => d.reservation)))],
          INSTANCERESERVATION_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetConcerneOperation: {
                $each: reservation[item].map((i) => i._id),
              },
            },
          }
        );
    }
    let faq = GroupBy(doc, "faq");
    for (let item of Object.keys(faq)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(faq[item].map((d) => d.faq)))],
          FAQ_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: faq[item].map(
                  (i) =>
                    (i = { refObjet: i._id, typeObjet: "AGENDAEVENT_EVENT" })
                ),
              },
            },
          }
        );
    }
    let protagonistePotentiel = GroupBy(doc, "protagonistePotentiel");
    for (let item of Object.keys(protagonistePotentiel)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                protagonistePotentiel[item].map((d) => d.protagonistePotentiel)
              )
            ),
          ],
          PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: protagonistePotentiel[item].map(
                  (i) =>
                    (i = { refObjet: i._id, typeObjet: "AGENDAEVENT_EVENT" })
                ),
              },
            },
          }
        );
    }
    let produitsEvent = GroupBy(doc, "produitsEvent");
    for (let item of Object.keys(produitsEvent)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(produitsEvent[item].map((d) => d.produitsEvent))
            ),
          ],
          PRODUITSERVICE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: produitsEvent[item].map(
                  (i) =>
                    (i = { refObjet: i._id, typeObjet: "AGENDAEVENT_EVENT" })
                ),
              },
            },
          }
        );
    }

    let instructions = GroupBy(doc, "instructions");
    for (let item of Object.keys(instructions)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(instructions[item].map((d) => d.instructions)))],
          INSTRUCTION_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsParent: {
                $each: instructions[item].map(
                  (i) =>
                    (i = { refObjet: i._id, typeObjet: "AGENDAEVENT_EVENT" })
                ),
              },
            },
          }
        );
    }

    next();
  } catch (error) {
    next(error);
  }
});
let prevState = null;
let itemToCheck = {};

agendaEventSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await agendaEvent.findOne(this.getQuery()).lean();

    if (doc) {
      itemToCheck["probleme"] = doc.probleme;
      itemToCheck["reservation"] = doc.reservation;
      itemToCheck["faq"] = doc.faq;
      itemToCheck["produitServices"] = doc.produitServices;
      itemToCheck["indicationTarifaire"] = doc.indicationTarifaire;
      itemToCheck["protagonistePotentiel"] = doc.protagonistePotentiel;
      itemToCheck["recompence"] = doc.recompence;
      itemToCheck["rapportBilan"] = doc.rapportBilan;
      itemToCheck["echangeCommunication"] = doc.echangeCommunication;
      itemToCheck["instructions"] = doc.instructions;
      itemToCheck["etatDeObjet"] = doc.etatDeObjet;
      itemToCheck["statistiquesDirectes"] = doc.statistiquesDirectes;
      itemToCheck["conditions"] = doc.conditions;
      itemToCheck["instanceCarateristique"] = doc.instanceCarateristique;
      itemToCheck["lieuConcerne"] = doc.lieuConcerne;
      itemToCheck["produitsEvent"] = doc.produitsEvent;

      prevState = doc?.etatEvent;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatEvent
      );
      const relationInterEventParentId =
        this._update?.["$set"]?.relationInterEventParent;
      if (
        doc?.relationInterEventParent != relationInterEventParentId &&
        doc?.relationInterEventParent != undefined
      )
        await RelationInterEvent.updateOne(
          { _id: doc.relationInterEventParent.toString() },
          { $pull: { agendaEventAssocie: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
agendaEventSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["probleme"], newData: doc.probleme },
      PROBLEMEPERTINENCE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "AGENDAEVENT_EVENT",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["lieuConcerne"], newData: doc.lieuConcerne },
      LIEUCONCERNE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "INSTANCEELEMENTASSOCIE_EVENT",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["reservation"], newData: doc.reservation },
      INSTANCERESERVATION_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetConcerneOperation: doc._id },
        bodyPush: { objetConcerneOperation: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["faq"], newData: doc.faq },
      FAQ_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "AGENDAEVENT_EVENT",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["produitServices"], newData: doc.produitServices },
      INSTANCEPRODUITSERVICE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { event: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["indicationTarifaire"],
        newData: doc.indicationTarifaire,
      },
      INDICATIONTARIFAIRE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "AGENDAEVENT_EVENT",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["protagonistePotentiel"],
        newData: doc.protagonistePotentiel,
      },
      PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "AGENDAEVENT_EVENT",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["produitsEvent"],
        newData: doc.produitsEvent,
      },
      PRODUITSERVICE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "AGENDAEVENT_EVENT",
          },
        },
      }
    );

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["recompence"], newData: doc.recompence },
      RECOMPENSE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "AGENDAEVENT_EVENT",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["rapportBilan"], newData: doc.rapportBilan },
      MODELEBILAN_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "AGENDAEVENT_EVENT",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["echangeCommunication"],
        newData: doc.echangeCommunication,
      },
      ECHANGECOMMUNICATION_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "AGENDAEVENT_EVENT",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["instructions"], newData: doc.instructions },
      INSTRUCTION_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsParent: { refObjet: doc._id } },
        bodyPush: {
          objetsParent: { refObjet: doc._id, typeObjet: "AGENDAEVENT_EVENT" },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["etatDeObjet"], newData: doc.etatDeObjet },
      ETATOBJET_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { refObject: doc._id, typeObject: "AGENDAEVENT_EVENT" },
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
          typeObjetConcene: "AGENDAEVENT_EVENT",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["conditions"], newData: doc.conditions },
      INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "AGENDAEVENT_EVENT_CONDITION",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["instanceCarateristique"],
        newData: doc.instanceCarateristique,
      },
      INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "AGENDAEVENT_EVENT",
        },
      }
    );
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.relationInterEventParent)
      await RelationInterEvent.updateOne(
        {
          _id:
            doc.relationInterEventParent?._id?.toString() ||
            doc.relationInterEventParent,
        },
        { $addToSet: { agendaEventAssocie: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
agendaEventSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      if (
        this._update?.["$addToSet"]?.reservation &&
        docs.modifiedCount /*new modifCount*/
      )
        publishUpdate(
          "update_items",
          this._update?.["$addToSet"]?.reservation,
          INSTANCERESERVATION_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetConcerneOperation: { $each: this.getQuery()._id["$in"] },
            },
          }
        );
      if (this._update?.["$addToSet"]?.acteurs && docs.modifiedCount) {
        let body;
        let key;
        if (
          this._update?.[
            "$addToSet"
          ]?.acteurs.typeObjetConcerne.toLowerCase() ==
          "acteurspro_acteurprofessionel"
        ) {
          key = ACTEURSPRO_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",

            body: { evenement: { $each: this.getQuery()?._id?.["$in"] } },
          };
        }
        if (body)
          publishUpdate(
            "update_items",
            this._update?.["$addToSet"].acteurs.refObjetConcerne,
            key,
            body
          );
      }
    } else {
      let doc = await agendaEvent.find(this.getQuery()).lean();
      const promises = [];
      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.lieuConcerne)))],
          LIEUCONCERNE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );

        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.probleme)))],
          PROBLEMEPERTINENCE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.reservation)))],
          INSTANCERESERVATION_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetConcerneOperation: this.getQuery()._id },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.faq)))],
          FAQ_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.produitServices)))],
          INSTANCEPRODUITSERVICE_ADMIN_QUEUE,
          { operation: "$set", body: { event: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.indicationTarifaire)))],
          INDICATIONTARIFAIRE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.protagonistePotentiel)))],
          PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );

        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.produitsEvent)))],
          PRODUITSERVICE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );

        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.recompence)))],
          RECOMPENSE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.rapportBilan)))],
          MODELEBILAN_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.echangeCommunication)))],
          ECHANGECOMMUNICATION_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.instructions)))],
          INSTRUCTION_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsParent: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.etatDeObjet)))],
          ETATOBJET_ADMIN_QUEUE,
          { operation: "$set", body: { etatObjet: "code-2" } }
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
          [...new Set(flatDeep(doc.map((d) => d.conditions)))],
          INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.instanceCarateristique)))],
          INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );

        let files = [];

        doc.map((d) => {
          if (d.images.length) files.push(...d.images);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let instanceElementAssocie = [];
        let programmeEvent = [];
        let relationInterEventAssocie = [];
        doc.map((d) => {
          instanceElementAssocie.push(
            ...d.instanceElementAssocie.map((v) => v._id || v)
          );
          programmeEvent.push(...d.programmeEvent.map((v) => v._id || v));
          relationInterEventAssocie.push(
            ...d.relationInterEventAssocie.map((v) => v._id || v)
          );
        });
        if (instanceElementAssocie.length) {
          promises.push(
            InstanceElementAssocie.updateMany(
              { _id: { $in: instanceElementAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (programmeEvent.length) {
          promises.push(
            ProgrammeEvent.updateMany(
              { _id: { $in: programmeEvent } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (relationInterEventAssocie.length) {
          promises.push(
            RelationInterEvent.updateMany(
              { _id: { $in: relationInterEventAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        let typeObjet = /*updateGroupByupdateMany with dot*/ GroupBy(
          doc,
          "acteurs.typeObjetConcerne"
        );
        for (let item of Object.keys(typeObjet)) {
          if (item) {
            let references = GroupBy(typeObjet[item], "refObjetConcerne");
            for (let itemRef of Object.keys(references)) {
              if (itemRef) {
                let body;
                let key;
                if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
                  key = ACTEURSPRO_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      evenement: {
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
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let instanceElementAssocie = [];
        let programmeEvent = [];
        let relationInterEventAssocie = [];

        doc.map((d) => {
          instanceElementAssocie.push(
            ...d.instanceElementAssocie.map((v) => v._id || v)
          );
          programmeEvent.push(...d.programmeEvent.map((v) => v._id || v));
          relationInterEventAssocie.push(
            ...d.relationInterEventAssocie.map((v) => v._id || v)
          );
        });
        if (instanceElementAssocie.length) {
          promises.push(
            InstanceElementAssocie.updateMany(
              { _id: { $in: instanceElementAssocie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (programmeEvent.length) {
          promises.push(
            ProgrammeEvent.updateMany(
              { _id: { $in: programmeEvent } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (relationInterEventAssocie.length) {
          promises.push(
            RelationInterEvent.updateMany(
              { _id: { $in: relationInterEventAssocie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
      }
      if (this._update?.["$pull"]) {
        if (
          this._update?.["$pull"].lieuConcerne &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].lieuConcerne,
            LIEUCONCERNE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"].referenceDocumentsAppuisPreuve &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].referenceDocumentsAppuisPreuve,
            DOCUMENTREFERENCE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
      }
      if (this._update?.["$pull"]) {
        if (
          this._update?.["$pull"].probleme &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].probleme,
            PROBLEMEPERTINENCE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"].reservation &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].reservation,
            INSTANCERESERVATION_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetConcerneOperation: this.getQuery()._id },
            }
          );
        if (
          this._update?.["$pull"].faq &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].faq,
            FAQ_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"].protagonistePotentiel &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].protagonistePotentiel,
            PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );

        if (
          this._update?.["$pull"].protagonistePotentiel &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].produitsEvent,
            PRODUITSERVICE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );

        if (
          this._update?.["$pull"].instructions &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].instructions,
            INSTRUCTION_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsParent: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"].acteurs &&
          this._update?.["$pull"].acteurs.typeObjetConcerne
        ) {
          let body;
          let key;
          switch (
            this._update?.["$pull"].acteurs.typeObjetConcerne.toLowerCase()
          ) {
            case "acteurspro_acteurprofessionel":
              key = ACTEURSPRO_CLIENT_QUEUE;
              body = {
                evenement: this.getQuery()._id,
              };
              break;
          }

          if (body)
            publishUpdate(
              "update_items",
              this._update?.["$pull"].acteurs.refObjetConcerne,
              key,
              {
                operation: "$pull",
                body,
              }
            );
        }
      }
      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
agendaEventSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await agendaEvent.find(this.getQuery()).lean();
    const promises = [];
    let instanceElementAssocie = [];
    let programmeEvent = [];
    let relationInterEventAssocie = [];
    doc.map((d) => {
      instanceElementAssocie.push(
        ...d.instanceElementAssocie.map((v) => v._id || v)
      );
      programmeEvent.push(...d.programmeEvent.map((v) => v._id || v));
      relationInterEventAssocie.push(
        ...d.relationInterEventAssocie.map((v) => v._id || v)
      );
    });
    if (instanceElementAssocie.length) {
      promises.push(
        InstanceElementAssocie.deleteMany({
          _id: { $in: instanceElementAssocie },
        }).exec()
      );
    }
    if (programmeEvent.length) {
      promises.push(
        ProgrammeEvent.deleteMany({ _id: { $in: programmeEvent } }).exec()
      );
    }
    if (relationInterEventAssocie.length) {
      promises.push(
        RelationInterEvent.deleteMany({
          _id: { $in: relationInterEventAssocie },
        }).exec()
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
    if (methode == "postUpdateMany" || doc?.etatEvent) {
      switch (methode) {
        case "preFindOneAndUpdate":
          if (
            targetState &&
            targetState != "code_224" &&
            prevState == "code_224"
          ) {
            await PublishMessage(AGENDAEVENT_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            // doc.map((d)=>{
            if (doc.images.length) files.push(...doc.images);
            //})

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (prevState == doc.etatEvent && doc.etatEvent == "code_224") {
            await PublishMessage(AGENDAEVENT_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatEvent == "code_224") {
            await PublishMessage(AGENDAEVENT_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc.etatEvent == "code_224") {
            let files = [];
            //doc.map((d)=>{
            if (doc.images.length) files.push(...doc.images);
            //})
            copyFiles(files);
            if (doc?.instanceElementAssocie?.length) {
              PublishInstanceElementAssocie(doc.instanceElementAssocie);
            }
            if (doc?.programmeEvent?.length) {
              PublishProgrammeEvent(doc.programmeEvent);
            }
            if (doc?.relationInterEventAssocie?.length) {
              PublishRelationInterEvent(doc.relationInterEventAssocie);
            }
            if (doc.lieuConcerne.length)
              publishUpdate(
                "publish_data",
                doc.lieuConcerne,
                LIEUCONCERNE_ADMIN_QUEUE
              );
            if (doc.probleme.length)
              publishUpdate(
                "publish_data",
                doc.probleme,
                PROBLEMEPERTINENCE_ADMIN_QUEUE
              );
            if (doc.reservation.length)
              publishUpdate(
                "publish_data",
                doc.reservation,
                INSTANCERESERVATION_ADMIN_QUEUE
              );
            if (doc.faq.length)
              publishUpdate("publish_data", doc.faq, FAQ_ADMIN_QUEUE);
            if (doc.produitServices.length)
              publishUpdate(
                "publish_data",
                doc.produitServices,
                INSTANCEPRODUITSERVICE_ADMIN_QUEUE
              );
            if (doc.indicationTarifaire.length)
              publishUpdate(
                "publish_data",
                doc.indicationTarifaire,
                INDICATIONTARIFAIRE_ADMIN_QUEUE
              );
            if (doc.protagonistePotentiel.length)
              publishUpdate(
                "publish_data",
                doc.protagonistePotentiel,
                PROTAGONISTEPOTONTIEL_ADMIN_QUEUE
              );

            if (doc.produitsEvent.length)
              publishUpdate(
                "publish_data",
                doc.produitsEvent,
                PRODUITSERVICE_ADMIN_QUEUE
              );

            if (doc.recompence.length)
              publishUpdate(
                "publish_data",
                doc.recompence,
                RECOMPENSE_ADMIN_QUEUE
              );
            if (doc.rapportBilan.length)
              publishUpdate(
                "publish_data",
                doc.rapportBilan,
                MODELEBILAN_ADMIN_QUEUE
              );
            if (doc.echangeCommunication.length)
              publishUpdate(
                "publish_data",
                doc.echangeCommunication,
                ECHANGECOMMUNICATION_ADMIN_QUEUE
              );
            if (doc.instructions.length)
              publishUpdate(
                "publish_data",
                doc.instructions,
                INSTRUCTION_ADMIN_QUEUE
              );
            if (doc.etatDeObjet.length)
              publishUpdate(
                "publish_data",
                doc.etatDeObjet,
                ETATOBJET_ADMIN_QUEUE
              );
            if (doc.statistiquesDirectes.length)
              publishUpdate(
                "publish_data",
                doc.statistiquesDirectes,
                STATISTIQUESDIRECTES_ADMIN_QUEUE
              );
            if (doc.conditions.length)
              publishUpdate(
                "publish_data",
                doc.conditions,
                INSTANCECARACTERISTIQUE_ADMIN_QUEUE
              );
            if (doc.instanceCarateristique.length)
              publishUpdate(
                "publish_data",
                doc.instanceCarateristique,
                INSTANCECARACTERISTIQUE_ADMIN_QUEUE
              );
            if (doc.referenceDocumentsAppuisPreuve?.length) {
              publishUpdate(
                "publish_data",
                doc.referenceDocumentsAppuisPreuve,
                DOCUMENTREFERENCE_ADMIN_QUEUE
              );

              if (doc.modeleReservation?.length) {
                publishUpdate(
                  "publish_data",
                  doc.modeleReservation,
                  RESERVATION_ADMIN_QUEUE
                );
              }
            }
          }
          return;
        case "postUpdateMany":
          await PublishMessage(AGENDAEVENT_CLIENT_QUEUE, {
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
    console.error("agendaEvent communicateWithClient error==>", error);
  }
}
//add other hooks here
const agendaEvent = mongoose.model("agendaEvent", agendaEventSchema);
module.exports = agendaEvent;
const InstanceElementAssocie = require("../models/instanceElementAssocie.model");
const ProgrammeEvent = require("../models/programmeEvent.model");
const RelationInterEvent = require("../models/relationInterEvent.model");

const {
  PublishData: PublishInstanceElementAssocie,
} = require("./repositories/instanceElementAssocie.repositorie");
const {
  PublishData: PublishProgrammeEvent,
} = require("./repositories/programmeEvent.repositorie");
const {
  PublishData: PublishRelationInterEvent,
} = require("./repositories/relationInterEvent.repositorie");

const { PublishMessage } = require("../helpers/communications");

const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  copyFiles,
  removeFiles,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  PROBLEMEPERTINENCE_ADMIN_RPC,
  INSTANCERESERVATION_ADMIN_RPC,
  FAQ_ADMIN_RPC,
  INSTANCEPRODUITSERVICE_ADMIN_RPC,
  INDICATIONTARIFAIRE_ADMIN_RPC,
  PROTAGONISTEPOTONTIEL_ADMIN_RPC,
  RECOMPENSE_ADMIN_RPC,
  MODELEBILAN_ADMIN_RPC,
  ECHANGECOMMUNICATION_ADMIN_RPC,
  INSTRUCTION_ADMIN_RPC,
  ETATOBJET_ADMIN_RPC,
  STATISTIQUESDIRECTES_ADMIN_RPC,
  INSTANCECARACTERISTIQUE_ADMIN_RPC,
  PROBLEMEPERTINENCE_ADMIN_QUEUE,
  INSTANCERESERVATION_ADMIN_QUEUE,
  FAQ_ADMIN_QUEUE,
  INSTANCEPRODUITSERVICE_ADMIN_QUEUE,
  INDICATIONTARIFAIRE_ADMIN_QUEUE,
  PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
  RECOMPENSE_ADMIN_QUEUE,
  MODELEBILAN_ADMIN_QUEUE,
  ECHANGECOMMUNICATION_ADMIN_QUEUE,
  INSTRUCTION_ADMIN_QUEUE,
  ETATOBJET_ADMIN_QUEUE,
  STATISTIQUESDIRECTES_ADMIN_QUEUE,
  INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
  ACTEURSPRO_ADMIN_QUEUE,
  AGENDAEVENT_CLIENT_QUEUE,
  LIEUCONCERNE_ADMIN_QUEUE,
  RESERVATION_ADMIN_RPC,
  COORDONNEEGEO_ADMIN_RPC,
  DOCUMENTREFERENCE_ADMIN_RPC,
  DOCUMENTREFERENCE_ADMIN_QUEUE,
  LIEUCONCERNE_ADMIN_RPC,
  RESERVATION_ADMIN_QUEUE,
  PRODUITSERVICE_ADMIN_QUEUE,
  PRODUITSERVICE_ADMIN_RPC,
} = require("../config");
// const { boolean } = require("joi");
