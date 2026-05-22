const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let instanceCaracteristiqueSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    groupe: {
      type: Schema.Types.ObjectId,
      ref: "groupeCaracteristique",
      required: true,
    },
    caracteristique: {
      type: Schema.Types.ObjectId,
      ref: "caracteristiqueDemandable",
    },
    valeur: [{ type: Schema.Types.ObjectId, ref: "valeurCaracteristique" }],
    translations: {
      type: [
        {
          language: { type: String },
          valeurChar: { type: String },
        },
      ],
    },
    valeurNotChar: { type: Object },
    unite: { type: Schema.Types.Mixed },
    operateur: { type: String },
    icone: { type: String },
    imageAssocie: { type: String },
    typeObjetConcerne: { type: String },
    refObjetConcerne: { type: ObjectId },
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [];
instanceCaracteristiqueSchema.pre("aggregate", function (next) {
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
instanceCaracteristiqueSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

//rewrite insertMany
instanceCaracteristiqueSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    this.populate(doc, populateField);

    let caracteristique = GroupBy(doc, "caracteristique");
    for (let item of Object.keys(caracteristique)) {
      if (item)
        await CaracteristiqueDemandable.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              instances: { $each: caracteristique[item].map((d) => d._id) },
            },
          }
        );
    }

    let data = /*updateGroupBy*/ GroupBy(doc, "typeObjetConcerne");
    for (let item of Object.keys(data)) {
      if (item) {
        let references = GroupBy(data[item], "refObjetConcerne");
        for (let itemRef of Object.keys(references)) {
          if (itemRef) {
            let body;
            let key = `${item.toUpperCase()}_PLACE2INVEST_ADMIN_KEY`;
            if (item.toLowerCase() == "acteurs_interview")
              body = {
                operation: "$addToSet",
                body: {
                  instancesCriters: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "conditionspecifique_demarcheprocedure"
            )
              body = {
                operation: "$addToSet",
                body: {
                  conditions: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            else if (item.toLowerCase() == "agendaevent_event_condition") {
              console.log("condition", item);
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  conditions: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "agendaevent_event") {
              console.log("event", item);
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceCarateristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "recompense_recompense")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "actioncitoyenne_actioncitoyenne")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "donation_donnation")
              body = {
                operation: "$addToSet",
                body: {
                  conditionsSpecifiques: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "offredonation_donnation")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "offre_operationtroc")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristiques: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "acteurspro_acteurprofessionel")
              body = {
                operation: "$addToSet",
                body: {
                  caracteristiques: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "eservice_e-service")
              body = {
                operation: "$addToSet",
                body: {
                  caracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "acteurprofessionnelassocie_e-service"
            )
              body = {
                operation: "$addToSet",
                body: {
                  caracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "conditionparticuliere_e-service")
              body = {
                operation: "$addToSet",
                body: {
                  conditions: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            else if (item.toLowerCase() == "instanceeservice_instanceeservice")
              body = {
                operation: "$addToSet",
                body: {
                  instancesCaracteristiques: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "conditionparticuliere_instanceeservice"
            )
              body = {
                operation: "$addToSet",
                body: {
                  conditions: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            else if (item.toLowerCase() == "cible_rencontre")
              body = {
                operation: "$addToSet",
                body: {
                  critere: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            else if (item.toLowerCase() == "reservation_reservation")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "reclamation_reclamation")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "elementplainte_plainte")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "annonce_annonceprofessionnelle")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristqie: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "lots_annonceprofessionnelle")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristqie: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "annonce_annonce")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "dossier_reponse")
              body = {
                operation: "$addToSet",
                body: {
                  critereCalcule: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "caracteristiqueproduit_produitsetvice"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() ==
              "actionassociealaregle_princingandmarketingrule"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "regleversionclassique_regleactivation"
            )
              body = {
                operation: "$addToSet",
                body: {
                  criteresConditions: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() ==
              "regleinclusionouexclusion_regleinclusionouexclusion"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "indicationtarifaire_indicationtarifaire"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "articlestock_gestionstock")
              body = {
                operation: "$addToSet",
                body: {
                  conditionStockage: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "stockage_gestionstock")
              body = {
                operation: "$addToSet",
                body: {
                  conditionStockage: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() ==
              "indicationfraisadditionnelle_indicationfraisadditionnelle"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "operationlivraison_livraison")
              body = {
                operation: "$addToSet",
                body: {
                  indicationLivraison: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "offrepromotionnelle_offrespromotionnelles"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "tarifspecial_tarifspecial")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() ==
              "transactioncommerciale_transactioncommerciale_autre"
            ) {
              key = TRANSACTIONCOMMERCIALE_ADMIN_QUEUE;

              body = {
                operation: "$addToSet",
                body: {
                  autreConditions: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() ==
              "transactioncommerciale_transactioncommerciale_condition"
            ) {
              key = TRANSACTIONCOMMERCIALE_ADMIN_QUEUE;

              body = {
                operation: "$addToSet",
                body: {
                  conditionDuPaiment: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "profil_segmentmarche")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "particularite_segmentmarche")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "donnee_donnee")
              body = {
                operation: "$addToSet",
                body: {
                  caracteristiques: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "gammeproduitouservice_gammeproduit")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritersConcurrent: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "produitassocie_gammeproduit")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritereConcurrent: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "reglementation_reglementation2")
              body = {
                operation: "$addToSet",
                body: {
                  critereAssocie: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "instanceindicateur_instanceindicateur"
            )
              body = {
                operation: "$addToSet",
                body: {
                  critereIndicateur: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "couverture_assurance")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "garantie_garantie")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "indicationfrais_garantie")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "instancegarantie_instancegarantie")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() ==
              "instancecouverturegarantie_instancegarantie"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instanceCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "constatdiagnostic_diagnosticsituation"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "diagnostiquesituation_diagnosticsituation"
            ) {
              key = DIAGNOSTIQUESITUATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "decisionaprendre_decision")
              body = {
                operation: "$addToSet",
                body: {
                  caracteristiqueDecision: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "grilledecision_decision")
              body = {
                operation: "$addToSet",
                body: {
                  caracteristiqueOUargument: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "instancegrilledecision_decision")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristiqueArgument: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "protagonistepotontiel_protagoniste_critere"
            ) {
              key = PROTAGONISTEPOTONTIEL_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  criteresConditions: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() ==
              "protagonistepotontiel_protagoniste_caracteristique"
            ) {
              key = PROTAGONISTEPOTONTIEL_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  caracteristiques: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "organisationconcernee_protagoniste"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instanseCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "personneconcernee_protagoniste")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "projetmodelinstance_modelprojet_instance"
            ) {
              key = PROJETMODELINSTANCE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "projetmodelinstance_modelprojet_critere"
            ) {
              key = PROJETMODELINSTANCE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  critereOuCondition: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "problemesolution_modelprojet")
              body = {
                operation: "$addToSet",
                body: {
                  instaceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "veillestrategique_modelprojet")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "pbsobjectifresultat_modelprojet_instance"
            ) {
              key = PBSOBJECTIFRESULTAT_ADMIN_QUEUE;

              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "pbsobjectifresultat_modelprojet_critere"
            ) {
              key = PBSOBJECTIFRESULTAT_ADMIN_QUEUE;

              body = {
                operation: "$addToSet",
                body: {
                  criteresOuConditions: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "objetreferentiel_referentiel")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "causeconsequenceprobleme_gestionprobleme"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instacesCaracteristiques: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "problemepertinence_gestionprobleme")
              body = {
                operation: "$addToSet",
                body: {
                  critereInstanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "budget_budget")
              body = {
                operation: "$addToSet",
                body: {
                  condition: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            else if (item.toLowerCase() == "indicateurlocauxregionaux_zones")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristiques: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "activite_activite")
              body = {
                operation: "$addToSet",
                body: {
                  creteresConditions: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "realisation_activite")
              body = {
                operation: "$addToSet",
                body: {
                  criteresConditions: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "livrables_activite")
              body = {
                operation: "$addToSet",
                body: {
                  criteresConditions: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() ==
              "actionentrepriseentrprendre_actionentrepriseentreprendre"
            )
              body = {
                operation: "$addToSet",
                body: {
                  critereOuCondition: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() ==
              "ressourcematerielle_instanceressourcematerielle"
            )
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristiques: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() ==
              "instanceressourcematerielle_instanceressourcematerielle"
            )
              body = {
                operation: "$addToSet",
                body: {
                  condition: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            else if (item.toLowerCase() == "instanceressourcematerielle") {
              key = INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristiqueDateOperation: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "instanceressourcematerielle_critere"
            ) {
              key = INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  critereCondition: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "operationassociee_operationassociee"
            )
              body = {
                operation: "$addToSet",
                body: {
                  critereCondition: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() == "rubriqueinstancecontrat_instancecontrat"
            )
              body = {
                operation: "$addToSet",
                body: {
                  criteres: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            else if (item.toLowerCase() == "rubriquecontrat_modelcontrat")
              body = {
                operation: "$addToSet",
                body: {
                  critere: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            else if (item.toLowerCase() == "ressourcehumaine_ressourcehumaine")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "fonctionmission_ressourcehumaine")
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "retour_gestionretour")
              body = {
                operation: "$addToSet",
                body: {
                  refInstaceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "analysesituation_gestionretour")
              body = {
                operation: "$addToSet",
                body: {
                  refInstanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (item.toLowerCase() == "sav_sav")
              body = {
                operation: "$addToSet",
                body: {
                  conditionAssociee: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            else if (
              item.toLowerCase() ==
              "grilletarifaireservice_servicesassociesinternes"
            )
              body = {
                operation: "$addToSet",
                body: {
                  criteres: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            else if (item.toLowerCase() == "lieuconcerne_lieuconcerne")
              body = {
                operation: "$addToSet",
                body: {
                  instancesCaracteristiques: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            //#region new insertMany bloc
            else if (
              item.toLowerCase() == "structureimmoouentrepot_structurephysique"
            ) {
              key = STRUCTUREIMMOOUENTREPOT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "element_structurephysique") {
              key = ELEMENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() ==
              "installationetequipement_installationetequipement"
            ) {
              key = INSTALLATIONETEQUIPEMENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceCaracteristique: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "conditionspecifique_conditionspecifique"
            ) {
              key = CONDITIONSPECIFIQUE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  conditionetCritere: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "objectto_objectto") {
              key = OBJECTTO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  caracteristique: {
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

    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// hooks
let prevState = null;
//refactor bloc for distantRequest
/*new*/ //refactor bloc for distantRequest
/*new20*/ async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["unite"],
                "VIEW_ITEMS",
                {}
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["unite"],
                "VIEW_ITEMS",
                {}
              ),
            ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["unite"])
              d["unite"] =
                result[0].find(
                  (item) => item._id == (d["unite"]._id || d["unite"])
                ) || d["unite"];
          });
        } else {
          if (doc["unite"])
            doc["unite"] =
              result[0].find(
                (item) => item._id == (doc["unite"]._id || doc["unite"])
              ) || doc["unite"];
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
instanceCaracteristiqueSchema.post(/find.*|save/, async function (doc, next) {
  try {
    if (doc) await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

instanceCaracteristiqueSchema.post("save", async function (doc, next) {
  try {
    if (this.caracteristique) {
      await CaracteristiqueDemandable.updateOne(
        { _id: this.caracteristique.toString() },
        { $addToSet: { instances: this._id } }
      );
    }

    if (doc.typeObjetConcerne == "ACTEURS_INTERVIEW" && doc.refObjetConcerne)
      publishUpdate("update_items", doc.refObjetConcerne, ACTEURS_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { instancesCriters: doc._id },
      });
    if (
      doc.typeObjetConcerne == "COMPLEMENT_DEMARCHEPROCEDURE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        [doc.refObjetConcerne],
        COMPLEMENT_ADMIN_QUEUE,
        { operation: "$set", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "CONDITIONSPECIFIQUE_DEMARCHEPROCEDURE" &&
      doc.refObjetConcerne
    ) {
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        CONDITIONSPECIFIQUE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { conditions: doc._id } }
      );
    }
    if (
      doc.typeObjetConcerne == "AGENDAEVENT_EVENT_CONDITION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        AGENDAEVENT_ADMIN_QUEUE,
        { operation: "$addToSet", body: { conditions: doc._id } }
      );
    if (doc.typeObjetConcerne == "AGENDAEVENT_EVENT" && doc.refObjetConcerne)
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        AGENDAEVENT_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCarateristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "RECOMPENSE_RECOMPENSE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        RECOMPENSE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "ACTIONCITOYENNE_ACTIONCITOYENNE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ACTIONCITOYENNE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (doc.typeObjetConcerne == "DONATION_DONNATION" && doc.refObjetConcerne)
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        DONATION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { conditionsSpecifiques: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "OFFREDONATION_DONNATION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        OFFREDONATION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (doc.typeObjetConcerne == "OFFRE_OPERATIONTROC" && doc.refObjetConcerne)
      publishUpdate("update_items", doc.refObjetConcerne, OFFRE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { instanceCaracteristiques: doc._id },
      });
    if (
      doc.typeObjetConcerne == "ACTEURSPRO_ACTEURPROFESSIONEL" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ACTEURSPRO_ADMIN_QUEUE,
        { operation: "$addToSet", body: { caracteristiques: doc._id } }
      );
    if (doc.typeObjetConcerne == "ESERVICE_E-SERVICE" && doc.refObjetConcerne)
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ESERVICE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { caracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "ACTEURPROFESSIONNELASSOCIE_E-SERVICE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ACTEURPROFESSIONNELASSOCIE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { caracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "CONDITIONPARTICULIERE_E-SERVICE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        CONDITIONPARTICULIERE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { conditions: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "INSTANCEESERVICE_INSTANCEESERVICE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INSTANCEESERVICE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instancesCaracteristiques: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "CONDITIONPARTICULIERE_INSTANCEESERVICE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        CONDITIONPARTICULIERE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { conditions: doc._id } }
      );
    if (doc.typeObjetConcerne == "CIBLE_RENCONTRE" && doc.refObjetConcerne)
      publishUpdate("update_items", doc.refObjetConcerne, CIBLE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { critere: doc._id },
      });
    if (
      doc.typeObjetConcerne == "RESERVATION_RESERVATION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        RESERVATION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "RECLAMATION_RECLAMATION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        RECLAMATION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "ELEMENTPLAINTE_PLAINTE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ELEMENTPLAINTE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "ANNONCE_ANNONCEPROFESSIONNELLE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ANNONCEPROFESSIONNELLE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: { instanceCaracteristqie: doc._id },
        }
      );
    if (
      doc.typeObjetConcerne == "LOTS_ANNONCEPROFESSIONNELLE" &&
      doc.refObjetConcerne
    )
      publishUpdate("update_items", doc.refObjetConcerne, LOTS_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { instanceCaracteristqie: doc._id },
      });
    if (doc.typeObjetConcerne == "ANNONCE_ANNONCE" && doc.refObjetConcerne)
      publishUpdate("update_items", doc.refObjetConcerne, ANNONCE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { instanceCaracteristique: doc._id },
      });
    if (doc.typeObjetConcerne == "DOSSIER_REPONSE" && doc.refObjetConcerne)
      publishUpdate("update_items", doc.refObjetConcerne, DOSSIER_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { critereCalcule: doc._id },
      });
    if (
      doc.typeObjetConcerne == "CARACTERISTIQUEPRODUIT_PRODUITSETVICE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        CARACTERISTIQUEPRODUIT_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne ==
        "ACTIONASSOCIEALAREGLE_PRINCINGANDMARKETINGRULE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ACTIONASSOCIEALAREGLE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "REGLEVERSIONCLASSIQUE_REGLEACTIVATION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        REGLEVERSIONCLASSIQUE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { criteresConditions: doc._id } }
      );
    if (
      doc.typeObjetConcerne ==
        "REGLEINCLUSIONOUEXCLUSION_REGLEINCLUSIONOUEXCLUSION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        REGLEINCLUSIONOUEXCLUSION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "INDICATIONTARIFAIRE_INDICATIONTARIFAIRE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INDICATIONTARIFAIRE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "ARTICLESTOCK_GESTIONSTOCK" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ARTICLESTOCK_ADMIN_QUEUE,
        { operation: "$addToSet", body: { conditionStockage: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "STOCKAGE_GESTIONSTOCK" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        STOCKAGE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { conditionStockage: doc._id } }
      );
    if (
      doc.typeObjetConcerne ==
        "INDICATIONFRAISADDITIONNELLE_INDICATIONFRAISADDITIONNELLE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INDICATIONFRAISADDITIONNELLE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "OPERATIONLIVRAISON_LIVRAISON" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        OPERATIONLIVRAISON_ADMIN_QUEUE,
        { operation: "$addToSet", body: { indicationLivraison: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "OFFREPROMOTIONNELLE_OFFRESPROMOTIONNELLES" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        OFFREPROMOTIONNELLE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "TARIFSPECIAL_TARIFSPECIAL" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        TARIFSPECIAL_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne ==
        "TRANSACTIONCOMMERCIALE_TRANSACTIONCOMMERCIALE_AUTRE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        TRANSACTIONCOMMERCIALE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { autreConditions: doc._id } }
      );
    if (
      doc.typeObjetConcerne ==
        "TRANSACTIONCOMMERCIALE_TRANSACTIONCOMMERCIALE_CONDITION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        TRANSACTIONCOMMERCIALE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { conditionDuPaiment: doc._id } }
      );
    if (doc.typeObjetConcerne == "PROFIL_SEGMENTMARCHE" && doc.refObjetConcerne)
      publishUpdate("update_items", doc.refObjetConcerne, PROFIL_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { instanceCritere: doc._id },
      });
    if (
      doc.typeObjetConcerne == "PARTICULARITE_SEGMENTMARCHE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PARTICULARITE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (doc.typeObjetConcerne == "DONNEE_DONNEE" && doc.refObjetConcerne)
      publishUpdate("update_items", doc.refObjetConcerne, DONNEE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { caracteristiques: doc._id },
      });
    if (
      doc.typeObjetConcerne == "GAMMEPRODUITOUSERVICE_GAMMEPRODUIT" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        GAMMEPRODUITOUSERVICE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritersConcurrent: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "PRODUITASSOCIE_GAMMEPRODUIT" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PRODUITASSOCIE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritereConcurrent: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "REGLEMENTATION_REGLEMENTATION2" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        REGLEMENTATION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { critereAssocie: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "INSTANCEINDICATEUR_INSTANCEINDICATEUR" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INSTANCEINDICATEUR_ADMIN_QUEUE,
        { operation: "$addToSet", body: { critereIndicateur: doc._id } }
      );
    if (doc.typeObjetConcerne == "COUVERTURE_ASSURANCE" && doc.refObjetConcerne)
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        COUVERTURE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (doc.typeObjetConcerne == "GARANTIE_GARANTIE" && doc.refObjetConcerne)
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        GARANTIE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "INDICATIONFRAIS_GARANTIE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INDICATIONFRAIS_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "INSTANCEGARANTIE_INSTANCEGARANTIE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INSTANCEGARANTIE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "INSTANCECOUVERTUREGARANTIE_INSTANCEGARANTIE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INSTANCECOUVERTUREGARANTIE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCritere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "CONSTATDIAGNOSTIC_DIAGNOSTICSITUATION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        CONSTATDIAGNOSTIC_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "DIAGNOSTIQUESITUATION_DIAGNOSTICSITUATION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        DIAGNOSTIQUESITUATION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );

    if (
      doc.typeObjetConcerne == "DECISIONAPRENDRE_DECISION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        DECISIONAPRENDRE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { caracteristiqueDecision: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "GRILLEDECISION_DECISION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        GRILLEDECISION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { caracteristiqueOUargument: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "INSTANCEGRILLEDECISION_DECISION" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INSTANCEGRILLEDECISION_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: { instanceCaracteristiqueArgument: doc._id },
        }
      );
    if (
      doc.typeObjetConcerne == "PROTAGONISTEPOTONTIEL_PROTAGONISTE_CRITERE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
        { operation: "$addToSet", body: { criteresConditions: doc._id } }
      );
    if (
      doc.typeObjetConcerne ==
        "PROTAGONISTEPOTONTIEL_PROTAGONISTE_CARACTERISTIQUE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
        { operation: "$addToSet", body: { caracteristiques: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "ORGANISATIONCONCERNEE_PROTAGONISTE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ORGANISATIONCONCERNEE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanseCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "PERSONNECONCERNEE_PROTAGONISTE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PERSONNECONCERNEE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "PROJETMODELINSTANCE_MODELPROJET_INSTANCE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PROJETMODELINSTANCE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "PROJETMODELINSTANCE_MODELPROJET_CRITERE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PROJETMODELINSTANCE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { critereOuCondition: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "PROBLEMESOLUTION_MODELPROJET" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PROBLEMESOLUTION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instaceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "VEILLESTRATEGIQUE_MODELPROJET" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        VEILLESTRATEGIQUE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "PBSOBJECTIFRESULTAT_MODELPROJET_INSTANCE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PBSOBJECTIFRESULTAT_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "PBSOBJECTIFRESULTAT_MODELPROJET_CRITERE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PBSOBJECTIFRESULTAT_ADMIN_QUEUE,
        { operation: "$addToSet", body: { criteresOuConditions: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "OBJETREFERENTIEL_REFERENTIEL" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        OBJETREFERENTIEL_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "PENALITECOMPLEMENT_REFERENTIEL" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        [doc.refObjetConcerne],
        PENALITECOMPLEMENT_ADMIN_QUEUE,
        { operation: "$set", body: { critere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "CRITEREINDICATIONTARIFAIRE_REFERENTIEL" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        [doc.refObjetConcerne],
        CRITEREINDICATIONTARIFAIRE_ADMIN_QUEUE,
        { operation: "$set", body: { critere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "CAUSECONSEQUENCEPROBLEME_GESTIONPROBLEME" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        CAUSECONSEQUENCEPROBLEME_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instacesCaracteristiques: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "PROBLEMEPERTINENCE_GESTIONPROBLEME" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        PROBLEMEPERTINENCE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: { critereInstanceCaracteristique: doc._id },
        }
      );
    if (doc.typeObjetConcerne == "BUDGET_BUDGET" && doc.refObjetConcerne)
      publishUpdate("update_items", doc.refObjetConcerne, BUDGET_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { condition: doc._id },
      });
    if (
      doc.typeObjetConcerne == "INDICATEURLOCAUXREGIONAUX_ZONES" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INDICATEURLOCAUXREGIONAUX_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristiques: doc._id } }
      );
    if (doc.typeObjetConcerne == "ACTIVITE_ACTIVITE" && doc.refObjetConcerne)
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ACTIVITE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { creteresConditions: doc._id } }
      );
    if (doc.typeObjetConcerne == "REALISATION_ACTIVITE" && doc.refObjetConcerne)
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        REALISATION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { criteresConditions: doc._id } }
      );
    if (doc.typeObjetConcerne == "LIVRABLES_ACTIVITE" && doc.refObjetConcerne)
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        LIVRABLES_ADMIN_QUEUE,
        { operation: "$addToSet", body: { criteresConditions: doc._id } }
      );
    if (
      doc.typeObjetConcerne ==
        "ACTIONENTREPRISEENTRPRENDRE_ACTIONENTREPRISEENTREPRENDRE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ACTIONENTREPRISEENTRPRENDRE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { critereOuCondition: doc._id } }
      );
    if (
      doc.typeObjetConcerne ==
        "RESSOURCEMATERIELLE_INSTANCERESSOURCEMATERIELLE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        RESSOURCEMATERIELLE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristiques: doc._id } }
      );
    if (
      doc.typeObjetConcerne ==
        "INSTANCERESSOURCEMATERIELLE_INSTANCERESSOURCEMATERIELLE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { condition: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "INSTANCERESSOURCEMATERIELLE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: { instanceCaracteristiqueDateOperation: doc._id },
        }
      );
    if (
      doc.typeObjetConcerne == "INSTANCERESSOURCEMATERIELLE_CRITERE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { critereCondition: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "OPERATIONASSOCIEE_OPERATIONASSOCIEE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        OPERATIONASSOCIEE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { critereCondition: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "RUBRIQUEINSTANCECONTRAT_INSTANCECONTRAT" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        RUBRIQUEINSTANCECONTRAT_ADMIN_QUEUE,
        { operation: "$addToSet", body: { criteres: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "RUBRIQUECONTRAT_MODELCONTRAT" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        RUBRIQUECONTRAT_ADMIN_QUEUE,
        { operation: "$addToSet", body: { critere: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "RESSOURCEHUMAINE_RESSOURCEHUMAINE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        RESSOURCEHUMAINE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "FONCTIONMISSION_RESSOURCEHUMAINE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        FONCTIONMISSION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    if (doc.typeObjetConcerne == "RETOUR_GESTIONRETOUR" && doc.refObjetConcerne)
      publishUpdate("update_items", doc.refObjetConcerne, RETOUR_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { refInstaceCaracteristique: doc._id },
      });
    if (
      doc.typeObjetConcerne == "ANALYSESITUATION_GESTIONRETOUR" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        ANALYSESITUATION_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: { refInstanceCaracteristique: doc._id },
        }
      );
    if (doc.typeObjetConcerne == "SAV_SAV" && doc.refObjetConcerne)
      publishUpdate("update_items", doc.refObjetConcerne, SAV_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { conditionAssociee: doc._id },
      });
    if (
      doc.typeObjetConcerne ==
        "GRILLETARIFAIRESERVICE_SERVICESASSOCIESINTERNES" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        GRILLETARIFAIRESERVICE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { criteres: doc._id } }
      );
    if (
      doc.typeObjetConcerne == "LIEUCONCERNE_LIEUCONCERNE" &&
      doc.refObjetConcerne
    )
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        LIEUCONCERNE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instancesCaracteristiques: doc._id } }
      );

    //#region new insertMany bloc
    if (
      doc.refObjetConcerne &&
      doc.typeObjetConcerne.toLowerCase() ==
        "structureimmoouentrepot_structurephysique"
    ) {
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        STRUCTUREIMMOOUENTREPOT_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    }
    if (
      doc.refObjetConcerne &&
      doc.typeObjetConcerne.toLowerCase() == "element_structurephysique"
    ) {
      publishUpdate("update_items", doc.refObjetConcerne, ELEMENT_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { instanceCaracteristique: doc._id },
      });
    }
    if (
      doc.refObjetConcerne &&
      doc.typeObjetConcerne.toLowerCase() ==
        "installationetequipement_installationetequipement"
    ) {
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        INSTALLATIONETEQUIPEMENT_ADMIN_QUEUE,
        { operation: "$addToSet", body: { instanceCaracteristique: doc._id } }
      );
    }
    if (
      doc.refObjetConcerne &&
      doc.typeObjetConcerne.toLowerCase() ==
        "conditionspecifique_conditionspecifique"
    ) {
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        CONDITIONSPECIFIQUE_ADMIN_QUEUE,
        { operation: "$addToSet", body: { conditionetCritere: doc._id } }
      );
    } else if (
      doc.refObjetConcerne &&
      doc.typeObjetConcerne.toLowerCase() == "objectto_objectto"
    ) {
      publishUpdate(
        "update_items",
        doc.refObjetConcerne,
        OBJECTTO_ADMIN_QUEUE,
        { operation: "$addToSet", body: { caracteristique: doc._id } }
      );
    }
    //#endregion new insertMany bloc

    next();
  } catch (error) {
    next(error);
  }
});

let itemToCheck = {};

instanceCaracteristiqueSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await instanceCaracteristique.findOne(this.getQuery()).lean();

    if (doc) {
      itemToCheck["refObjetConcerne"] = doc.refObjetConcerne;
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const caracteristiqueId = this._update?.["$set"]?.caracteristique;
      if (
        doc?.caracteristique != caracteristiqueId &&
        doc?.caracteristique != undefined
      ) {
        await CaracteristiqueDemandable.updateOne(
          { _id: doc.caracteristique.toString() },
          { $pull: { instances: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
instanceCaracteristiqueSchema.post(
  "findOneAndUpdate",
  async function (doc, next) {
    try {
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ACTEURS_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instancesCriters: doc._id },
          bodyPush: { instancesCriters: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: [itemToCheck["refObjetConcerne"]],
          newData: [doc.refObjetConcerne],
        },
        COMPLEMENT_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { etatObjet: "code-2" },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        CONDITIONSPECIFIQUE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { conditions: doc._id },
          bodyPush: { conditions: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        AGENDAEVENT_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { conditions: doc._id },
          bodyPush: { conditions: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        AGENDAEVENT_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCarateristique: doc._id },
          bodyPush: { instanceCarateristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        RECOMPENSE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ACTIONCITOYENNE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        DONATION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { conditionsSpecifiques: doc._id },
          bodyPush: { conditionsSpecifiques: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        OFFREDONATION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        OFFRE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristiques: doc._id },
          bodyPush: { instanceCaracteristiques: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ACTEURSPRO_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { caracteristiques: doc._id },
          bodyPush: { caracteristiques: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ESERVICE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { caracteristique: doc._id },
          bodyPush: { caracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ACTEURPROFESSIONNELASSOCIE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { caracteristique: doc._id },
          bodyPush: { caracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        CONDITIONPARTICULIERE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { conditions: doc._id },
          bodyPush: { conditions: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INSTANCEESERVICE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instancesCaracteristiques: doc._id },
          bodyPush: { instancesCaracteristiques: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        CIBLE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { critere: doc._id },
          bodyPush: { critere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        RESERVATION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        RECLAMATION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ELEMENTPLAINTE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ANNONCEPROFESSIONNELLE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristqie: doc._id },
          bodyPush: { instanceCaracteristqie: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        LOTS_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristqie: doc._id },
          bodyPush: { instanceCaracteristqie: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ANNONCE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        DOSSIER_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { critereCalcule: doc._id },
          bodyPush: { critereCalcule: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        CARACTERISTIQUEPRODUIT_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ACTIONASSOCIEALAREGLE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        REGLEVERSIONCLASSIQUE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { criteresConditions: doc._id },
          bodyPush: { criteresConditions: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        REGLEINCLUSIONOUEXCLUSION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INDICATIONTARIFAIRE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ARTICLESTOCK_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { conditionStockage: doc._id },
          bodyPush: { conditionStockage: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        STOCKAGE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { conditionStockage: doc._id },
          bodyPush: { conditionStockage: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INDICATIONFRAISADDITIONNELLE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        OPERATIONLIVRAISON_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { indicationLivraison: doc._id },
          bodyPush: { indicationLivraison: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        OFFREPROMOTIONNELLE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        TARIFSPECIAL_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        TRANSACTIONCOMMERCIALE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { autreConditions: doc._id },
          bodyPush: { autreConditions: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        TRANSACTIONCOMMERCIALE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { conditionDuPaiment: doc._id },
          bodyPush: { conditionDuPaiment: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PROFIL_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PARTICULARITE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        DONNEE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { caracteristiques: doc._id },
          bodyPush: { caracteristiques: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        GAMMEPRODUITOUSERVICE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritersConcurrent: doc._id },
          bodyPush: { instanceCritersConcurrent: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PRODUITASSOCIE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritereConcurrent: doc._id },
          bodyPush: { instanceCritereConcurrent: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        REGLEMENTATION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { critereAssocie: doc._id },
          bodyPush: { critereAssocie: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INSTANCEINDICATEUR_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { critereIndicateur: doc._id },
          bodyPush: { critereIndicateur: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        COUVERTURE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        GARANTIE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INDICATIONFRAIS_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INSTANCEGARANTIE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INSTANCECOUVERTUREGARANTIE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCritere: doc._id },
          bodyPush: { instanceCritere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        CONSTATDIAGNOSTIC_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        DECISIONAPRENDRE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { caracteristiqueDecision: doc._id },
          bodyPush: { caracteristiqueDecision: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        GRILLEDECISION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { caracteristiqueOUargument: doc._id },
          bodyPush: { caracteristiqueOUargument: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INSTANCEGRILLEDECISION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristiqueArgument: doc._id },
          bodyPush: { instanceCaracteristiqueArgument: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { criteresConditions: doc._id },
          bodyPush: { criteresConditions: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { caracteristiques: doc._id },
          bodyPush: { caracteristiques: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ORGANISATIONCONCERNEE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanseCaracteristique: doc._id },
          bodyPush: { instanseCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PERSONNECONCERNEE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PROJETMODELINSTANCE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PROJETMODELINSTANCE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { critereOuCondition: doc._id },
          bodyPush: { critereOuCondition: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PROBLEMESOLUTION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instaceCaracteristique: doc._id },
          bodyPush: { instaceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        VEILLESTRATEGIQUE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PBSOBJECTIFRESULTAT_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PBSOBJECTIFRESULTAT_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { criteresOuConditions: doc._id },
          bodyPush: { criteresOuConditions: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        OBJETREFERENTIEL_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: [itemToCheck["refObjetConcerne"]],
          newData: [doc.refObjetConcerne],
        },
        PENALITECOMPLEMENT_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { etatObjet: "code-2" },
          bodyPush: { critere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: [itemToCheck["refObjetConcerne"]],
          newData: [doc.refObjetConcerne],
        },
        CRITEREINDICATIONTARIFAIRE_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { etatObjet: "code-2" },
          bodyPush: { critere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        CAUSECONSEQUENCEPROBLEME_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instacesCaracteristiques: doc._id },
          bodyPush: { instacesCaracteristiques: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        PROBLEMEPERTINENCE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { critereInstanceCaracteristique: doc._id },
          bodyPush: { critereInstanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        BUDGET_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { condition: doc._id },
          bodyPush: { condition: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INDICATEURLOCAUXREGIONAUX_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristiques: doc._id },
          bodyPush: { instanceCaracteristiques: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ACTIVITE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { creteresConditions: doc._id },
          bodyPush: { creteresConditions: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        REALISATION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { criteresConditions: doc._id },
          bodyPush: { criteresConditions: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        LIVRABLES_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { criteresConditions: doc._id },
          bodyPush: { criteresConditions: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ACTIONENTREPRISEENTRPRENDRE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { critereOuCondition: doc._id },
          bodyPush: { critereOuCondition: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        RESSOURCEMATERIELLE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristiques: doc._id },
          bodyPush: { instanceCaracteristiques: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { condition: doc._id },
          bodyPush: { condition: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristiqueDateOperation: doc._id },
          bodyPush: { instanceCaracteristiqueDateOperation: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { critereCondition: doc._id },
          bodyPush: { critereCondition: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        OPERATIONASSOCIEE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { critereCondition: doc._id },
          bodyPush: { critereCondition: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        RUBRIQUEINSTANCECONTRAT_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { criteres: doc._id },
          bodyPush: { criteres: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        RUBRIQUECONTRAT_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { critere: doc._id },
          bodyPush: { critere: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        RESSOURCEHUMAINE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        FONCTIONMISSION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceCaracteristique: doc._id },
          bodyPush: { instanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        RETOUR_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { refInstaceCaracteristique: doc._id },
          bodyPush: { refInstaceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        ANALYSESITUATION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { refInstanceCaracteristique: doc._id },
          bodyPush: { refInstanceCaracteristique: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        SAV_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { conditionAssociee: doc._id },
          bodyPush: { conditionAssociee: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        GRILLETARIFAIRESERVICE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { criteres: doc._id },
          bodyPush: { criteres: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        LIEUCONCERNE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instancesCaracteristiques: doc._id },
          bodyPush: { instancesCaracteristiques: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["refObjetConcerne"],
          newData: doc.refObjetConcerne,
        },
        OBJECTTO_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { caracteristique: doc._id },
          bodyPush: { caracteristique: doc._id },
        }
      );
      communicateWithClient("postFindOneAndUpdate", doc, prevState);
      if (doc.caracteristique) {
        await CaracteristiqueDemandable.updateOne(
          { _id: doc.caracteristique?._id?.toString() || doc.caracteristique },
          { $addToSet: { instances: doc._id } }
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  }
);
instanceCaracteristiqueSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      if (this._update?.["$addToSet"]?.objetsConcernes && docs.modifiedCount) {
        let body;
        switch (this._update?.["$addToSet"]?.objetsConcernes.typeObjet) {
          case "PBSOBJECTIFRESULTAT_MODELPROJET_INSTANCE":
            classe = PBSOBJECTIFRESULTAT_ADMIN_QUEUE;

            body = {
              operation: "$addToSet",
              body: {
                instanceCaracteristique: { $each: this.getQuery()._id["$in"] },
              },
            };
            break;
          case "PBSOBJECTIFRESULTAT_MODELPROJET_CRITERE":
            classe = PBSOBJECTIFRESULTAT_ADMIN_QUEUE;

            body = {
              operation: "$addToSet",
              body: {
                criteresOuConditions: { $each: this.getQuery()._id["$in"] },
              },
            };
            break;

          case "ELEMENTPLAINTE_PLAINTE":
            classe = ELEMENTPLAINTE_ADMIN_QUEUE;

            body = {
              operation: "$addToSet",
              body: {
                instanceCaracteristique: { $each: this.getQuery()._id["$in"] },
              },
            };
            break;

          case "RESERVATION_RESERVATION":
            classe = RESERVATION_ADMIN_QUEUE;

            body = {
              operation: "$addToSet",
              body: {
                instanceCritere: { $each: this.getQuery()._id["$in"] },
              },
            };
            break;
          case "OBJECTTO_OBJECTTO":
            classe = OBJECTTO_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: {
                caracteristique: { $each: this.getQuery()._id["$in"] },
              },
            };
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
      let doc = await instanceCaracteristique.find(this.getQuery()).lean();
      const promises = [];
      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          doc.map((d) => d.refObjetConcerne),
          COMPLEMENT_ADMIN_QUEUE,
          { operation: "$set", body: { instanceCaracteristique: null } }
        );
        publishUpdate(
          "update_items",
          doc.map((d) => d.refObjetConcerne),
          PENALITECOMPLEMENT_ADMIN_QUEUE,
          { operation: "$set", body: { critere: null } }
        );
        publishUpdate(
          "update_items",
          doc.map((d) => d.refObjetConcerne),
          CRITEREINDICATIONTARIFAIRE_ADMIN_QUEUE,
          { operation: "$set", body: { critere: null } }
        );

        let typeObjetConcerne = /*updateGroupByUpdateMany*/ GroupBy(
          doc,
          "typeObjetConcerne"
        );
        for (let item of Object.keys(typeObjetConcerne)) {
          if (item) {
            let references = GroupBy(
              typeObjetConcerne[item],
              "refObjetConcerne"
            );
            for (let itemRef of Object.keys(references)) {
              if (itemRef) {
                let key, body;
                if (item.toLowerCase() == "acteurs_interview") {
                  key = ACTEURS_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instancesCriters: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "conditionspecifique_demarcheprocedure"
                ) {
                  key = CONDITIONSPECIFIQUE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      conditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "agendaevent_event_condition"
                ) {
                  key = AGENDAEVENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      conditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "agendaevent_event") {
                  key = AGENDAEVENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCarateristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "recompense_recompense") {
                  key = RECOMPENSE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "actioncitoyenne_actioncitoyenne"
                ) {
                  key = ACTIONCITOYENNE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "donation_donnation") {
                  key = DONATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      conditionsSpecifiques: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "offredonation_donnation") {
                  key = OFFREDONATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "offre_operationtroc") {
                  key = OFFRE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristiques: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "acteurspro_acteurprofessionel"
                ) {
                  key = ACTEURSPRO_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      caracteristiques: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "eservice_e-service") {
                  key = ESERVICE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      caracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "acteurprofessionnelassocie_e-service"
                ) {
                  key = ACTEURPROFESSIONNELASSOCIE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      caracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "conditionparticuliere_e-service"
                ) {
                  key = CONDITIONPARTICULIERE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      conditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "instanceeservice_instanceeservice"
                ) {
                  key = INSTANCEESERVICE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instancesCaracteristiques: {
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
                      conditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "cible_rencontre") {
                  key = CIBLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      critere: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "reservation_reservation") {
                  key = RESERVATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "reclamation_reclamation") {
                  key = RECLAMATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "elementplainte_plainte") {
                  key = ELEMENTPLAINTE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "annonce_annonceprofessionnelle"
                ) {
                  key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristqie: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "lots_annonceprofessionnelle"
                ) {
                  key = LOTS_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristqie: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "annonce_annonce") {
                  key = ANNONCE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "dossier_reponse") {
                  key = DOSSIER_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      critereCalcule: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "caracteristiqueproduit_produitsetvice"
                ) {
                  key = CARACTERISTIQUEPRODUIT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "actionassociealaregle_princingandmarketingrule"
                ) {
                  key = ACTIONASSOCIEALAREGLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "regleversionclassique_regleactivation"
                ) {
                  key = REGLEVERSIONCLASSIQUE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      criteresConditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "regleinclusionouexclusion_regleinclusionouexclusion"
                ) {
                  key = REGLEINCLUSIONOUEXCLUSION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "indicationtarifaire_indicationtarifaire"
                ) {
                  Key = INDICATIONTARIFAIRE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "articlestock_gestionstock") {
                  key = ARTICLESTOCK_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      conditionStockage: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "stockage_gestionstock") {
                  Key = STOCKAGE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      conditionStockage: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "indicationfraisadditionnelle_indicationfraisadditionnelle"
                ) {
                  key = INDICATIONFRAISADDITIONNELLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "operationlivraison_livraison"
                ) {
                  key = OPERATIONLIVRAISON_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      indicationLivraison: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "offrepromotionnelle_offrespromotionnelles"
                ) {
                  key = OFFREPROMOTIONNELLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "tarifspecial_tarifspecial") {
                  key = TARIFSPECIAL_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "transactioncommerciale_transactioncommerciale_autre"
                ) {
                  key = TRANSACTIONCOMMERCIALE_ADMIN_QUEUE;

                  body = {
                    operation: "$pull",
                    body: {
                      autreConditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "transactioncommerciale_transactioncommerciale_condition"
                ) {
                  key = TRANSACTIONCOMMERCIALE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      conditionDuPaiment: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "profil_segmentmarche") {
                  key = PROFIL_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "particularite_segmentmarche"
                ) {
                  key = PARTICULARITE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "donnee_donnee") {
                  key = DONNEE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      caracteristiques: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "gammeproduitouservice_gammeproduit"
                ) {
                  key = GAMMEPRODUITOUSERVICE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritersConcurrent: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "produitassocie_gammeproduit"
                ) {
                  key = PRODUITASSOCIE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritereConcurrent: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "reglementation_reglementation2"
                ) {
                  key = REGLEMENTATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      critereAssocie: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "instanceindicateur_instanceindicateur"
                ) {
                  key = INSTANCEINDICATEUR_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      critereIndicateur: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "couverture_assurance") {
                  key = COUVERTURE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "garantie_garantie") {
                  key = GARANTIE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "indicationfrais_garantie") {
                  key = INDICATIONFRAIS_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "instancegarantie_instancegarantie"
                ) {
                  key = INSTANCEGARANTIE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "instancecouverturegarantie_instancegarantie"
                ) {
                  key = INSTANCECOUVERTUREGARANTIE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCritere: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "constatdiagnostic_diagnosticsituation"
                ) {
                  key = CONSTATDIAGNOSTIC_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "diagnostiquesituation_diagnosticsituation"
                ) {
                  key = DIAGNOSTIQUESITUATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "decisionaprendre_decision") {
                  key = DECISIONAPRENDRE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      caracteristiqueDecision: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "grilledecision_decision") {
                  key = GRILLEDECISION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      caracteristiqueOUargument: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "instancegrilledecision_decision"
                ) {
                  key = INSTANCEGRILLEDECISION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristiqueArgument: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "protagonistepotontiel_protagoniste"
                ) {
                  key = PROTAGONISTEPOTONTIEL_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      criteresConditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "protagonistepotontiel_protagoniste"
                ) {
                  key = PROTAGONISTEPOTONTIEL_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      caracteristiques: {
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
                      instanseCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "personneconcernee_protagoniste"
                ) {
                  Key = PERSONNECONCERNEE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
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
                      instanceCaracteristique: {
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
                      critereOuCondition: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "problemesolution_modelprojet"
                ) {
                  key = PROBLEMESOLUTION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instaceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "veillestrategique_modelprojet"
                ) {
                  key = VEILLESTRATEGIQUE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "pbsobjectifresultat_modelprojet_instance"
                ) {
                  key = PBSOBJECTIFRESULTAT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "pbsobjectifresultat_modelprojet_critere"
                ) {
                  key = PBSOBJECTIFRESULTAT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      criteresOuConditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "objetreferentiel_referentiel"
                ) {
                  Key = OBJETREFERENTIEL_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "causeconsequenceprobleme_gestionprobleme"
                ) {
                  key = CAUSECONSEQUENCEPROBLEME_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instacesCaracteristiques: {
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
                      critereInstanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "budget_budget") {
                  key = BUDGET_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      condition: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "indicateurlocauxregionaux_zones"
                ) {
                  key = INDICATEURLOCAUXREGIONAUX_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristiques: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "activite_activite") {
                  key = ACTIVITE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      creteresConditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "realisation_activite") {
                  key = REALISATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      criteresConditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "livrables_activite") {
                  Key = LIVRABLES_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      criteresConditions: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "actionentrepriseentrprendre_actionentrepriseentreprendre"
                ) {
                  Key = ACTIONENTREPRISEENTRPRENDRE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      critereOuCondition: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "ressourcematerielle_instanceressourcematerielle"
                ) {
                  key = RESSOURCEMATERIELLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristiques: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "instanceressourcematerielle_instanceressourcematerielle"
                ) {
                  key = INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      condition: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "instanceressourcematerielle"
                ) {
                  key = INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristiqueDateOperation: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "instanceressourcematerielle_critere"
                ) {
                  key = INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      critereCondition: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "operationassociee_operationassociee"
                ) {
                  key = OPERATIONASSOCIEE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      critereCondition: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "rubriqueinstancecontrat_instancecontrat"
                ) {
                  key = RUBRIQUEINSTANCECONTRAT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      criteres: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "rubriquecontrat_modelcontrat"
                ) {
                  key = RUBRIQUECONTRAT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      critere: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "ressourcehumaine_ressourcehumaine"
                ) {
                  key = RESSOURCEHUMAINE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "fonctionmission_ressourcehumaine"
                ) {
                  key = FONCTIONMISSION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "retour_gestionretour") {
                  key = RETOUR_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      refInstaceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "analysesituation_gestionretour"
                ) {
                  key = ANALYSESITUATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      refInstanceCaracteristique: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "sav_sav") {
                  key = SAV_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      conditionAssociee: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "grilletarifaireservice_servicesassociesinternes"
                ) {
                  key = GRILLETARIFAIRESERVICE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      criteres: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "lieuconcerne_lieuconcerne") {
                  key = LIEUCONCERNE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instancesCaracteristiques: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "objectto_objectto") {
                  key = OBJECTTO_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      caracteristique: {
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
          if (d.imageAssocie) files.push(d.imageAssocie);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        doc.map(() => {});
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        doc.map(() => {});
      }

      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
instanceCaracteristiqueSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await instanceCaracteristique.find(this.getQuery()).lean();
    const promises = [];

    doc.map(() => {});

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
            await PublishMessage(INSTANCECARACTERISTIQUE_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            doc.map((d) => {
              if (d.imageAssocie) files.push(d.imageAssocie);
            });

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(INSTANCECARACTERISTIQUE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(INSTANCECARACTERISTIQUE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
            let files = [];
            doc.map((d) => {
              if (d.imageAssocie) files.push(d.imageAssocie);
            });
            copyFiles(files);
          }
          if (doc.refObjetConcerne)
            publishUpdate(
              "publish_data",
              [doc.refObjetConcerne],
              COMPLEMENT_ADMIN_QUEUE
            );
          if (doc.refObjetConcerne)
            publishUpdate(
              "publish_data",
              [doc.refObjetConcerne],
              PENALITECOMPLEMENT_ADMIN_QUEUE
            );
          if (doc.refObjetConcerne)
            publishUpdate(
              "publish_data",
              [doc.refObjetConcerne],
              CRITEREINDICATIONTARIFAIRE_ADMIN_QUEUE
            );

          return;
        case "postUpdateMany":
          await PublishMessage(INSTANCECARACTERISTIQUE_CLIENT_QUEUE, {
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
    console.error(
      "instanceCaracteristique communicateWithClient error==>",
      error
    );
  }
}

//add other hooks here
const instanceCaracteristique = mongoose.model(
  "instanceCaracteristique",
  instanceCaracteristiqueSchema
);
module.exports = instanceCaracteristique;
const CaracteristiqueDemandable = require("../models/caracteristiqueDemandable.model");

const { PublishMessage } = require("../helpers/communications");
const {
  publishUpdate,
  GroupBy,
  copyFiles,
  removeFiles,
  sendRPCRequest,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  ACTEURS_ADMIN_QUEUE,
  COMPLEMENT_ADMIN_QUEUE,
  CONDITIONSPECIFIQUE_ADMIN_QUEUE,
  AGENDAEVENT_ADMIN_QUEUE,
  RECOMPENSE_ADMIN_QUEUE,
  ACTIONCITOYENNE_ADMIN_QUEUE,
  DONATION_ADMIN_QUEUE,
  OFFREDONATION_ADMIN_QUEUE,
  OFFRE_ADMIN_QUEUE,
  ACTEURSPRO_ADMIN_QUEUE,
  ESERVICE_ADMIN_QUEUE,
  ACTEURPROFESSIONNELASSOCIE_ADMIN_QUEUE,
  CONDITIONPARTICULIERE_ADMIN_QUEUE,
  INSTANCEESERVICE_ADMIN_QUEUE,
  CIBLE_ADMIN_QUEUE,
  RESERVATION_ADMIN_QUEUE,
  RECLAMATION_ADMIN_QUEUE,
  ELEMENTPLAINTE_ADMIN_QUEUE,
  ANNONCE_ADMIN_QUEUE,
  LOTS_ADMIN_QUEUE,
  DOSSIER_ADMIN_QUEUE,
  CARACTERISTIQUEPRODUIT_ADMIN_QUEUE,
  ACTIONASSOCIEALAREGLE_ADMIN_QUEUE,
  REGLEVERSIONCLASSIQUE_ADMIN_QUEUE,
  INDICATIONTARIFAIRE_ADMIN_QUEUE,
  ARTICLESTOCK_ADMIN_QUEUE,
  STOCKAGE_ADMIN_QUEUE,
  INDICATIONFRAISADDITIONNELLE_ADMIN_QUEUE,
  OPERATIONLIVRAISON_ADMIN_QUEUE,
  OFFREPROMOTIONNELLE_ADMIN_QUEUE,
  TARIFSPECIAL_ADMIN_QUEUE,
  TRANSACTIONCOMMERCIALE_ADMIN_QUEUE,
  PROFIL_ADMIN_QUEUE,
  PARTICULARITE_ADMIN_QUEUE,
  DONNEE_ADMIN_QUEUE,
  GAMMEPRODUITOUSERVICE_ADMIN_QUEUE,
  PRODUITASSOCIE_ADMIN_QUEUE,
  REGLEMENTATION_ADMIN_QUEUE,
  INSTANCEINDICATEUR_ADMIN_QUEUE,
  COUVERTURE_ADMIN_QUEUE,
  GARANTIE_ADMIN_QUEUE,
  INDICATIONFRAIS_ADMIN_QUEUE,
  INSTANCEGARANTIE_ADMIN_QUEUE,
  INSTANCECOUVERTUREGARANTIE_ADMIN_QUEUE,
  CONSTATDIAGNOSTIC_ADMIN_QUEUE,
  DECISIONAPRENDRE_ADMIN_QUEUE,
  GRILLEDECISION_ADMIN_QUEUE,
  INSTANCEGRILLEDECISION_ADMIN_QUEUE,
  PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
  ORGANISATIONCONCERNEE_ADMIN_QUEUE,
  PERSONNECONCERNEE_ADMIN_QUEUE,
  PROJETMODELINSTANCE_ADMIN_QUEUE,
  PROBLEMESOLUTION_ADMIN_QUEUE,
  VEILLESTRATEGIQUE_ADMIN_QUEUE,
  PBSOBJECTIFRESULTAT_ADMIN_QUEUE,
  OBJETREFERENTIEL_ADMIN_QUEUE,
  PENALITECOMPLEMENT_ADMIN_QUEUE,
  CRITEREINDICATIONTARIFAIRE_ADMIN_QUEUE,
  CAUSECONSEQUENCEPROBLEME_ADMIN_QUEUE,
  PROBLEMEPERTINENCE_ADMIN_QUEUE,
  BUDGET_ADMIN_QUEUE,
  INDICATEURLOCAUXREGIONAUX_ADMIN_QUEUE,
  ACTIVITE_ADMIN_QUEUE,
  REALISATION_ADMIN_QUEUE,
  LIVRABLES_ADMIN_QUEUE,
  ACTIONENTREPRISEENTRPRENDRE_ADMIN_QUEUE,
  RESSOURCEMATERIELLE_ADMIN_QUEUE,
  INSTANCERESSOURCEMATERIELLE_ADMIN_QUEUE,
  OPERATIONASSOCIEE_ADMIN_QUEUE,
  RUBRIQUEINSTANCECONTRAT_ADMIN_QUEUE,
  RUBRIQUECONTRAT_ADMIN_QUEUE,
  RESSOURCEHUMAINE_ADMIN_QUEUE,
  FONCTIONMISSION_ADMIN_QUEUE,
  RETOUR_ADMIN_QUEUE,
  ANALYSESITUATION_ADMIN_QUEUE,
  SAV_ADMIN_QUEUE,
  GRILLETARIFAIRESERVICE_ADMIN_QUEUE,
  LIEUCONCERNE_ADMIN_QUEUE,
  STRUCTUREIMMOOUENTREPOT_ADMIN_QUEUE,
  ELEMENT_ADMIN_QUEUE,
  INSTALLATIONETEQUIPEMENT_ADMIN_QUEUE,
  REGLEINCLUSIONOUEXCLUSION_ADMIN_QUEUE,
  INSTANCECARACTERISTIQUE_CLIENT_QUEUE,
  ANNONCEPROFESSIONNELLE_ADMIN_QUEUE,
  DIAGNOSTIQUESITUATION_ADMIN_QUEUE,
  OBJECTTO_ADMIN_QUEUE,
} = require("../config");
