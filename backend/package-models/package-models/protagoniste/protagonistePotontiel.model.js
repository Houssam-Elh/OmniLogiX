const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let protagonistePotontielSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    refProtagoniste: { type: String, required: true, unique: true },
    classe: { type: String, required: true },
    taxoProtagoniste: { type: Schema.Types.Mixed, required: false },
    translations: {
      type: [
        {
          language: { type: String },
          label: { type: String, required: false },
          description: { type: String, required: false },
        },
      ],
    },
    ordreAffichage: { type: Number },
    protagonsiteIntiateurFondateur: {
      type: String,
      required: false,
      default:'code_5509',
      enum: ["code_5509", "code_5510", null],
    },
    dateEnregistrement: { type: Date, required: true },
    etatProtagoniste: {
      type: String,
      required: true,
      enum: ["code_541", "code_223", "code_4316", "code_226", "code_3417"],
    },
    participation: [
      { type: Schema.Types.ObjectId, ref: "participationProtagoniste" },
    ],
    origineParticipation: {
      type: Schema.Types.ObjectId,
      ref: "participationProtagoniste",
    },
    documentsLegals: [{ type: Schema.Types.ObjectId }],
    personneConcernee: {
      type: Schema.Types.ObjectId,
      ref: "personneConcernee",
    },
    relationInterneProtagoniste: [
      { type: Schema.Types.ObjectId, ref: "relationInterProtagoniste" },
    ],
    organisationConcernee: {
      type: Schema.Types.ObjectId,
      ref: "organisationConcernee",
    },
    autorisationAffichage: {
      type: Schema.Types.ObjectId,
      ref: "autorisationAffichage",
    },
    roleEtMission: [{ type: Schema.Types.ObjectId, ref: "roleMission" }],
    moment: [{ type: Schema.Types.ObjectId }],
    etats: [{ type: Schema.Types.ObjectId }],
    opportinutes: [{ type: Schema.Types.ObjectId }],
    risques: [{ type: Schema.Types.ObjectId }],
    criteresConditions: [{ type: Schema.Types.ObjectId }],
    echangesCommunications: [{ type: Schema.Types.ObjectId }],
    incidents: [{ type: Schema.Types.ObjectId }],
    elementsBudgets: [{ type: Schema.Types.ObjectId }],
    activites: [{ type: Schema.Types.ObjectId }],
    objetsAssocies: [{ type: Schema.Types.ObjectId }],
    caracteristiques: [{ type: Schema.Types.ObjectId }],
    referentiels: [{ type: Schema.Types.ObjectId }],
    instructions: [{ type: Schema.Types.ObjectId }],
    reglesActivations: [{ type: Schema.Types.ObjectId }],
    produitService: [{ type: Schema.Types.ObjectId }],
    coordonneesLieu: [{ type: Schema.Types.ObjectId }],
    instancesOffres: [{ type: Schema.Types.ObjectId }],

    typePersonne: {
      type: String,
      required: true,
      enum: ["code_338", "code_339"],
    },

    //#region new attribut declaration
    objetsConcernes: {
      type: [
        {
          refObjet: { type: Schema.Types.ObjectId },
          typeObjet: { type: String },
        },
      ],
    },
    echangesEtCommunications: [{ type: Schema.Types.ObjectId }],
    acteurConcerne: { type: Schema.Types.ObjectId },
    //#endregion

    modeLivraison: { type: String },
    livreurs: [{ type: Schema.Types.ObjectId }],
    categorieProduitsLivraison: [{ type: Schema.Types.ObjectId }],
    produitsLivraison: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

protagonistePotontielSchema.pre("aggregate", async function (next) {
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
protagonistePotontielSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      { path: "participation", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "personneConcernee",
        match: { etatObjet: "code-1" },
        populate: [],
        // select: '-coordonneesLieu'
      },
      {
        path: "relationInterneProtagoniste",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "organisationConcernee",
        match: { etatObjet: "code-1" },
        populate: [],
        // select: '-coordonneesLieu'
      },
      {
        path: "autorisationAffichage",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "roleEtMission", match: { etatObjet: "code-1" }, populate: [] },
    ]);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
//refactor bloc for distantRequest
/*new*/ //refactor bloc for distantRequest
/*new20*/ //refactor bloc for distantRequest
async function distantRequest(doc) {
  try {
    if (doc) {
      let classeCondition = [];
      if (doc instanceof Array) {
        doc.map((d) => classeCondition.push(d.classe));
        classeCondition = {
          code: {
            $in: [...new Set([...classeCondition].filter((item) => item))],
          },
        };
      } else {
        classeCondition = { code: doc.classe };
      }

      await Promise.all(
        doc instanceof Array
          ? [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["taxoProtagoniste"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-children" } }
              ),
              sendRPCRequest(
                classeCondition,
                DOMAIN_ADMIN_RPC,
                [],
                "VIEW_BY_CONDITION",
                { queryOptions: { select: "-children -taxonomies" } }
              ),
              sendRPCRequest(
                doc,
                INSTANCECOORDONNEEGEO_ADMIN_RPC,
                ["coordonneesLieu"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-horaire -zones -objetsConcernes" } }
              ),
              sendRPCRequest(
                doc,
                INSTANCEOFFRE_ADMIN_RPC,
                ["instancesOffres"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-monnaie" } }
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["taxoProtagoniste", "categorieProduitsLivraison"],
                "VIEW_ITEMS",
                {}
              ),
              // sendRPCRequest(
              //   doc,
              //   PROTAGONISTEACTION_ADMIN_RPC,
              //   ["objetsConcernes.refObjet"],
              //   "VIEW_ITEMS",
              //   {
              //     queryOptions: {
              //       select:
              //         "-referenceEtDocumentDappuisEtPreuve -demandeArretPublication -etatsObjets -referenceProtagoniste",
              //     },
              //   }
              // ),
              sendRPCRequest(
                doc,
                INSTANCEDOCUMENT_ADMIN_RPC,
                ["documentsLegals"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-document -protagonistes -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                MOMENTDUPROJET_ADMIN_RPC,
                ["moment"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                ETATOBJET_ADMIN_RPC,
                ["etats"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObject" } }
              ),
              sendRPCRequest(
                doc,
                PROBLEMEPERTINENCE_ADMIN_RPC,
                ["opportinutes", "risques", "incidents"],
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
                INSTANCECARACTERISTIQUE_ADMIN_RPC,
                ["criteresConditions", "caracteristiques"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                ECHANGECOMMUNICATION_ADMIN_RPC,
                ["echangesCommunications", "echangesEtCommunications"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-docAssocie -objetAssocie -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                BUDGET_ADMIN_RPC,
                ["elementsBudgets"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-refPeriodeProvisionnellesOuReelles -refMomentduProjet -refOperationFinanciere -refTaxeAssociee -refTraceOperations -refdocumentAssocies -objetAssocie -etat -instruction -suivi -pilotage -ptotagoniste -risqueEtOpportunite -condition -regle -action",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                ACTIVITE_ADMIN_RPC,
                ["activites"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-lieuxConcernes -moments -datesPeriodesPrevisionnelle -problemesPertinances -besoinsSpecifiques -objetsConcernes -objetsAssocies -pilotagesEtSuivi -indicateursSuivsRealisations -protagonistes -instructions -echangesCommunications -etats -rapportsBilans -creteresConditions -reglesSpecifiques -instancesReferentiels -operationsFinancieres -elementsBudget -action -pbs -besoin",
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
                REFERENTIELMODELEINSTANCEREFERENTIEL_ADMIN_RPC,
                ["referentiels"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-etatDeObjet -objetsAssocies -objetsConcernes -docsReferencesAssocies -secteursActivites -projet",
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
                REGLEVERSIONCLASSIQUE_ADMIN_RPC,
                ["reglesActivations"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-criteresConditions -objetAssocie -objetsConcernes -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                PRODUITSETVICE_ADMIN_RPC,
                ["produitService"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select: "-fournisseurAssocie",
                  },
                }
              ),
              sendRPCRequest(
                classeCondition,
                DOMAIN_ADMIN_RPC,
                [],
                "VIEW_BY_CONDITION",
                { queryOptions: { select: "-children -taxonomies" } }
              ),

              sendRPCRequest(
                doc,
                INSTANCECOORDONNEEGEO_ADMIN_RPC,
                ["coordonneesLieu"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-horaire -zones -objetsConcernes" } }
              ),

              sendRPCRequest(
                doc,
                INSTANCEOFFRE_ADMIN_RPC,
                ["instancesOffres"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-monnaie" } }
              ),

              sendRPCRequest(
                doc,
                PRODUITSETVICE_ADMIN_RPC,
                ["produitsLivraison"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "translations unityProduit monnaie imageProduit tarifUHTPardefaut -produitAssocie -caracteristiqueAssocie -grilleAssocie -tarifIndicqtif -tarifSaisonnierAssocie -tarifVariable -codageProduitAssocie -typeRelation",
                  },
                }
              ),

              sendRPCRequest(
                doc,
                LIVREUR_ADMIN_RPC,
                ["livreurs"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-lieuExpedition -objetsAssocies -chauffeurs -livraisons -instanceZone -tarifLivraison",
                  },
                }
              ),
            ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["taxoProtagoniste"])
              d["taxoProtagoniste"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["taxoProtagoniste"]._id || d["taxoProtagoniste"])
                ) || d["taxoProtagoniste"];

            if (d["classe"])
              d["classe"] =
                result[1].find((item) => item.code == d["classe"]) ||
                d["classe"];

            if (d["coordonneesLieu"] && d["coordonneesLieu"].length)
              d["coordonneesLieu"] = d["coordonneesLieu"].map(
                (d) =>
                  (d = result[2].find((item) => item._id == (d._id || d)) || d)
              );

            if (d["instancesOffres"] && d["instancesOffres"].length)
              d["instancesOffres"] = d["instancesOffres"].map(
                (d) =>
                  (d = result[3].find((item) => item._id == (d._id || d)) || d)
              );
          });
        } else {
          if (doc["taxoProtagoniste"])
            doc["taxoProtagoniste"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["taxoProtagoniste"]._id || doc["taxoProtagoniste"])
              ) || doc["taxoProtagoniste"];

          if (
            doc["categorieProduitsLivraison"] &&
            doc["categorieProduitsLivraison"].length
          )
            doc["categorieProduitsLivraison"] = doc[
              "categorieProduitsLivraison"
            ].map(
              (d) =>
                (d = result[0].find((item) => item._id == (d._id || d)) || d)
            );

          // if (
          //   doc["objetsConcernes.refObjet"] &&
          //   doc["objetsConcernes.refObjet"].length
          // )
          //   doc["objetsConcernes.refObjet"] = doc[
          //     "objetsConcernes.refObjet"
          //   ].map(
          //     (d) =>
          //       (d = result[1].find((item) => item._id == (d._id || d)) || d)
          //   );
          if (doc["documentsLegals"] && doc["documentsLegals"].length)
            doc["documentsLegals"] = doc["documentsLegals"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["moment"] && doc["moment"].length)
            doc["moment"] = doc["moment"].map(
              (d) =>
                (d = result[2].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["etats"] && doc["etats"].length)
            doc["etats"] = doc["etats"].map(
              (d) =>
                (d = result[3].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["opportinutes"] && doc["opportinutes"].length)
            doc["opportinutes"] = doc["opportinutes"].map(
              (d) =>
                (d = result[4].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["risques"] && doc["risques"].length)
            doc["risques"] = doc["risques"].map(
              (d) =>
                (d = result[4].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["incidents"] && doc["incidents"].length)
            doc["incidents"] = doc["incidents"].map(
              (d) =>
                (d = result[4].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["criteresConditions"] && doc["criteresConditions"].length)
            doc["criteresConditions"] = doc["criteresConditions"].map(
              (d) =>
                (d = result[5].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["caracteristiques"] && doc["caracteristiques"].length)
            doc["caracteristiques"] = doc["caracteristiques"].map(
              (d) =>
                (d = result[5].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["echangesCommunications"] &&
            doc["echangesCommunications"].length
          )
            doc["echangesCommunications"] = doc["echangesCommunications"].map(
              (d) =>
                (d = result[6].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["echangesEtCommunications"] &&
            doc["echangesEtCommunications"].length
          )
            doc["echangesEtCommunications"] = doc[
              "echangesEtCommunications"
            ].map(
              (d) =>
                (d = result[6].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["elementsBudgets"] && doc["elementsBudgets"].length)
            doc["elementsBudgets"] = doc["elementsBudgets"].map(
              (d) =>
                (d = result[7].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["activites"] && doc["activites"].length)
            doc["activites"] = doc["activites"].map(
              (d) =>
                (d = result[8].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["objetsAssocies"] && doc["objetsAssocies"].length)
            doc["objetsAssocies"] = doc["objetsAssocies"].map(
              (d) =>
                (d = result[9].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["referentiels"] && doc["referentiels"].length)
            doc["referentiels"] = doc["referentiels"].map(
              (d) =>
                (d = result[10].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["instructions"] && doc["instructions"].length)
            doc["instructions"] = doc["instructions"].map(
              (d) =>
                (d = result[11].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["reglesActivations"] && doc["reglesActivations"].length)
            doc["reglesActivations"] = doc["reglesActivations"].map(
              (d) =>
                (d = result[12].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["produitService"] && doc["produitService"].length)
            doc["produitService"] = doc["produitService"].map(
              (d) =>
                (d = result[13].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["classe"])
            doc["classe"] =
              result[14].find((item) => item.code == doc["classe"]) ||
              doc["classe"];

          if (doc["coordonneesLieu"] && doc["coordonneesLieu"].length)
            doc["coordonneesLieu"] = doc["coordonneesLieu"].map(
              (d) =>
                (d = result[15].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["instancesOffres"] && doc["instancesOffres"].length)
            doc["instancesOffres"] = doc["instancesOffres"].map(
              (d) =>
                (d = result[16].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["produitsLivraison"] && doc["produitsLivraison"].length)
            doc["produitsLivraison"] = doc["produitsLivraison"].map(
              (d) =>
                (d = result[17].find((item) => item._id == (d._id || d)) || d)
            );

          if (doc["livreurs"] && doc["livreurs"].length)
            doc["livreurs"] = doc["livreurs"].map(
              (d) =>
                (d = result[18].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    console.log("🚀 ~ distantRequest ~ error:", error);
    throw new Error(error);
  }
}

protagonistePotontielSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

protagonistePotontielSchema.post("save", async function (doc, next) {
  try {
    if (this.relationInterneProtagoniste?.length) {
      await RelationInterProtagoniste.updateMany(
        { _id: { $in: this.relationInterneProtagoniste } },
        { $addToSet: { protagonistePotentiel: this._id } }
      );
    }
    if (this.origineParticipation) {
      await ParticipationProtagoniste.updateOne(
        { _id: this.origineParticipation.toString() },
        { $addToSet: { protagonistePotnsielEstimateur: this._id } }
      );
    }
    if (this.organisationConcernee) {
      await OrganisationConcernee.updateOne(
        { _id: this.organisationConcernee.toString() },
        { $addToSet: { protagonisteProtentiels: this._id } }
      );
    }
    if (this.personneConcernee) {
      await PersonneConcernee.updateOne(
        { _id: this.personneConcernee.toString() },
        { $addToSet: { protagonistePotentie: this._id } }
      );
    }

    if (doc.documentsLegals.length)
      publishUpdate(
        "update_items",
        doc.documentsLegals,
        INSTANCEDOCUMENT_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
    if (doc.moment.length)
      publishUpdate("update_items", doc.moment, MOMENTDUPROJET_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
        },
      });
    if (doc.etats.length)
      publishUpdate("update_items", doc.etats, ETATOBJET_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObject: doc._id,
          typeObject: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
        },
      });
    if (doc.opportinutes.length)
      publishUpdate(
        "update_items",
        doc.opportinutes,
        PROBLEMEPERTINENCE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
            },
          },
        }
      );
    if (doc.risques.length)
      publishUpdate(
        "update_items",
        doc.risques,
        PROBLEMEPERTINENCE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
            },
          },
        }
      );
    if (doc.criteresConditions.length)
      publishUpdate(
        "update_items",
        doc.criteresConditions,
        INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
    if (doc.echangesCommunications.length)
      publishUpdate(
        "update_items",
        doc.echangesCommunications,
        ECHANGECOMMUNICATION_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
    if (doc.incidents.length)
      publishUpdate(
        "update_items",
        doc.incidents,
        PROBLEMEPERTINENCE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
            },
          },
        }
      );
    if (doc.elementsBudgets.length)
      publishUpdate("update_items", doc.elementsBudgets, BUDGET_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { ptotagoniste: doc._id },
      });
    if (doc.activites.length)
      publishUpdate("update_items", doc.activites, ACTIVITE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        },
      });
    if (doc.objetsAssocies.length)
      publishUpdate(
        "update_items",
        doc.objetsAssocies,
        OBJETASSOCIEE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjet: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
    if (doc.caracteristiques.length)
      publishUpdate(
        "update_items",
        doc.caracteristiques,
        INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
    if (doc.referentiels.length)
      publishUpdate(
        "update_items",
        doc.referentiels,
        REFERENTIELMODELEINSTANCEREFERENTIEL_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
            },
          },
        }
      );
    if (doc.instructions.length)
      publishUpdate("update_items", doc.instructions, INSTRUCTION_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: {
          objetsParent: {
            refObjet: doc._id,
            typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        },
      });
    if (doc.reglesActivations.length)
      publishUpdate(
        "update_items",
        doc.reglesActivations,
        REGLEVERSIONCLASSIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
    if (doc.echangesEtCommunications.length)
      publishUpdate(
        "update_items",
        doc.echangesEtCommunications,
        ECHANGECOMMUNICATION_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
    if (doc.acteurConcerne)
      publishUpdate(
        "update_items",
        [doc.acteurConcerne],
        ACTEURCONCERNE_ADMIN_QUEUE,
        { operation: "$set", body: { protagoniste: doc._id } }
      );
    if (doc.activites.length)
      publishUpdate("update_items", doc.activites, ACTIVITE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { protagonistes: doc._id },
      });

    //#region new save bloc
    if (doc.activites.length)
      publishUpdate("update_items", doc.activites, ACTIVITE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { protagonistes: doc._id },
      });

    if (doc.objetsConcernes.length) {
      let data = GroupBy(doc.objetsConcernes, "typeObjet");
      for (let item of Object.keys(data)) {
        if (item) {
          let body;
          let key;
          if (item.toLowerCase() == "dossier_dossier") {
            key = DOSSIER_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { acteur: doc._id } };
          } else if (item.toLowerCase() == "medaillon_dossier") {
            key = MEDAILLON_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { acteur: doc._id } };
          } else if (item.toLowerCase() == "sondage_sondage") {
            key = SONDAGE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { acteurs: doc._id } };
          } else if (item.toLowerCase() == "enquete_modelenquete") {
            key = ENQUETE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { refResponsable: doc._id },
            };
          } else if (
            item.toLowerCase() == "protagonisteaction_actioncitoyenne"
          ) {
            key = PROTAGONISTEACTION_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: {
                referenceProtagoniste: {
                  referenceProtagoniste: doc._id,
                  typeProtagoniste: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
                },
              },
            };
          } else if (item.toLowerCase() == "donation_donnation") {
            key = DONATION_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { donateurs: doc._id } };
          } else if (item.toLowerCase() == "portail_espacepublicitaire") {
            key = PORTAIL_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { refClient: doc._id } };
          } else if (item.toLowerCase() == "reponseapportee_instanceeservice") {
            key = REPONSEAPPORTEE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { protagonisteActionCitoyenne: doc._id },
            };
          } else if (item.toLowerCase() == "rencontre_rencontre") {
            key = RENCONTRE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { protagoniste: doc._id } };
          } else if (item.toLowerCase() == "presence_representant_rencontre") {
            key = PRESENCE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { refRepresentante: doc._id },
            };
          } else if (item.toLowerCase() == "presence_rencontre") {
            key = PRESENCE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { protagoniste: doc._id } };
          } else if (item.toLowerCase() == "retour_rencontre") {
            key = RETOUR_RENCONTRE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { refProtagoniste: doc._id },
            };
          } else if (item.toLowerCase() == "cible_rencontre") {
            key = CIBLE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { listeProtagoniste: doc._id },
            };
          } else if (item.toLowerCase() == "reclamation_reclamation") {
            key = RECLAMATION_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { instanceProtagoniste: doc._id },
            };
          } else if (item.toLowerCase() == "mailing_mailing") {
            key = MAILING_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { protagoniste: doc._id } };
          } else if (item.toLowerCase() == "plainte_plainte") {
            key = PLAINTE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { protagoniste: doc._id } };
          } else if (item.toLowerCase() == "contrepartie_plainte_faveur") {
            key = CONTREPARTIE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { enFaveurDe: doc._id } };
          } else if (item.toLowerCase() == "contrepartie_plainte_aquitter") {
            key = CONTREPARTIE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { aSacquitterPar: doc._id },
            };
          } else if (item.toLowerCase() == "reaction_traitement") {
            key = REACTION_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { instanceProtagoniste: doc._id },
            };
          } else if (item.toLowerCase() == "candidature_candidature") {
            key = CANDIDATURE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { candidats: doc._id } };
          } else if (item.toLowerCase() == "candidature_candidature") {
            key = CANDIDATURE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { appuyesParraines: doc._id },
            };
          } else if (item.toLowerCase() == "instanceevaluation_candidature") {
            key = INSTANCEEVALUATION_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { validateurs: doc._id } };
          } else if (item.toLowerCase() == "stockage_gestionstock") {
            key = STOCKAGE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { protagoniste: doc._id } };
          } else if (item.toLowerCase() == "stock_gestionstock") {
            key = STOCK_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { protagoniste: doc._id } };
          } else if (item.toLowerCase() == "livraisoncommande_livraison") {
            key = LIVRAISONCOMMANDE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { refClient: doc._id } };
          } else if (
            item.toLowerCase() == "detailsoperationlivraison_livraison"
          ) {
            key = DETAILSOPERATIONLIVRAISON_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { refFournisseur: doc._id },
            };
          } else if (item.toLowerCase() == "livreur_livreur") {
            key = LIVREUR_ADMIN_QUEUE;
            body = { operation: "$set", body: { fournisseur: doc._id } };
          } else if (item.toLowerCase() == "intervenant_maintenance") {
            key = INTERVENANT_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { refAssocie: doc._id } };
          } else if (
            item.toLowerCase() == "problemepertinence_gestionprobleme"
          ) {
            key = PROBLEMEPERTINENCE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { protagonistesPotentiels: doc._id },
            };
          } else if (item.toLowerCase() == "livrables_activite") {
            key = LIVRABLES_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { protagonistesPotentiels: doc._id },
            };
          } else if (item.toLowerCase() == "retour_gestionretour") {
            key = RETOUR_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { refCLient: doc._id } };
          } else if (
            item.toLowerCase() == "operationdelivraison_operationlogistique"
          ) {
            key = OPERATIONDELIVRAISON_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { acteur: doc._id } };
          } else if (
            item.toLowerCase() ==
            "actionentrepriseentrprendre_actionentrepriseentreprendre"
          ) {
            key = ACTIONENTREPRISEENTRPRENDRE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { protagonistePotentiel: doc._id },
            };
          } else if (item.toLowerCase() == "programmeevent_event") {
            key = PROGRAMMEEVENT_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { protagonistePotentiel: doc._id },
            };
          } else if (item.toLowerCase() == "agendaevent_event") {
            key = AGENDAEVENT_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { protagonistePotentiel: doc._id },
            };
          } else if (item.toLowerCase() == "objectto_objectto") {
            key = OBJECTTO_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: {
                protagonistes: doc._id,
              },
            };
          }

          if (body)
            publishUpdate(
              "update_items",
              data[item].map((i) => i.refObjet),
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
//rewrite insertMany
protagonistePotontielSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    let origineParticipation = GroupBy(doc, "origineParticipation");
    for (let item of Object.keys(origineParticipation)) {
      if (item)
        await ParticipationProtagoniste.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              protagonistePotnsielEstimateur: {
                $each: origineParticipation[item].map((d) => d._id),
              },
            },
          }
        );
    }

    let organisationConcernee = GroupBy(doc, "organisationConcernee");
    for (let item of Object.keys(organisationConcernee)) {
      if (item)
        await OrganisationConcernee.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              protagonisteProtentiels: {
                $each: organisationConcernee[item].map((d) => d._id),
              },
            },
          }
        );
    }

    let personneConcernee = GroupBy(doc, "personneConcernee");
    for (let item of Object.keys(personneConcernee)) {
      if (item)
        await PersonneConcernee.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              protagonistePotentie: {
                $each: personneConcernee[item].map((d) => d._id),
              },
            },
          }
        );
    }

    let opportinutes = GroupBy(doc, "opportinutes");
    for (let item of Object.keys(opportinutes)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(opportinutes[item].map((d) => d.opportinutes)))],
          PROBLEMEPERTINENCE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: opportinutes[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
                    })
                ),
              },
            },
          }
        );
    }
    let risques = GroupBy(doc, "risques");
    for (let item of Object.keys(risques)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(risques[item].map((d) => d.risques)))],
          PROBLEMEPERTINENCE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: risques[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
                    })
                ),
              },
            },
          }
        );
    }
    let incidents = GroupBy(doc, "incidents");
    for (let item of Object.keys(incidents)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(incidents[item].map((d) => d.incidents)))],
          PROBLEMEPERTINENCE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: incidents[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
                    })
                ),
              },
            },
          }
        );
    }
    let elementsBudgets = GroupBy(doc, "elementsBudgets");
    for (let item of Object.keys(elementsBudgets)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(elementsBudgets[item].map((d) => d.elementsBudgets))
            ),
          ],
          BUDGET_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              ptotagoniste: { $each: elementsBudgets[item].map((i) => i._id) },
            },
          }
        );
    }
    let activites = GroupBy(doc, "activites");
    for (let item of Object.keys(activites)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(activites[item].map((d) => d.activites)))],
          ACTIVITE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: activites[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
                    })
                ),
              },
            },
          }
        );
    }
    let referentiels = GroupBy(doc, "referentiels");
    for (let item of Object.keys(referentiels)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(referentiels[item].map((d) => d.referentiels)))],
          REFERENTIELMODELEINSTANCEREFERENTIEL_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: referentiels[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
                    })
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
                    (i = {
                      refObjet: i._id,
                      typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
                    })
                ),
              },
            },
          }
        );
    }

    //#region new insert many bloc

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
            if (item.toLowerCase() == "dossier_dossier") {
              key = DOSSIER_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  acteur: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "medaillon_dossier") {
              key = MEDAILLON_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  acteur: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "sondage_sondage") {
              key = SONDAGE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  acteurs: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "enquete_modelenquete") {
              key = ENQUETE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  refResponsable: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "agendaevent_event") {
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistePotentiel: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "objectto_objectto") {
              key = OBJECTTO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistes: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "programmeevent_event") {
              key = PROGRAMMEEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistePotentiel: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "role_recompense") {
              key = ROLE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistePotentiel: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "protagonisteaction_actioncitoyenne"
            ) {
              key = PROTAGONISTEACTION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  referenceProtagoniste: {
                    $each: references[itemRef].map(
                      (d) =>
                        (d = {
                          referenceProtagoniste: d._id,
                          typeProtagoniste:
                            "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
                        })
                    ),
                  },
                },
              };
            } else if (item.toLowerCase() == "donation_donnation") {
              key = DONATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  donateurs: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "portail_espacepublicitaire") {
              key = PORTAIL_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  refClient: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (
              item.toLowerCase() == "reponseapportee_instanceeservice"
            ) {
              key = REPONSEAPPORTEE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonisteActionCitoyenne: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "conditionparticuliere_instanceeservice"
            ) {
              key = CONDITIONPARTICULIERE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistes: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "rencontre_rencontre") {
              key = RENCONTRE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "presence_representant_rencontre"
            ) {
              key = PRESENCE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  refRepresentante: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "presence_rencontre") {
              key = PRESENCE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "retour_rencontre") {
              key = RETOUR_RENCONTRE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  refProtagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "cible_rencontre") {
              key = CIBLE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  listeProtagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "reclamation_reclamation") {
              key = RECLAMATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceProtagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "mailing_mailing") {
              key = MAILING_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "plainte_plainte") {
              key = PLAINTE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "contrepartie_plainte_faveur") {
              key = CONTREPARTIE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  enFaveurDe: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "contrepartie_plainte_aquitter") {
              key = CONTREPARTIE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  aSacquitterPar: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "reaction_traitement") {
              key = REACTION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceProtagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "candidature_candidature") {
              key = CANDIDATURE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  candidats: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "candidature_candidature") {
              key = CANDIDATURE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  appuyesParraines: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "instanceevaluation_candidature") {
              key = INSTANCEEVALUATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  validateurs: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "stockage_gestionstock") {
              key = STOCKAGE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "stock_gestionstock") {
              key = STOCK_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "livraisoncommande_livraison") {
              key = LIVRAISONCOMMANDE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  refClient: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (
              item.toLowerCase() == "detailsoperationlivraison_livraison"
            ) {
              key = DETAILSOPERATIONLIVRAISON_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  refFournisseur: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "livreur_livreur") {
              key = LIVREUR_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  fournisseur: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "intervenant_maintenance") {
              key = INTERVENANT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  refAssocie: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (
              item.toLowerCase() == "projetmodelinstance_modelprojet"
            ) {
              key = PROJETMODELINSTANCE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistePotentiel: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "organigramme_structureprofessionnelle"
            ) {
              key = ORGANIGRAMME_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistePotentiel: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "rolespecifique_structureprofessionnelle"
            ) {
              key = ROLESPECIFIQUE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistePotentiel: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "problemepertinence_gestionprobleme"
            ) {
              key = PROBLEMEPERTINENCE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistesPotentiels: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "realisation_activite") {
              key = REALISATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistes: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "livrables_activite") {
              key = LIVRABLES_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistesPotentiels: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() ==
              "actionentrepriseentrprendre_actionentrepriseentreprendre"
            ) {
              key = ACTIONENTREPRISEENTRPRENDRE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistePotentiel: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "retour_gestionretour") {
              key = RETOUR_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  refCLient: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (
              item.toLowerCase() == "operationdelivraison_operationlogistique"
            ) {
              key = OPERATIONDELIVRAISON_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  acteur: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (
              item.toLowerCase() == "instancedocument_instancedocument"
            ) {
              key = INSTANCEDOCUMENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  protagonistes: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            }

            //#region new insertMany bloc
            else if (
              item.toLowerCase() ==
              "installationetequipement_installationetequipement"
            ) {
              key = INSTALLATIONETEQUIPEMENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceProtagoniste: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            }
            //#endregion new insertMany bloc
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

protagonistePotontielSchema.pre("findOneAndUpdate", async function (next) {
  try {
    console.log("pre findOneAndUpdate===>", this._update);

    let doc = await protagonistePotontiel.findOne(this.getQuery()).lean();
    if (doc) {
      itemToCheck["objetsConcernes"] = doc.objetsConcernes;
      itemToCheck["documentsLegals"] = doc.documentsLegals;
      itemToCheck["moment"] = doc.moment;
      itemToCheck["etats"] = doc.etats;
      itemToCheck["opportinutes"] = doc.opportinutes;
      itemToCheck["risques"] = doc.risques;
      itemToCheck["criteresConditions"] = doc.criteresConditions;
      itemToCheck["echangesCommunications"] = doc.echangesCommunications;
      itemToCheck["incidents"] = doc.incidents;
      itemToCheck["elementsBudgets"] = doc.elementsBudgets;
      itemToCheck["activites"] = doc.activites;
      itemToCheck["objetsAssocies"] = doc.objetsAssocies;
      itemToCheck["caracteristiques"] = doc.caracteristiques;
      itemToCheck["referentiels"] = doc.referentiels;
      itemToCheck["instructions"] = doc.instructions;
      itemToCheck["reglesActivations"] = doc.reglesActivations;
      itemToCheck["echangesEtCommunications"] = doc.echangesEtCommunications;
      itemToCheck["acteurConcerne"] = doc.acteurConcerne;
      prevState = doc?.etatProtagoniste;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatProtagoniste
      );

      const relationInterneProtagonisteIds =
        this._update?.["$set"]?.relationInterneProtagoniste;
      if (
        relationInterneProtagonisteIds &&
        doc?.relationInterneProtagoniste &&
        doc?.relationInterneProtagoniste != relationInterneProtagonisteIds
      ) {
        let ids = doc?.relationInterneProtagoniste
          .map((item) => item._id || item)
          .filter((item) => !relationInterneProtagonisteIds.includes(item));
        await RelationInterProtagoniste.updateMany(
          { _id: { $in: ids } },
          { $pull: { protagonistePotentiel: doc._id } }
        );
      }
      const origineParticipationId =
        this._update?.["$set"]?.origineParticipation;
      if (
        doc?.origineParticipation != origineParticipationId &&
        doc?.origineParticipation != undefined
      )
        await ParticipationProtagoniste.updateOne(
          {
            _id: (
              doc.origineParticipation._id || doc.origineParticipation
            ).toString(),
          },
          { $pull: { protagonistePotnsielEstimateur: doc._id } }
        );
      const organisationConcerneeId =
        this._update?.["$set"]?.organisationConcernee;
      if (
        doc?.organisationConcernee != organisationConcerneeId &&
        doc?.organisationConcernee != undefined
      )
        await OrganisationConcernee.updateOne(
          {
            _id: (
              doc.organisationConcernee._id || doc.organisationConcernee
            ).toString(),
          },
          { $pull: { protagonisteProtentiels: doc._id } }
        );
      const personneConcerneeId = this._update?.["$set"]?.personneConcernee;
      if (
        doc?.personneConcernee != personneConcerneeId &&
        doc?.personneConcernee != undefined
      )
        await PersonneConcernee.updateOne(
          {
            _id: (
              doc.personneConcernee._id || doc.personneConcernee
            ).toString(),
          },
          { $pull: { protagonistePotentie: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
protagonistePotontielSchema.post(
  "findOneAndUpdate",
  async function (doc, next) {
    // console.log("post findOneAndUpdate===>", doc.classe);
    try {
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
              if (item.toLowerCase() == "dossier_dossier")
                body = { operation: "$pull", body: { acteur: doc._id } };
              else if (item.toLowerCase() == "medaillon_dossier")
                body = { operation: "$pull", body: { acteur: doc._id } };
              else if (item.toLowerCase() == "sondage_sondage")
                body = { operation: "$pull", body: { acteurs: doc._id } };
              else if (item.toLowerCase() == "enquete_modelenquete")
                body = {
                  operation: "$pull",
                  body: { refResponsable: doc._id },
                };
              else if (item.toLowerCase() == "agendaevent_event")
                body = {
                  operation: "$pull",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (item.toLowerCase() == "objectto_objectto") {
                body = {
                  operation: "$pull",
                  body: {
                    protagonistes: doc._id,
                  },
                };
              } else if (item.toLowerCase() == "programmeevent_event")
                body = {
                  operation: "$pull",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (item.toLowerCase() == "role_recompense")
                body = {
                  operation: "$pull",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (
                item.toLowerCase() == "protagonisteaction_actioncitoyenne"
              )
                body = {
                  operation: "$pull",
                  body: {
                    referenceProtagoniste: { referenceProtagoniste: doc._id },
                  },
                };
              else if (item.toLowerCase() == "donation_donnation")
                body = { operation: "$pull", body: { donateurs: doc._id } };
              else if (item.toLowerCase() == "portail_espacepublicitaire")
                body = { operation: "$pull", body: { refClient: doc._id } };
              else if (item.toLowerCase() == "reponseapportee_instanceeservice")
                body = {
                  operation: "$pull",
                  body: { protagonisteActionCitoyenne: doc._id },
                };
              else if (
                item.toLowerCase() == "conditionparticuliere_instanceeservice"
              )
                body = { operation: "$pull", body: { protagonistes: doc._id } };
              else if (item.toLowerCase() == "rencontre_rencontre")
                body = { operation: "$pull", body: { protagoniste: doc._id } };
              else if (item.toLowerCase() == "presence_representant_rencontre")
                body = {
                  operation: "$pull",
                  body: { refRepresentante: doc._id },
                };
              else if (item.toLowerCase() == "presence_rencontre")
                body = { operation: "$pull", body: { protagoniste: doc._id } };
              else if (item.toLowerCase() == "retour_rencontre")
                body = {
                  operation: "$pull",
                  body: { refProtagoniste: doc._id },
                };
              else if (item.toLowerCase() == "cible_rencontre")
                body = {
                  operation: "$pull",
                  body: { listeProtagoniste: doc._id },
                };
              else if (item.toLowerCase() == "reclamation_reclamation")
                body = {
                  operation: "$pull",
                  body: { instanceProtagoniste: doc._id },
                };
              else if (item.toLowerCase() == "mailing_mailing")
                body = { operation: "$pull", body: { protagoniste: doc._id } };
              else if (item.toLowerCase() == "plainte_plainte")
                body = { operation: "$pull", body: { protagoniste: doc._id } };
              else if (item.toLowerCase() == "contrepartie_plainte_faveur")
                body = { operation: "$pull", body: { enFaveurDe: doc._id } };
              else if (item.toLowerCase() == "contrepartie_plainte_aquitter")
                body = {
                  operation: "$pull",
                  body: { aSacquitterPar: doc._id },
                };
              else if (item.toLowerCase() == "reaction_traitement")
                body = {
                  operation: "$pull",
                  body: { instanceProtagoniste: doc._id },
                };
              else if (item.toLowerCase() == "candidature_candidature")
                body = { operation: "$pull", body: { candidats: doc._id } };
              else if (item.toLowerCase() == "candidature_candidature")
                body = {
                  operation: "$pull",
                  body: { appuyesParraines: doc._id },
                };
              else if (item.toLowerCase() == "instanceevaluation_candidature")
                body = { operation: "$pull", body: { validateurs: doc._id } };
              else if (item.toLowerCase() == "stockage_gestionstock")
                body = { operation: "$pull", body: { protagoniste: doc._id } };
              else if (item.toLowerCase() == "stock_gestionstock")
                body = { operation: "$pull", body: { protagoniste: doc._id } };
              else if (item.toLowerCase() == "livraisoncommande_livraison")
                body = { operation: "$pull", body: { refClient: doc._id } };
              else if (
                item.toLowerCase() == "detailsoperationlivraison_livraison"
              )
                body = {
                  operation: "$pull",
                  body: { refFournisseur: doc._id },
                };
              else if (item.toLowerCase() == "livreur_livreur")
                body = { operation: "$pull", body: { fournisseur: doc._id } };
              else if (item.toLowerCase() == "intervenant_maintenance")
                body = { operation: "$pull", body: { refAssocie: doc._id } };
              else if (item.toLowerCase() == "projetmodelinstance_modelprojet")
                body = {
                  operation: "$pull",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (
                item.toLowerCase() == "organigramme_structureprofessionnelle"
              )
                body = {
                  operation: "$pull",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (
                item.toLowerCase() == "rolespecifique_structureprofessionnelle"
              )
                body = {
                  operation: "$pull",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (
                item.toLowerCase() == "problemepertinence_gestionprobleme"
              )
                body = {
                  operation: "$pull",
                  body: { protagonistesPotentiels: doc._id },
                };
              else if (item.toLowerCase() == "budget_budget")
                body = { operation: "$pull", body: { ptotagoniste: doc._id } };
              else if (item.toLowerCase() == "realisation_activite")
                body = { operation: "$pull", body: { protagonistes: doc._id } };
              else if (item.toLowerCase() == "livrables_activite")
                body = {
                  operation: "$pull",
                  body: { protagonistesPotentiels: doc._id },
                };
              else if (
                item.toLowerCase() ==
                "actionentrepriseentrprendre_actionentrepriseentreprendre"
              )
                body = {
                  operation: "$pull",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (item.toLowerCase() == "retour_gestionretour")
                body = { operation: "$pull", body: { refCLient: doc._id } };
              else if (
                item.toLowerCase() == "operationdelivraison_operationlogistique"
              )
                body = { operation: "$pull", body: { acteur: doc._id } };
              else if (
                item.toLowerCase() == "instancedocument_instancedocument"
              )
                body = { operation: "$pull", body: { protagonistes: doc._id } };
              if (body)
                publishUpdate(
                  "update_items",
                  itemToPull[item].map((i) => i.refObjet),
                  `${item.toUpperCase()}_PLACE2INVEST_ADMIN_KEY`,
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
              if (item.toLowerCase() == "dossier_dossier")
                body = { operation: "$addToSet", body: { acteur: doc._id } };
              else if (item.toLowerCase() == "medaillon_dossier")
                body = { operation: "$addToSet", body: { acteur: doc._id } };
              else if (item.toLowerCase() == "sondage_sondage")
                body = { operation: "$addToSet", body: { acteurs: doc._id } };
              else if (item.toLowerCase() == "enquete_modelenquete")
                body = {
                  operation: "$addToSet",
                  body: { refResponsable: doc._id },
                };
              else if (item.toLowerCase() == "agendaevent_event")
                body = {
                  operation: "$addToSet",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (item.toLowerCase() == "objectto_objectto") {
                body = {
                  operation: "$addToSet",
                  body: {
                    protagonistes: doc._id,
                  },
                };
              } else if (item.toLowerCase() == "programmeevent_event")
                body = {
                  operation: "$addToSet",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (item.toLowerCase() == "role_recompense")
                body = {
                  operation: "$addToSet",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (
                item.toLowerCase() == "protagonisteaction_actioncitoyenne"
              )
                body = {
                  operation: "$addToSet",
                  body: {
                    referenceProtagoniste: {
                      referenceProtagoniste: doc._id,
                      typeProtagoniste: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
                    },
                  },
                };
              else if (item.toLowerCase() == "donation_donnation")
                body = { operation: "$addToSet", body: { donateurs: doc._id } };
              else if (item.toLowerCase() == "portail_espacepublicitaire")
                body = { operation: "$addToSet", body: { refClient: doc._id } };
              else if (item.toLowerCase() == "reponseapportee_instanceeservice")
                body = {
                  operation: "$addToSet",
                  body: { protagonisteActionCitoyenne: doc._id },
                };
              else if (
                item.toLowerCase() == "conditionparticuliere_instanceeservice"
              )
                body = {
                  operation: "$addToSet",
                  body: { protagonistes: doc._id },
                };
              else if (item.toLowerCase() == "rencontre_rencontre")
                body = {
                  operation: "$addToSet",
                  body: { protagoniste: doc._id },
                };
              else if (item.toLowerCase() == "presence_representant_rencontre")
                body = {
                  operation: "$addToSet",
                  body: { refRepresentante: doc._id },
                };
              else if (item.toLowerCase() == "presence_rencontre")
                body = {
                  operation: "$addToSet",
                  body: { protagoniste: doc._id },
                };
              else if (item.toLowerCase() == "retour_rencontre")
                body = {
                  operation: "$addToSet",
                  body: { refProtagoniste: doc._id },
                };
              else if (item.toLowerCase() == "cible_rencontre")
                body = {
                  operation: "$addToSet",
                  body: { listeProtagoniste: doc._id },
                };
              else if (item.toLowerCase() == "reclamation_reclamation")
                body = {
                  operation: "$addToSet",
                  body: { instanceProtagoniste: doc._id },
                };
              else if (item.toLowerCase() == "mailing_mailing")
                body = {
                  operation: "$addToSet",
                  body: { protagoniste: doc._id },
                };
              else if (item.toLowerCase() == "plainte_plainte")
                body = {
                  operation: "$addToSet",
                  body: { protagoniste: doc._id },
                };
              else if (item.toLowerCase() == "contrepartie_plainte_faveur")
                body = {
                  operation: "$addToSet",
                  body: { enFaveurDe: doc._id },
                };
              else if (item.toLowerCase() == "contrepartie_plainte_aquitter")
                body = {
                  operation: "$addToSet",
                  body: { aSacquitterPar: doc._id },
                };
              else if (item.toLowerCase() == "reaction_traitement")
                body = {
                  operation: "$addToSet",
                  body: { instanceProtagoniste: doc._id },
                };
              else if (item.toLowerCase() == "candidature_candidature")
                body = { operation: "$addToSet", body: { candidats: doc._id } };
              else if (item.toLowerCase() == "candidature_candidature")
                body = {
                  operation: "$addToSet",
                  body: { appuyesParraines: doc._id },
                };
              else if (item.toLowerCase() == "instanceevaluation_candidature")
                body = {
                  operation: "$addToSet",
                  body: { validateurs: doc._id },
                };
              else if (item.toLowerCase() == "stockage_gestionstock")
                body = {
                  operation: "$addToSet",
                  body: { protagoniste: doc._id },
                };
              else if (item.toLowerCase() == "stock_gestionstock")
                body = {
                  operation: "$addToSet",
                  body: { protagoniste: doc._id },
                };
              else if (item.toLowerCase() == "livraisoncommande_livraison")
                body = { operation: "$addToSet", body: { refClient: doc._id } };
              else if (
                item.toLowerCase() == "detailsoperationlivraison_livraison"
              )
                body = {
                  operation: "$addToSet",
                  body: { refFournisseur: doc._id },
                };
              else if (item.toLowerCase() == "livreur_livreur")
                body = {
                  operation: "$addToSet",
                  body: { fournisseur: doc._id },
                };
              else if (item.toLowerCase() == "intervenant_maintenance")
                body = {
                  operation: "$addToSet",
                  body: { refAssocie: doc._id },
                };
              else if (item.toLowerCase() == "projetmodelinstance_modelprojet")
                body = {
                  operation: "$addToSet",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (
                item.toLowerCase() == "organigramme_structureprofessionnelle"
              )
                body = {
                  operation: "$addToSet",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (
                item.toLowerCase() == "rolespecifique_structureprofessionnelle"
              )
                body = {
                  operation: "$addToSet",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (
                item.toLowerCase() == "problemepertinence_gestionprobleme"
              )
                body = {
                  operation: "$addToSet",
                  body: { protagonistesPotentiels: doc._id },
                };
              else if (item.toLowerCase() == "budget_budget")
                body = {
                  operation: "$addToSet",
                  body: { ptotagoniste: doc._id },
                };
              else if (item.toLowerCase() == "realisation_activite")
                body = {
                  operation: "$addToSet",
                  body: { protagonistes: doc._id },
                };
              else if (item.toLowerCase() == "livrables_activite")
                body = {
                  operation: "$addToSet",
                  body: { protagonistesPotentiels: doc._id },
                };
              else if (
                item.toLowerCase() ==
                "actionentrepriseentrprendre_actionentrepriseentreprendre"
              )
                body = {
                  operation: "$addToSet",
                  body: { protagonistePotentiel: doc._id },
                };
              else if (item.toLowerCase() == "retour_gestionretour")
                body = { operation: "$addToSet", body: { refCLient: doc._id } };
              else if (
                item.toLowerCase() == "operationdelivraison_operationlogistique"
              )
                body = { operation: "$addToSet", body: { acteur: doc._id } };
              else if (
                item.toLowerCase() == "instancedocument_instancedocument"
              )
                body = {
                  operation: "$addToSet",
                  body: { protagonistes: doc._id },
                };
              if (body)
                publishUpdate(
                  "update_items",
                  itemToPush[item].map((i) => i.refObjet),
                  `${item.toUpperCase()}_PLACE2INVEST_ADMIN_KEY`,
                  body
                );
            }
          }
        }
      }

      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["documentsLegals"],
          newData: doc.documentsLegals,
        },
        INSTANCEDOCUMENT_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
          bodyPush: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["moment"], newData: doc.moment },
        MOMENTDUPROJET_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
          bodyPush: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["etats"], newData: doc.etats },
        ETATOBJET_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { refObject: null, typeObject: null },
          bodyPush: {
            refObject: doc._id,
            typeObject: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["opportinutes"], newData: doc.opportinutes },
        PROBLEMEPERTINENCE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { objetsConcernes: { refObjet: doc._id } },
          bodyPush: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
            },
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["risques"], newData: doc.risques },
        PROBLEMEPERTINENCE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { objetsConcernes: { refObjet: doc._id } },
          bodyPush: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
            },
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["criteresConditions"],
          newData: doc.criteresConditions,
        },
        INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
          bodyPush: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["echangesCommunications"],
          newData: doc.echangesCommunications,
        },
        ECHANGECOMMUNICATION_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
          bodyPush: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["incidents"], newData: doc.incidents },
        PROBLEMEPERTINENCE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { objetsConcernes: { refObjet: doc._id } },
          bodyPush: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
            },
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["elementsBudgets"],
          newData: doc.elementsBudgets,
        },
        BUDGET_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { ptotagoniste: doc._id },
          bodyPush: { ptotagoniste: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["activites"], newData: doc.activites },
        ACTIVITE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { objetsConcernes: { refObjet: doc._id } },
          bodyPush: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
            },
          },
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
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
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
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["referentiels"], newData: doc.referentiels },
        REFERENTIELMODELEINSTANCEREFERENTIEL_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { objetsConcernes: { refObjet: doc._id } },
          bodyPush: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
            },
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
            objetsParent: {
              refObjet: doc._id,
              typeObjet: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
            },
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["reglesActivations"],
          newData: doc.reglesActivations,
        },
        REGLEVERSIONCLASSIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
          bodyPush: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["echangesEtCommunications"],
          newData: doc.echangesEtCommunications,
        },
        ECHANGECOMMUNICATION_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
          bodyPush: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: [itemToCheck["acteurConcerne"]],
          newData: [doc.acteurConcerne],
        },
        ACTEURCONCERNE_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { etatObjet: "code-2" },
          bodyPush: { protagoniste: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["activites"], newData: doc.activites },
        ACTIVITE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { protagonistes: doc._id },
          bodyPush: { protagonistes: doc._id },
        }
      );

      communicateWithClient("postFindOneAndUpdate", doc, prevState);

      if (doc.relationInterneProtagoniste?.length)
        await RelationInterProtagoniste.updateMany(
          {
            _id: {
              $in: doc.relationInterneProtagoniste.map((d) => d._id || d),
            },
          },
          { $addToSet: { protagonistePotentiel: doc._id } }
        );
      if (doc.origineParticipation)
        await ParticipationProtagoniste.updateOne(
          {
            _id:
              doc.origineParticipation?._id?.toString() ||
              doc.origineParticipation,
          },
          { $addToSet: { protagonistePotnsielEstimateur: doc._id } }
        );
      if (doc.organisationConcernee)
        await OrganisationConcernee.updateOne(
          {
            _id:
              doc.organisationConcernee?._id?.toString() ||
              doc.organisationConcernee,
          },
          { $addToSet: { protagonisteProtentiels: doc._id } }
        );
      if (doc.personneConcernee)
        await PersonneConcernee.updateOne(
          {
            _id:
              doc.personneConcernee?._id?.toString() || doc.personneConcernee,
          },
          { $addToSet: { protagonistePotentie: doc._id } }
        );
      next();
    } catch (error) {
      next(error);
    }
  }
);
protagonistePotontielSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      //#region new addToSet bloc
      if (this._update?.["$addToSet"]?.objetsConcernes && docs.modifiedCount) {
        let body;
        let key;
        if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "dossier_dossier"
        ) {
          key = DOSSIER_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { acteur: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "medaillon_dossier"
        ) {
          key = MEDAILLON_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { acteur: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "sondage_sondage"
        ) {
          key = SONDAGE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { acteurs: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "enquete_modelenquete"
        ) {
          key = ENQUETE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { refResponsable: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "protagonisteaction_actioncitoyenne"
        ) {
          key = PROTAGONISTEACTION_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              referenceProtagoniste: {
                $each: this.getQuery()?._id?.["$in"].map(
                  (d) =>
                    (d = {
                      referenceProtagoniste: d,
                      typeProtagoniste: "PROTAGONISTEPOTONTIEL_PROTAGONISTE",
                    })
                ),
              },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "donation_donnation"
        ) {
          key = DONATION_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { donateurs: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "portail_espacepublicitaire"
        ) {
          key = PORTAIL_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { refClient: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "reponseapportee_instanceeservice"
        ) {
          key = REPONSEAPPORTEE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              protagonisteActionCitoyenne: {
                $each: this.getQuery()?._id?.["$in"],
              },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "presence_representant_rencontre"
        ) {
          key = PRESENCE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              refRepresentante: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "presence_rencontre"
        ) {
          key = PRESENCE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              protagoniste: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "retour_rencontre"
        ) {
          key = RETOUR_RENCONTRE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { refProtagoniste: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "cible_rencontre"
        ) {
          key = CIBLE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              listeProtagoniste: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "reclamation_reclamation"
        ) {
          key = RECLAMATION_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              instanceProtagoniste: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "contrepartie_plainte_faveur"
        ) {
          key = CONTREPARTIE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { enFaveurDe: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "contrepartie_plainte_aquitter"
        ) {
          key = CONTREPARTIE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { aSacquitterPar: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "reaction_traitement"
        ) {
          key = REACTION_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              instanceProtagoniste: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "candidature_candidature"
        ) {
          key = CANDIDATURE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { candidats: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "candidature_candidature"
        ) {
          key = CANDIDATURE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              appuyesParraines: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "instanceevaluation_candidature"
        ) {
          key = INSTANCEEVALUATION_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { validateurs: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "livraisoncommande_livraison"
        ) {
          key = LIVRAISONCOMMANDE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { refClient: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "detailsoperationlivraison_livraison"
        ) {
          key = DETAILSOPERATIONLIVRAISON_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { refFournisseur: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "livreur_livreur"
        ) {
          key = LIVREUR_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { fournisseur: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "intervenant_maintenance"
        ) {
          key = INTERVENANT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { refAssocie: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "problemepertinence_gestionprobleme"
        ) {
          key = PROBLEMEPERTINENCE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              protagonistesPotentiels: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "livrables_activite"
        ) {
          key = LIVRABLES_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              protagonistesPotentiels: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "retour_gestionretour"
        ) {
          key = RETOUR_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { refCLient: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "operationdelivraison_operationlogistique"
        ) {
          key = OPERATIONDELIVRAISON_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { acteur: { $each: this.getQuery()?._id?.["$in"] } },
          };
        }

        //#region new addToSet bloc
        else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "installationetequipement_installationetequipement"
        ) {
          key = INSTALLATIONETEQUIPEMENT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              instanceProtagoniste: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "programmeevent_event"
        ) {
          key = PROGRAMMEEVENT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              protagonistePotentiel: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "agendaevent_event"
        ) {
          key = AGENDAEVENT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              protagonistePotentiel: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "objectto_objectto"
        ) {
          key = OBJECTTO_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              protagonistes: {
                $each: this.getQuery()?._id?.["$in"],
              },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "mailing_mailing"
        ) {
          key = MAILING_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              protagoniste: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "rencontre_rencontre"
        ) {
          key = RENCONTRE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              protagoniste: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        }
        //#endregion new addToSet bloc

        //#region new addToSet bloc
        else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "acteur_requete"
        ) {
          key = ACTEUR_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { protagoniste: { $each: this.getQuery()?._id?.["$in"] } },
          };
        }
        //#endregion new addToSet bloc
        if (body)
          publishUpdate(
            "update_items",
            this._update?.["$addToSet"].objetsConcernes.refObjet,
            key,
            body
          );
      }
      //#endregion new addToSet bloc

      if (
        docs.modifiedCount /*new modifCount*/ &&
        this._update?.["$addToSet"]?.elementsBudgets &&
        docs.modifiedCount /*new modifCount*/ &&
        docs.modifiedCount /*new modifCount*/
      )
        publishUpdate(
          "update_items",
          this._update?.["$addToSet"]?.elementsBudgets,
          BUDGET_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { ptotagoniste: { $each: this.getQuery()._id["$in"] } },
          }
        );
      if (
        docs.modifiedCount /*new modifCount*/ &&
        this._update?.["$addToSet"]?.activites &&
        docs.modifiedCount /*new modifCount*/ &&
        docs.modifiedCount /*new modifCount*/
      )
        publishUpdate(
          "update_items",
          this._update?.["$addToSet"]?.activites,
          ACTIVITE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { protagonistes: { $each: this.getQuery()._id["$in"] } },
          }
        );
      if (this._update?.["$addToSet"].relationInterneProtagoniste) {
        await RelationInterProtagoniste.updateOne(
          { _id: this._update?.["$addToSet"]?.relationInterneProtagoniste },
          {
            $addToSet: {
              protagonistePotentiel: { $each: this.getQuery()._id["$in"] },
            },
          }
        );
      } else if (this._update?.["$addToSet"]?.objetsConcernes) {
        let body;
        switch (this._update?.["$addToSet"]?.objetsConcernes.typeObjet) {
          case "ORGANIGRAMME_STRUCTUREPROFESSIONNELLE":
            body = {
              operation: "$addToSet",
              body: {
                protagonistePotentiel: { $each: this.getQuery()._id["$in"] },
              },
            };
            break;
          case "PROJETMODELINSTANCE_MODELPROJET":
            body = {
              operation: "$addToSet",
              body: {
                protagonistePotentiel: { $each: this.getQuery()._id["$in"] },
              },
            };
            break;
          case "ACTIONENTREPRISEENTRPRENDRE_ACTIONENTREPRISEENTREPRENDRE":
            body = {
              operation: "$addToSet",
              body: {
                protagonistePotentiel: { $each: this.getQuery()._id["$in"] },
              },
            };
            break;
          case "PLAINTE_PLAINTE":
            body = {
              operation: "$addToSet",
              body: {
                protagoniste: { $each: this.getQuery()._id["$in"] },
              },
            };
            break;
        }

        if (body)
          publishUpdate(
            "update_items",
            this._update?.["$addToSet"]?.objetsConcernes.refObjet,
            `${this._update?.["$addToSet"]?.objetsConcernes.typeObjet}_PLACE2INVEST_ADMIN_KEY`,
            body
          );
      }
    } else {
      let doc = await protagonistePotontiel.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc

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
                if (item.toLowerCase() == "dossier_dossier") {
                  key = DOSSIER_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      acteur: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "medaillon_dossier") {
                  key = MEDAILLON_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      acteur: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "sondage_sondage") {
                  key = SONDAGE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      acteurs: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "enquete_modelenquete") {
                  key = ENQUETE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      refResponsable: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "agendaevent_event") {
                  key = AGENDAEVENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistePotentiel: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "objectto_objectto") {
                  key = OBJECTTO_ADMIN_QUEUE;
                  body = {
                    operation: "$addToSet",
                    body: {
                      protagonistes: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "programmeevent_event") {
                  key = PROGRAMMEEVENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistePotentiel: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "role_recompense") {
                  key = ROLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistePotentiel: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "protagonisteaction_actioncitoyenne"
                ) {
                  key = PROTAGONISTEACTION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      referenceProtagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "donation_donnation") {
                  key = DONATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      donateurs: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "portail_espacepublicitaire") {
                  key = PORTAIL_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      refClient: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "reponseapportee_instanceeservice"
                ) {
                  key = REPONSEAPPORTEE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonisteActionCitoyenne: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "conditionparticuliere_instanceeservice"
                ) {
                  key = CONDITIONPARTICULIERE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistes: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "rencontre_rencontre") {
                  key = RENCONTRE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "presence_representant_rencontre"
                ) {
                  key = PRESENCE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      refRepresentante: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "presence_rencontre") {
                  key = PRESENCE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "retour_rencontre") {
                  key = RETOUR_RENCONTRE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      refProtagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "cible_rencontre") {
                  key = CIBLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      listeProtagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "reclamation_reclamation") {
                  key = RECLAMATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceProtagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "mailing_mailing") {
                  key = MAILING_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "plainte_plainte") {
                  key = PLAINTE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "contrepartie_plainte_faveur"
                ) {
                  key = CONTREPARTIE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      enFaveurDe: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "contrepartie_plainte_aquitter"
                ) {
                  key = CONTREPARTIE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      aSacquitterPar: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "reaction_traitement") {
                  key = REACTION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceProtagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "candidature_candidature") {
                  key = CANDIDATURE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      candidats: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "candidature_candidature") {
                  key = CANDIDATURE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      appuyesParraines: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "instanceevaluation_candidature"
                ) {
                  key = INSTANCEEVALUATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      validateurs: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "stockage_gestionstock") {
                  key = STOCKAGE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "stock_gestionstock") {
                  key = STOCK_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "livraisoncommande_livraison"
                ) {
                  key = LIVRAISONCOMMANDE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      refClient: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "detailsoperationlivraison_livraison"
                ) {
                  key = DETAILSOPERATIONLIVRAISON_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      refFournisseur: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "livreur_livreur") {
                  key = LIVREUR_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      fournisseur: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "intervenant_maintenance") {
                  key = INTERVENANT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      refAssocie: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "projetmodelinstance_modelprojet"
                ) {
                  key = PROJETMODELINSTANCE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistePotentiel: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "organigramme_structureprofessionnelle"
                ) {
                  key = ORGANIGRAMME_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistePotentiel: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "rolespecifique_structureprofessionnelle"
                ) {
                  key = ROLESPECIFIQUE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistePotentiel: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "problemepertinence_gestionprobleme"
                ) {
                  key = PROBLEMEPERTINENCE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistesPotentiels: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "budget_budget") {
                  key = BUDGET_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      ptotagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "realisation_activite") {
                  key = REALISATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistes: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "livrables_activite") {
                  key = LIVRABLES_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistesPotentiels: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "actionentrepriseentrprendre_actionentrepriseentreprendre"
                ) {
                  key = ACTIONENTREPRISEENTRPRENDRE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistePotentiel: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "retour_gestionretour") {
                  key = RETOUR_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      refCLient: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "operationdelivraison_operationlogistique"
                ) {
                  key = OPERATIONDELIVRAISON_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      acteur: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "instancedocument_instancedocument"
                ) {
                  key = INSTANCEDOCUMENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagonistes: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                }

                //#region new archive bloc
                else if (
                  item.toLowerCase() ==
                  "installationetequipement_installationetequipement"
                ) {
                  key = INSTALLATIONETEQUIPEMENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceProtagoniste: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                }
                //#endregion new archive bloc

                //#region new archive bloc
                else if (item.toLowerCase() == "acteur_requete") {
                  key = ACTEUR_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      protagoniste: { $in: data[item].map((d) => d._id) },
                    },
                  };
                }
                //#endregion new archive bloc
                if (body) publishUpdate("update_items", itemRef, key, body);
              }
            }
          }
        }

        //#endregion new archive bloc

        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.documentsLegals)))],
          INSTANCEDOCUMENT_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.moment)))],
          MOMENTDUPROJET_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.etats)))],
          ETATOBJET_ADMIN_QUEUE,
          { operation: "$set", body: { etatObjet: "code-2" } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.opportinutes)))],
          PROBLEMEPERTINENCE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.risques)))],
          PROBLEMEPERTINENCE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.criteresConditions)))],
          INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.echangesCommunications)))],
          ECHANGECOMMUNICATION_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.incidents)))],
          PROBLEMEPERTINENCE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.elementsBudgets)))],
          BUDGET_ADMIN_QUEUE,
          { operation: "$pull", body: { ptotagoniste: this.getQuery()._id } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.activites)))],
          ACTIVITE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
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
          [...new Set(flatDeep(doc.map((d) => d.caracteristiques)))],
          INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.referentiels)))],
          REFERENTIELMODELEINSTANCEREFERENTIEL_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
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
          [...new Set(flatDeep(doc.map((d) => d.reglesActivations)))],
          REGLEVERSIONCLASSIQUE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.echangesEtCommunications)))],
          ECHANGECOMMUNICATION_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          doc.map((d) => d.acteurConcerne),
          ACTEURCONCERNE_ADMIN_QUEUE,
          { operation: "$set", body: { protagoniste: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.activites)))],
          ACTIVITE_ADMIN_QUEUE,
          { operation: "$pull", body: { protagonistes: this.getQuery()._id } }
        );

        communicateWithClient("postUpdateMany", this.getQuery());

        let participation = [];
        let autorisationAffichage = [];
        let roleEtMission = [];
        doc.map((d) => {
          participation.push(...d.participation.map((v) => v._id || v));
          autorisationAffichage.push(
            ...d.autorisationAffichage.map((v) => v._id || v)
          );
          roleEtMission.push(...d.roleEtMission.map((v) => v._id || v));
        });
        if (participation.length) {
          promises.push(
            ParticipationProtagoniste.updateMany(
              { _id: { $in: participation } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (autorisationAffichage.length) {
          promises.push(
            AutorisationAffichage.updateMany(
              { _id: { $in: autorisationAffichage } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (roleEtMission.length) {
          promises.push(
            RoleMission.updateMany(
              { _id: { $in: roleEtMission } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let participation = [];
        let relationInterneProtagoniste = [];
        let autorisationAffichage = [];
        let roleEtMission = [];

        doc.map((d) => {
          participation.push(...d.participation.map((v) => v._id || v));
          relationInterneProtagoniste.push(
            ...d.relationInterneProtagoniste.map((v) => v._id || v)
          );
          autorisationAffichage.push(
            ...d.autorisationAffichage.map((v) => v._id || v)
          );
          roleEtMission.push(...d.roleEtMission.map((v) => v._id || v));
        });
        if (participation.length) {
          promises.push(
            ParticipationProtagoniste.updateMany(
              { _id: { $in: participation } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (relationInterneProtagoniste.length) {
          promises.push(
            RelationInterProtagoniste.updateMany(
              { _id: { $in: relationInterneProtagoniste } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (autorisationAffichage.length) {
          promises.push(
            AutorisationAffichage.updateMany(
              { _id: { $in: autorisationAffichage } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (roleEtMission.length) {
          promises.push(
            RoleMission.updateMany(
              { _id: { $in: roleEtMission } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
      }

      if (this._update?.["$pull"]) {
        if (docs.modifiedCount && this._update?.["$pull"].opportinutes)
          publishUpdate(
            "update_items",
            this._update?.["$pull"].opportinutes,
            PROBLEMEPERTINENCE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (docs.modifiedCount && this._update?.["$pull"].risques)
          publishUpdate(
            "update_items",
            this._update?.["$pull"].risques,
            PROBLEMEPERTINENCE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (docs.modifiedCount && this._update?.["$pull"].incidents)
          publishUpdate(
            "update_items",
            this._update?.["$pull"].incidents,
            PROBLEMEPERTINENCE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (docs.modifiedCount && this._update?.["$pull"].elementsBudgets)
          publishUpdate(
            "update_items",
            this._update?.["$pull"].elementsBudgets,
            BUDGET_ADMIN_QUEUE,
            { operation: "$pull", body: { ptotagoniste: this.getQuery()._id } }
          );
        if (docs.modifiedCount && this._update?.["$pull"].activites)
          publishUpdate(
            "update_items",
            this._update?.["$pull"].activites,
            ACTIVITE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (docs.modifiedCount && this._update?.["$pull"].referentiels)
          publishUpdate(
            "update_items",
            this._update?.["$pull"].referentiels,
            REFERENTIELMODELEINSTANCEREFERENTIEL_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (docs.modifiedCount && this._update?.["$pull"].instructions)
          publishUpdate(
            "update_items",
            this._update?.["$pull"].instructions,
            INSTRUCTION_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsParent: { refObjet: this.getQuery()._id } },
            }
          );
        if (docs.modifiedCount && this._update?.["$pull"].activites)
          publishUpdate(
            "update_items",
            this._update?.["$pull"].activites,
            ACTIVITE_ADMIN_QUEUE,
            { operation: "$pull", body: { protagonistes: this.getQuery()._id } }
          );

        if (this._update?.["$pull"].objetsConcernes) {
          let body;
          let key;
          if (this._update?.["$pull"].objetsConcernes.typeObjet) {
            switch (
              this._update?.["$pull"].objetsConcernes.typeObjet.toLowerCase()
            ) {
              case "organigramme_structureprofessionnelle":
                key = ORGANIGRAMME_ADMIN_QUEUE;
                body = { protagonistePotentiel: this.getQuery()._id };
                break;
              case "operationdelivraison_operationlogistique":
                key = OPERATIONDELIVRAISON_ADMIN_QUEUE;
                body = { acteur: this.getQuery()._id };
                break;
              case "programmeevent_event":
                key = PROGRAMMEEVENT_ADMIN_QUEUE;
                body = { protagonistePotentiel: this.getQuery()._id };
                break;
              case "agendaevent_event":
                key = AGENDAEVENT_ADMIN_QUEUE;
                body = { protagonistePotentiel: this.getQuery()._id };
                break;
              case "mailing_mailing":
                key = MAILING_ADMIN_QUEUE;
                body = { protagoniste: this.getQuery()._id };
                break;
              case "rencontre_rencontre":
                key = RENCONTRE_ADMIN_QUEUE;
                body = { protagoniste: this.getQuery()._id };
                break;
              case "presence_representant_rencontre":
                key = PRESENCE_ADMIN_QUEUE;
                body = { refRepresentante: this.getQuery()._id };
                break;
              case "presence_rencontre":
                key = PRESENCE_ADMIN_QUEUE;
                body = { protagoniste: this.getQuery()._id };
                break;
              case "retour_rencontre":
                key = RETOUR_RENCONTRE_ADMIN_QUEUE;
                body = { refProtagoniste: this.getQuery()._id };
                break;
              case "reaction_traitement":
                key = REACTION_ADMIN_QUEUE;
                body = { instanceProtagoniste: this.getQuery()._id };
                break;
              case "donation_donnation":
                key = DONATION_ADMIN_QUEUE;
                body = { donateurs: this.getQuery()._id };
                break;
              case "reclamation_reclamation":
                key = RECLAMATION_ADMIN_QUEUE;
                body = { instanceProtagoniste: this.getQuery()._id };
                break;
              case "objectto_objectto":
                key = OBJECTTO_ADMIN_QUEUE;
                body = { protagonistes: this.getQuery()._id };
            }
          }
          if (body)
            publishUpdate(
              "update_items",
              this._update?.["$pull"].objetsConcernes.refObjet,
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
protagonistePotontielSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await protagonistePotontiel.find(this.getQuery()).lean();
    const promises = [];
    let participation = [];
    let autorisationAffichage = [];
    let roleEtMission = [];
    doc.map((d) => {
      participation.push(...d.participation.map((v) => v._id || v));
      autorisationAffichage.push(
        ...d.autorisationAffichage.map((v) => v._id || v)
      );
      roleEtMission.push(...d.roleEtMission.map((v) => v._id || v));
    });
    if (participation.length) {
      promises.push(
        ParticipationProtagoniste.deleteMany({
          _id: { $in: participation },
        }).exec()
      );
    }
    if (autorisationAffichage.length) {
      promises.push(
        AutorisationAffichage.deleteMany({
          _id: { $in: autorisationAffichage },
        }).exec()
      );
    }
    if (roleEtMission.length) {
      promises.push(
        RoleMission.deleteMany({ _id: { $in: roleEtMission } }).exec()
      );
    }

    if (promises.length) await Promise.all(promises);

    next();
  } catch (error) {
    next(error);
  }
});
async function communicateWithClient(methode, doc, prevState, targetState) {
  try {
    if (methode == "postUpdateMany" || doc?.etatProtagoniste) {
      switch (methode) {
        case "preFindOneAndUpdate":
          if (
            targetState &&
            targetState != "code_3417" &&
            prevState == "code_3417"
          ) {
            await PublishMessage(PROTAGONISTEPOTONTIEL_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatProtagoniste &&
            doc.etatProtagoniste == "code_3417"
          ) {
            await PublishMessage(PROTAGONISTEPOTONTIEL_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatProtagoniste == "code_3417") {
            await PublishMessage(PROTAGONISTEPOTONTIEL_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });

            if (doc?.participation?.length) {
              PublishParticipationProtagoniste(doc.participation);
            }
            if (doc?.relationInterneProtagoniste?.length) {
              PublishRelationInterProtagoniste(doc.relationInterneProtagoniste);
            }
            if (doc?.autorisationAffichage?.length) {
              PublishAutorisationAffichage(doc.autorisationAffichage);
            }
            if (doc?.roleEtMission?.length) {
              PublishRoleMission(doc.roleEtMission);
            }
          }
          if (doc.documentsLegals.length)
            publishUpdate(
              "publish_data",
              doc.documentsLegals,
              INSTANCEDOCUMENT_ADMIN_QUEUE
            );
          if (doc.moment.length)
            publishUpdate(
              "publish_data",
              doc.moment,
              MOMENTDUPROJET_ADMIN_QUEUE
            );
          if (doc.etats.length)
            if (doc.opportinutes.length)
              // publishUpdate("publish_data", doc.etats, ETATOBJET_ADMIN_QUEUE);
              publishUpdate(
                "publish_data",
                doc.opportinutes,
                PROBLEMEPERTINENCE_ADMIN_QUEUE
              );
          if (doc.risques.length)
            publishUpdate(
              "publish_data",
              doc.risques,
              PROBLEMEPERTINENCE_ADMIN_QUEUE
            );
          if (doc.criteresConditions.length)
            publishUpdate(
              "publish_data",
              doc.criteresConditions,
              INSTANCECARACTERISTIQUE_ADMIN_QUEUE
            );
          if (doc.echangesCommunications.length)
            publishUpdate(
              "publish_data",
              doc.echangesCommunications,
              ECHANGECOMMUNICATION_ADMIN_QUEUE
            );
          if (doc.incidents.length)
            publishUpdate(
              "publish_data",
              doc.incidents,
              PROBLEMEPERTINENCE_ADMIN_QUEUE
            );
          if (doc.elementsBudgets.length)
            publishUpdate(
              "publish_data",
              doc.elementsBudgets,
              BUDGET_ADMIN_QUEUE
            );
          if (doc.activites.length)
            publishUpdate("publish_data", doc.activites, ACTIVITE_ADMIN_QUEUE);
          if (doc.objetsAssocies.length)
            publishUpdate(
              "publish_data",
              doc.objetsAssocies,
              OBJETASSOCIEE_ADMIN_QUEUE
            );
          if (doc.caracteristiques.length)
            publishUpdate(
              "publish_data",
              doc.caracteristiques,
              INSTANCECARACTERISTIQUE_ADMIN_QUEUE
            );
          if (doc.referentiels.length)
            publishUpdate(
              "publish_data",
              doc.referentiels,
              REFERENTIELMODELEINSTANCEREFERENTIEL_ADMIN_QUEUE
            );
          if (doc.instructions.length)
            publishUpdate(
              "publish_data",
              doc.instructions,
              INSTRUCTION_ADMIN_QUEUE
            );
          if (doc.reglesActivations.length)
            publishUpdate(
              "publish_data",
              doc.reglesActivations,
              REGLEVERSIONCLASSIQUE_ADMIN_QUEUE
            );
          if (doc.echangesEtCommunications.length)
            publishUpdate(
              "publish_data",
              doc.echangesEtCommunications,
              ECHANGECOMMUNICATION_ADMIN_QUEUE
            );
          if (doc.acteurConcerne)
            publishUpdate(
              "publish_data",
              [doc.acteurConcerne],
              ACTEURCONCERNE_ADMIN_QUEUE
            );

          return;
        case "postUpdateMany":
          await PublishMessage(PROTAGONISTEPOTONTIEL_CLIENT_QUEUE, {
            operation: "REMOVE_ITEMS",
            data: { condition: doc },
          });

          return;

        case "publishData":
          return;

        case "translate":
          return;
      }
    }
  } catch (error) {
    console.error(
      "protagonistePotontiel communicateWithClient error==>",
      error
    );
  }
}
//add other hooks here
const protagonistePotontiel = mongoose.model(
  "protagonistePotontiel",
  protagonistePotontielSchema
);
module.exports = protagonistePotontiel;
const ParticipationProtagoniste = require("../models/participationProtagoniste.model");
const RelationInterProtagoniste = require("../models/relationInterProtagoniste.model");
const AutorisationAffichage = require("../models/autorisationAffichage.model");
const RoleMission = require("../models/roleMission.model");
const OrganisationConcernee = require("../models/organisationConcernee.model");
const PersonneConcernee = require("../models/personneConcernee.model");

const {
  PublishData: PublishParticipationProtagoniste,
} = require("./repositories/participationProtagoniste.repositorie");
const {
  PublishData: PublishRelationInterProtagoniste,
} = require("./repositories/relationInterProtagoniste.repositorie");
const {
  PublishData: PublishAutorisationAffichage,
} = require("./repositories/autorisationAffichage.repositorie");
const {
  PublishData: PublishRoleMission,
} = require("./repositories/roleMission.repositorie");

const { PublishMessage } = require("../helpers/communications");
const {
  publishUpdate,
  getDiffArray,
  sendRPCRequest,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");
const {
  ACTEUR_ADMIN_QUEUE,
  TAXONOMIE_ADMIN_RPC,

  INSTANCEDOCUMENT_ADMIN_RPC,
  MOMENTDUPROJET_ADMIN_RPC,
  ETATOBJET_ADMIN_RPC,
  PROBLEMEPERTINENCE_ADMIN_RPC,
  INSTANCECARACTERISTIQUE_ADMIN_RPC,
  ECHANGECOMMUNICATION_ADMIN_RPC,
  BUDGET_ADMIN_RPC,
  ACTIVITE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  REFERENTIELMODELEINSTANCEREFERENTIEL_ADMIN_RPC,
  INSTRUCTION_ADMIN_RPC,
  REGLEVERSIONCLASSIQUE_ADMIN_RPC,
  INSTALLATIONETEQUIPEMENT_ADMIN_QUEUE,
  INTERVENANT_ADMIN_QUEUE,
  PROBLEMEPERTINENCE_ADMIN_QUEUE,
  LIVREUR_ADMIN_QUEUE,
  DETAILSOPERATIONLIVRAISON_ADMIN_QUEUE,
  LIVRAISONCOMMANDE_ADMIN_QUEUE,
  STOCK_ADMIN_QUEUE,
  STOCKAGE_ADMIN_QUEUE,
  INSTANCEEVALUATION_ADMIN_QUEUE,
  CANDIDATURE_ADMIN_QUEUE,
  REACTION_ADMIN_QUEUE,
  CONTREPARTIE_ADMIN_QUEUE,
  PLAINTE_ADMIN_QUEUE,
  MAILING_ADMIN_QUEUE,
  RECLAMATION_ADMIN_QUEUE,
  CIBLE_ADMIN_QUEUE,
  RETOUR_ADMIN_QUEUE,
  PRESENCE_ADMIN_QUEUE,
  RENCONTRE_ADMIN_QUEUE,
  REPONSEAPPORTEE_ADMIN_QUEUE,
  PORTAIL_ADMIN_QUEUE,
  DONATION_ADMIN_QUEUE,
  PROTAGONISTEACTION_ADMIN_QUEUE,
  ENQUETE_ADMIN_QUEUE,
  SONDAGE_ADMIN_QUEUE,
  MEDAILLON_ADMIN_QUEUE,
  DOSSIER_ADMIN_QUEUE,
  LIVRABLES_ADMIN_QUEUE,
  OPERATIONDELIVRAISON_ADMIN_QUEUE,
  ACTIONENTREPRISEENTRPRENDRE_ADMIN_QUEUE,
  INSTANCEDOCUMENT_ADMIN_QUEUE,
  MOMENTDUPROJET_ADMIN_QUEUE,
  ETATOBJET_ADMIN_QUEUE,
  INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
  BUDGET_ADMIN_QUEUE,
  ACTIVITE_ADMIN_QUEUE,
  OBJETASSOCIEE_ADMIN_QUEUE,
  REFERENTIELMODELEINSTANCEREFERENTIEL_ADMIN_QUEUE,
  ECHANGECOMMUNICATION_ADMIN_QUEUE,
  INSTRUCTION_ADMIN_QUEUE,
  REGLEVERSIONCLASSIQUE_ADMIN_QUEUE,
  ACTEURCONCERNE_ADMIN_QUEUE,
  PROGRAMMEEVENT_ADMIN_QUEUE,
  ORGANIGRAMME_ADMIN_QUEUE,
  AGENDAEVENT_ADMIN_QUEUE,
  RETOUR_RENCONTRE_ADMIN_QUEUE,
  PRODUITSETVICE_ADMIN_RPC,
  DOMAIN_ADMIN_RPC,
  INSTANCECOORDONNEEGEO_ADMIN_RPC,
  INSTANCEOFFRE_ADMIN_RPC,
  OBJECTTO_ADMIN_QUEUE,
  LIVREUR_ADMIN_RPC,
} = require("../config");

const {
  ROLE_ADMIN_QUEUE,
  CONDITIONPARTICULIERE_ADMIN_QUEUE,
  PROJETMODELINSTANCE_ADMIN_QUEUE,
  ROLESPECIFIQUE_ADMIN_QUEUE,
  REALISATION_ADMIN_QUEUE,
  PROTAGONISTEPOTONTIEL_CLIENT_QUEUE,
} = require("../config");
