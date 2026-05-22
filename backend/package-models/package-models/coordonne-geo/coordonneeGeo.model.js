const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let coordonneeGeoSchema = new Schema(
  {
    etatDePublication: { type: String, required: true },
    etatObjet: { type: String, default: "code-1" },
    translations: {
      type: [
        {
          language: { type: String },
          designation: { type: String },
          description: { type: String },
          adresse: { type: String, required: true },
        },
      ],
    },
    secteursActivitees: [{ type: Schema.Types.Mixed }],
    codePostal: { type: String },
    typeZone: {
      type: String,
      required: true,
      enum: ["code_4383", "code_4382"],
    },
    typeCoordGeo: { type: Schema.Types.Mixed },
    pays: { type: Schema.Types.Mixed, required: true },
    region: { type: Schema.Types.Mixed, required: true },
    province: { type: Schema.Types.Mixed, required: true },
    ville: { type: Schema.Types.Mixed, required: true },
    commune: { type: Schema.Types.Mixed },
    quartier: { type: Schema.Types.Mixed },
    etatCoord: {
      type: String,
      required: true,
      enum: ["code_4316", "code_4317"],
    },
    longitude: { type: Number, required: true },
    latitude: { type: Number, required: true },
    planAcces: { type: String },
    email: { type: String },
    mobile: { type: String },
    teleFixe: { type: String },
    fax: { type: String },
    web: { type: String },
    instancesCoordonnee: [
      { type: Schema.Types.ObjectId, ref: "instanceCoordonneeGeo" },
    ],
    horaire: [{ type: Schema.Types.ObjectId }],
    contact: [{ type: Schema.Types.ObjectId, ref: "personneContacter" }],
    coordonnesNumeriques: [
      { type: Schema.Types.ObjectId, ref: "coordonneeNumerique" },
    ],
    transports: [{ type: Schema.Types.ObjectId, ref: "transport" }],
    indications: [{ type: Schema.Types.ObjectId, ref: "indication" }],
    zones: [{ type: Schema.Types.ObjectId }],
    objetsAssocies: { type: [Schema.Types.ObjectId] },
    objetsConcernes: {
      type: [
        {
          typeObjetConcerne: { type: String },
          refObjetConcerne: {
            type: Schema.Types.ObjectId,
          },
          _id: false,
        },
      ],
    },
  },
  { timestamps: true }
);

//  autoPopulate hook

coordonneeGeoSchema.pre("aggregate", function (next) {
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
coordonneeGeoSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      {
        path: "secteursActivitees",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "typeCoordGeo", match: { etatObjet: "code-1" }, populate: [] },
      { path: "pays", match: { etatObjet: "code-1" }, populate: [] },
      { path: "region", match: { etatObjet: "code-1" }, populate: [] },
      { path: "province", match: { etatObjet: "code-1" }, populate: [] },
      { path: "ville", match: { etatObjet: "code-1" }, populate: [] },
      { path: "commune", match: { etatObjet: "code-1" }, populate: [] },
      { path: "quartier", match: { etatObjet: "code-1" }, populate: [] },
      { path: "contact", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "coordonnesNumeriques",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "transports", match: { etatObjet: "code-1" }, populate: [] },
      { path: "indications", match: { etatObjet: "code-1" }, populate: [] },

      {
        path: "instancesCoordonnee",
        match: { etatObjet: "code-1" },
        populate: [],
      },

      // {
      //   path: "objetsConcernes",
      //   match: { etatObjet: "code-1" },
      //   populate: [
      //     {
      //       path: "refObjetConcerne",
      //       match: { etatObjet: "code-1" },
      //       populate: [],
      //     },
      //   ],
      // },
    ]);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
//refactor bloc for distantRequest
/*new*/ //refactor bloc for distantRequest
/*new20*/
async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                [
                  "secteursActivitees",
                  "typeCoordGeo",
                  "pays",
                  "region",
                  "province",
                  "ville",
                  "commune",
                  "quartier",
                ],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                HORAIRE_ADMIN_RPC,
                ["horaire"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-coordonneeGeo -refObjetConcerne" } }
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                [
                  "secteursActivitees",
                  "typeCoordGeo",
                  "pays",
                  "region",
                  "province",
                  "ville",
                  "commune",
                  "quartier",
                ],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                HORAIRE_ADMIN_RPC,
                ["horaire"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-coordonneeGeo -refObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                ZONEGEOGRAPHIQUE_ADMIN_RPC,
                ["zones"],
                "VIEW_ITEMS",
                {
                  queryOptions: {
                    select:
                      "-docsAssocies -objetsAssocies -langues -religions -monnaies -secteursActivitesSpecialites -coordonneesSIG -objetsConcernes",
                  },
                }
              ),
            ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["secteursActivitees"] && d["secteursActivitees"].length)
              d["secteursActivitees"] = d["secteursActivitees"].map(
                (d) =>
                  (d = result[0].find((item) => item._id == (d._id || d)) || d)
              );
            if (d["typeCoordGeo"])
              d["typeCoordGeo"] =
                result[0].find(
                  (item) =>
                    item._id == (d["typeCoordGeo"]._id || d["typeCoordGeo"])
                ) || d["typeCoordGeo"];
            if (d["pays"])
              d["pays"] =
                result[0].find(
                  (item) => item._id == (d["pays"]._id || d["pays"])
                ) || d["pays"];
            if (d["region"])
              d["region"] =
                result[0].find(
                  (item) => item._id == (d["region"]._id || d["region"])
                ) || d["region"];
            if (d["province"])
              d["province"] =
                result[0].find(
                  (item) => item._id == (d["province"]._id || d["province"])
                ) || d["province"];
            if (d["ville"])
              d["ville"] =
                result[0].find(
                  (item) => item._id == (d["ville"]._id || d["ville"])
                ) || d["ville"];
            if (d["commune"])
              d["commune"] =
                result[0].find(
                  (item) => item._id == (d["commune"]._id || d["commune"])
                ) || d["commune"];
            if (d["quartier"])
              d["quartier"] =
                result[0].find(
                  (item) => item._id == (d["quartier"]._id || d["quartier"])
                ) || d["quartier"];
          });
        } else {
          if (doc["secteursActivitees"] && doc["secteursActivitees"].length)
            doc["secteursActivitees"] = doc["secteursActivitees"].map(
              (d) =>
                (d = result[0].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["typeCoordGeo"])
            doc["typeCoordGeo"] = result[0].find(
              (item) =>
                item._id == (doc["typeCoordGeo"]._id || doc["typeCoordGeo"]) ||
                doc["typeCoordGeo"]
            );
          if (doc["pays"])
            doc["pays"] =
              result[0].find(
                (item) => item._id == (doc["pays"]._id || doc["pays"])
              ) || doc["pays"];
          if (doc["region"])
            doc["region"] =
              result[0].find(
                (item) => item._id == (doc["region"]._id || doc["region"])
              ) || doc["region"];
          if (doc["province"])
            doc["province"] =
              result[0].find(
                (item) => item._id == (doc["province"]._id || doc["province"])
              ) || doc["province"];
          if (doc["ville"])
            doc["ville"] =
              result[0].find(
                (item) => item._id == (doc["ville"]._id || doc["ville"])
              ) || doc["ville"];
          if (doc["commune"])
            doc["commune"] =
              result[0].find(
                (item) => item._id == (doc["commune"]._id || doc["commune"])
              ) || doc["commune"];
          if (doc["quartier"])
            doc["quartier"] =
              result[0].find(
                (item) => item._id == (doc["quartier"]._id || doc["quartier"])
              ) || doc["quartier"];

          if (doc["horaire"] && doc["horaire"].length)
            doc["horaire"] = doc["horaire"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["zones"] && doc["zones"].length)
            doc["zones"] = doc["zones"].map(
              (d) =>
                (d = result[2].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
coordonneeGeoSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

//rewrite insertMany
coordonneeGeoSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    //comment ADMIN_QUEUE

    //comment ADMIN_QUEUE

    //comment ADMIN_QUEUE

    //comment ADMIN_QUEUE

    //comment ADMIN_QUEUE

    //comment ADMIN_QUEUE

    //#region new insert many bloc
    let zones = GroupBy(doc, "zones");
    for (let item of Object.keys(zones)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(zones[item].map((d) => d.zones)))],
          ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: zones[item].map(
                  (i) =>
                    (i = {
                      refObjet: i._id,
                      typeObjet: "COORDONNEEGEO_COORDONNEES",
                    })
                ),
              },
            },
          }
        );
    }

    let typeObjetConcerne = /*updateGroupByinsertMany with dot*/ GroupBy(
      doc,
      "objetsConcernes.typeObjetConcerne"
    );
    for (let item of Object.keys(typeObjetConcerne)) {
      if (item) {
        let references = GroupBy(typeObjetConcerne[item], "refObjetConcerne");
        for (let itemRef of Object.keys(references)) {
          if (itemRef) {
            let body;
            let key;
            if (item.toLowerCase() == "organisation_auteur") {
              key = ORGANISATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  cordonneeGeo: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "adressesutiles_adressesutiles") {
              key = ADRESSESUTILES_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonnees: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "offre_operationtroc") {
              key = OFFRE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coorBien: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonneesGeo: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "annonce_annonce") {
              key = ANNONCE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordBien: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "ongosc_ongonc") {
              key = ONGOSC_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonneesGeo: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "operationlivraison_livraison") {
              key = OPERATIONLIVRAISON_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonneeLivraison: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "acteuroperationlivraison_livraison"
            ) {
              key = ACTEUROPERATIONLIVRAISON_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonneGeo: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "lieuspecial_livreur") {
              key = LIEUSPECIAL_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonnee: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (
              item.toLowerCase() ==
              "transactioncommerciale_transactioncommerciale"
            ) {
              key = TRANSACTIONCOMMERCIALE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceCoordonnee: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "chargeaffaire_transactioncommerciale"
            ) {
              key = CHARGEAFFAIRE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceCoord: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "instanceacteur_transactioncommerciale"
            ) {
              key = INSTANCEACTEUR_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  instanceCoord: {
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
                  coordonneesLieu: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "personneconcernee_protagoniste") {
              key = PERSONNECONCERNEE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonneesLieu: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "affectation_ressourcehumaine") {
              key = AFFECTATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonneesLieu: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "ressourcehumaine_ressourcehumaine"
            ) {
              key = RESSOURCEHUMAINE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonneesLieu: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "lieuconcerne_lieuconcerne") {
              key = LIEUCONCERNE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonneesLieu: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (
              item.toLowerCase() == "lieuintervention_lieuintervention"
            ) {
              key = LIEUINTERVENTION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonnee: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "agendaevent_event") {
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  lieuConcerne: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "programmeevent_event") {
              key = PROGRAMMEEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  lieuConcerne: {
                    $each: references[itemRef].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "objectto_objectto") {
              console.log("🚀 ~ item.toLowerCase():", item.toLowerCase());
              key = OBJECTTO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonne: {
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

coordonneeGeoSchema.post("save", async function (doc, next) {
  try {
    if (this.transports?.length) {
      await Transport.updateMany(
        { _id: { $in: this.transports } },
        { $addToSet: { stations: this._id } }
      );
    }

    if (doc.objetsConcernes.length == 1) {
      /*comment publish `${doc.objetsConcernes[0].typeObjetConcerne.toUpperCase()}_ADMIN_KEY`*/
    }
    // if (doc["objetsConcernes.refObjetConcerne"]) {
    //   //comment ADMIN_QUEUE
    // }
    // if (doc["objetsConcernes.refObjetConcerne"]) {
    //   //comment ADMIN_QUEUE
    // }
    // if (doc["objetsConcernes.refObjetConcerne"]) {
    //   //comment ADMIN_QUEUE
    // }
    // if (doc["objetsConcernes.refObjetConcerne"]) {
    //   //comment ADMIN_QUEUE
    // }
    // if (doc["objetsConcernes.refObjetConcerne"]) {
    //   //comment ADMIN_QUEUE
    // }
    // if (doc["objetsConcernes.refObjetConcerne"]) {
    //   //comment ADMIN_QUEUE
    // }
    // if (doc["objetsConcernes.refObjetConcerne"]) {
    //   //comment ADMIN_QUEUE
    // }
    // if (doc["refObjetConcerne"]) {
    //   //comment ADMIN_QUEUE
    // }

    //#region new save bloc
    if (doc.horaire.length)
      publishUpdate("update_items", doc.horaire, HORAIRE_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "COORDONNEEGEO_COORDONNEES",
        },
      });
    if (doc.zones.length)
      publishUpdate("update_items", doc.zones, ZONEGEOGRAPHIQUE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "COORDONNEEGEO_COORDONNEES",
          },
        },
      });

    if (doc.objetsConcernes.length) {
      let data = GroupBy(doc.objetsConcernes, "typeObjetConcerne");
      for (let item of Object.keys(data)) {
        if (item) {
          let body;
          let key;
          if (item.toLowerCase() == "organisation_auteur") {
            key = ORGANISATION_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { cordonneeGeo: doc._id } };
          } else if (item.toLowerCase() == "adressesutiles_adressesutiles") {
            key = ADRESSESUTILES_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { coordonnees: doc._id } };
          } else if (item.toLowerCase() == "offre_operationtroc") {
            key = OFFRE_ADMIN_QUEUE;
            body = { operation: "$set", body: { coorBien: doc._id } };
          } else if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
            key = ACTEURSPRO_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { coordonneesGeo: doc._id },
            };
          } else if (item.toLowerCase() == "agendaevent_event") {
            key = AGENDAEVENT_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { lieuConcerne: doc._id },
            };
          } else if (item.toLowerCase() == "programmeevent_event") {
            key = PROGRAMMEEVENT_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { lieuConcerne: doc._id },
            };
          } else if (item.toLowerCase() == "annonce_annonce") {
            key = ANNONCE_ADMIN_QUEUE;
            body = { operation: "$set", body: { coordBien: doc._id } };
          } else if (item.toLowerCase() == "ongosc_ongonc") {
            key = ONGOSC_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { coordonneesGeo: doc._id },
            };
          } else if (item.toLowerCase() == "operationlivraison_livraison") {
            key = OPERATIONLIVRAISON_ADMIN_QUEUE;
            body = {
              operation: "$set",
              body: { coordonneeLivraison: doc._id },
            };
          } else if (item.toLowerCase() == "operationlivraison_livraison") {
            key = OPERATIONLIVRAISON_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { coordonneeLivraison: doc._id },
            };
          } else if (
            item.toLowerCase() == "acteuroperationlivraison_livraison"
          ) {
            key = ACTEUROPERATIONLIVRAISON_ADMIN_QUEUE;
            body = { operation: "$set", body: { coordonneGeo: doc._id } };
          } else if (
            item.toLowerCase() == "acteuroperationlivraison_livraison"
          ) {
            key = ACTEUROPERATIONLIVRAISON_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { coordonneGeo: doc._id } };
          } else if (item.toLowerCase() == "lieuspecial_livreur") {
            key = LIEUSPECIAL_ADMIN_QUEUE;
            body = { operation: "$set", body: { coordonnee: doc._id } };
          } else if (item.toLowerCase() == "lieuspecial_livreur") {
            key = LIEUSPECIAL_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { coordonnee: doc._id } };
          } else if (
            item.toLowerCase() ==
            "transactioncommerciale_transactioncommerciale"
          ) {
            key = TRANSACTIONCOMMERCIALE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { instanceCoordonnee: doc._id },
            };
          } else if (
            item.toLowerCase() == "chargeaffaire_transactioncommerciale"
          ) {
            key = CHARGEAFFAIRE_ADMIN_QUEUE;
            body = { operation: "$set", body: { instanceCoord: doc._id } };
          } else if (
            item.toLowerCase() == "instanceacteur_transactioncommerciale"
          ) {
            key = INSTANCEACTEUR_ADMIN_QUEUE;
            body = { operation: "$set", body: { instanceCoord: doc._id } };
          } else if (
            item.toLowerCase() == "organisationconcernee_protagoniste"
          ) {
            key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { coordonneesLieu: doc._id },
            };
          } else if (item.toLowerCase() == "personneconcernee_protagoniste") {
            key = PERSONNECONCERNEE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { coordonneesLieu: doc._id },
            };
          } else if (item.toLowerCase() == "affectation_ressourcehumaine") {
            key = AFFECTATION_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { coordonneesLieu: doc._id },
            };
          } else if (
            item.toLowerCase() == "ressourcehumaine_ressourcehumaine"
          ) {
            key = RESSOURCEHUMAINE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { coordonneesLieu: doc._id },
            };
          } else if (item.toLowerCase() == "lieuconcerne_lieuconcerne") {
            key = LIEUCONCERNE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { coordonneesLieu: doc._id },
            };
          } else if (
            item.toLowerCase() == "lieuintervention_lieuintervention"
          ) {
            key = LIEUINTERVENTION_ADMIN_QUEUE;
            body = { operation: "$set", body: { coordonnee: doc._id } };
          }

          //#region new save bloc
          else if (
            item.toLowerCase() == "structureimmoouentrepot_structurephysique"
          ) {
            key = STRUCTUREIMMOOUENTREPOT_ADMIN_QUEUE;
            body = { operation: "$set", body: { coordonneesLieu: doc._id } };
          } else if (item.toLowerCase() == "element_structurephysique") {
            key = ELEMENT_ADMIN_QUEUE;
            body = { operation: "$set", body: { coordonneeslieu: doc._id } };
          } else if (item.toLowerCase() == "lieustock_lieustock") {
            key = LIEUSTOCK_ADMIN_QUEUE;
            body = { operation: "$set", body: { coordonneelieu: doc._id } };
          } else if (item.toLowerCase() == "objectto_objectto") {
            key = OBJECTTO_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: {
                coordonne: doc._id,
              },
            };
          } else if (item.toLowerCase() == "contact_plansites") {
            key = CONTACT_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: {
                coordonneesGeo: doc._id,
              },
            };
          }

          //#endregion new save bloc
          if (body)
            publishUpdate(
              "update_items",
              data[item].map((i) => i.refObjetConcerne),
              key,
              body
            );
        }
      }
    } //#enregion new save bloc

    next();
  } catch (error) {
    console.log("error===>", error);
    next(error);
  }
});

let prevState = null;
let itemToCheck = {};

coordonneeGeoSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await coordonneeGeo.findOne(this.getQuery()).lean();
    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["objetsConcernes"] = doc.objetsConcernes;
      itemToCheck["horaire"] = doc.horaire;
      itemToCheck["zones"] = doc.zones;
      //#endregion new pre find and update bloc
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const transportsIds = this._update?.["$set"]?.transports;
      if (doc?.transports && doc?.transports != transportsIds) {
        let ids = doc?.transports
          .map((item) => item._id || item)
          .filter((item) => !transportsIds.includes(item));
        await Transport.updateMany(
          { _id: { $in: ids } },
          { $pull: { stations: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
coordonneeGeoSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    console.log("GOOOG 1");
    //#region new post find and update bloc
    let itemToPull,
      itemToPush = [];
    if (itemToCheck["objetsConcernes"].length || doc.objetsConcernes.length) {
      itemToPull = getDiffArray(
        itemToCheck["objetsConcernes"],
        doc.objetsConcernes,
        "refObjetConcerne"
      );
      itemToPush = getDiffArray(
        doc.objetsConcernes,
        itemToCheck["objetsConcernes"],
        "refObjetConcerne"
      );
      if (itemToPull.length) {
        itemToPull = GroupBy(itemToPull, "typeObjetConcerne");
        for (let item of Object.keys(itemToPull)) {
          if (item) {
            console.log("🚀 ~ item.toLowerCase():", item.toLowerCase());

            let body;
            let key;
            if (item.toLowerCase() == "organisation_auteur") {
              key = ORGANISATION_ADMIN_QUEUE;
              body = { operation: "$pull", body: { cordonneeGeo: doc._id } };
            } else if (item.toLowerCase() == "adressesutiles_adressesutiles") {
              key = ADRESSESUTILES_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonnees: doc._id } };
            } else if (item.toLowerCase() == "offre_operationtroc") {
              key = OFFRE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coorBien: doc._id } };
            } else if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonneesGeo: doc._id } };
            } else if (item.toLowerCase() == "agendaevent_event") {
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = { operation: "$pull", body: { lieuConcerne: doc._id } };
            } else if (item.toLowerCase() == "programmeevent_event") {
              key = PROGRAMMEEVENT_ADMIN_QUEUE;
              body = { operation: "$pull", body: { lieuConcerne: doc._id } };
            } else if (item.toLowerCase() == "annonce_annonce") {
              key = ANNONCE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordBien: doc._id } };
            } else if (item.toLowerCase() == "ongosc_ongonc") {
              key = ONGOSC_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonneesGeo: doc._id } };
            } else if (item.toLowerCase() == "operationlivraison_livraison") {
              key = OPERATIONLIVRAISON_ADMIN_QUEUE;
              body = {
                operation: "$pull",
                body: { coordonneeLivraison: doc._id },
              };
            } else if (
              item.toLowerCase() == "acteuroperationlivraison_livraison"
            ) {
              key = ACTEUROPERATIONLIVRAISON_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonneGeo: doc._id } };
            } else if (item.toLowerCase() == "lieuspecial_livreur") {
              key = LIEUSPECIAL_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonnee: doc._id } };
            } else if (
              item.toLowerCase() ==
              "transactioncommerciale_transactioncommerciale"
            ) {
              key = TRANSACTIONCOMMERCIALE_ADMIN_QUEUE;
              body = {
                operation: "$pull",
                body: { instanceCoordonnee: doc._id },
              };
            } else if (
              item.toLowerCase() == "chargeaffaire_transactioncommerciale"
            ) {
              key = CHARGEAFFAIRE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { instanceCoord: doc._id } };
            } else if (
              item.toLowerCase() == "instanceacteur_transactioncommerciale"
            ) {
              key = INSTANCEACTEUR_ADMIN_QUEUE;
              body = { operation: "$pull", body: { instanceCoord: doc._id } };
            } else if (
              item.toLowerCase() == "organisationconcernee_protagoniste"
            ) {
              key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonneesLieu: doc._id } };
            } else if (item.toLowerCase() == "personneconcernee_protagoniste") {
              key = PERSONNECONCERNEE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonneesLieu: doc._id } };
            } else if (item.toLowerCase() == "affectation_ressourcehumaine") {
              key = AFFECTATION_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonneesLieu: doc._id } };
            } else if (
              item.toLowerCase() == "ressourcehumaine_ressourcehumaine"
            ) {
              key = RESSOURCEHUMAINE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonneesLieu: doc._id } };
            } else if (item.toLowerCase() == "lieuconcerne_lieuconcerne") {
              key = LIEUCONCERNE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonneesLieu: doc._id } };
            } else if (
              item.toLowerCase() == "lieuintervention_lieuintervention"
            ) {
              key = LIEUINTERVENTION_ADMIN_QUEUE;
              body = { operation: "$pull", body: { coordonnee: doc._id } };
            } else if (item.toLowerCase() == "lieustock_lieustock") {
              key = LIEUSTOCK_ADMIN_QUEUE;
              body = { operation: "$set", body: { coordonneelieu: null } };
            } else if (item.toLowerCase() == "objectto_objectto") {
              key = OBJECTTO_ADMIN_QUEUE;
              body = {
                operation: "$pull",
                body: {
                  coordonne: doc._id,
                },
              };
            } else if (item.toLowerCase() == "contact_plansites") {
              key = CONTACT_ADMIN_QUEUE;
              body = {
                operation: "$pull",
                body: {
                  coordonneesGeo: doc._id,
                },
              };
            }

            if (body)
              publishUpdate(
                "update_items",
                itemToPull[item].map((i) => i.refObjetConcerne),
                key,
                body
              );
          }
        }
      }
      if (itemToPush.length) {
        itemToPush = GroupBy(itemToPush, "typeObjetConcerne");
        for (let item of Object.keys(itemToPush)) {
          if (item) {
            let body;
            let key;
            if (item.toLowerCase() == "organisation_auteur") {
              key = ORGANISATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { cordonneeGeo: doc._id },
              };
            } else if (item.toLowerCase() == "adressesutiles_adressesutiles") {
              key = ADRESSESUTILES_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { coordonnees: doc._id } };
            } else if (item.toLowerCase() == "offre_operationtroc") {
              key = OFFRE_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { coorBien: doc._id } };
            } else if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { coordonneesGeo: doc._id },
              };
            } else if (item.toLowerCase() == "agendaevent_event") {
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { lieuConcerne: doc._id },
              };
            } else if (item.toLowerCase() == "programmeevent_event") {
              key = PROGRAMMEEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { lieuConcerne: doc._id },
              };
            } else if (item.toLowerCase() == "annonce_annonce") {
              key = ANNONCE_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { coordBien: doc._id } };
            } else if (item.toLowerCase() == "ongosc_ongonc") {
              key = ONGOSC_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { coordonneesGeo: doc._id },
              };
            } else if (item.toLowerCase() == "operationlivraison_livraison") {
              key = OPERATIONLIVRAISON_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { coordonneeLivraison: doc._id },
              };
            } else if (
              item.toLowerCase() == "acteuroperationlivraison_livraison"
            ) {
              key = ACTEUROPERATIONLIVRAISON_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { coordonneGeo: doc._id },
              };
            } else if (item.toLowerCase() == "lieuspecial_livreur") {
              key = LIEUSPECIAL_ADMIN_QUEUE;
              body = { operation: "$set", body: { coordonnee: doc._id } };
            } else if (
              item.toLowerCase() ==
              "transactioncommerciale_transactioncommerciale"
            ) {
              key = TRANSACTIONCOMMERCIALE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { instanceCoordonnee: doc._id },
              };
            } else if (
              item.toLowerCase() == "chargeaffaire_transactioncommerciale"
            ) {
              key = CHARGEAFFAIRE_ADMIN_QUEUE;
              body = {
                operation: "$set",
                body: { instanceCoord: doc._id },
              };
            } else if (
              item.toLowerCase() == "instanceacteur_transactioncommerciale"
            ) {
              key = INSTANCEACTEUR_ADMIN_QUEUE;
              body = {
                operation: "$set",
                body: { instanceCoord: doc._id },
              };
            } else if (
              item.toLowerCase() == "organisationconcernee_protagoniste"
            ) {
              key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { coordonneesLieu: doc._id },
              };
            } else if (item.toLowerCase() == "personneconcernee_protagoniste") {
              key = PERSONNECONCERNEE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { coordonneesLieu: doc._id },
              };
            } else if (item.toLowerCase() == "affectation_ressourcehumaine") {
              key = AFFECTATION_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { coordonneesLieu: doc._id },
              };
            } else if (
              item.toLowerCase() == "ressourcehumaine_ressourcehumaine"
            ) {
              key = RESSOURCEHUMAINE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { coordonneesLieu: doc._id },
              };
            } else if (item.toLowerCase() == "lieuconcerne_lieuconcerne") {
              key = LIEUCONCERNE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { coordonneesLieu: doc._id },
              };
            } else if (
              item.toLowerCase() == "lieuintervention_lieuintervention"
            ) {
              key = LIEUINTERVENTION_ADMIN_QUEUE;
              body = { operation: "$set", body: { coordonnee: doc._id } };
            } else if (item.toLowerCase() == "lieustock_lieustock") {
              key = LIEUSTOCK_ADMIN_QUEUE;
              body = { operation: "$set", body: { coordonneelieu: doc._id } };
            } else if (item.toLowerCase() == "objectto_objectto") {
              key = OBJECTTO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonne: doc._id,
                },
              };
            } else if (item.toLowerCase() == "contact_plansites") {
              key = CONTACT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  coordonneesGeo: doc._id,
                },
              };
            }

            if (body)
              publishUpdate(
                "update_items",
                itemToPush[item].map((i) => i.refObjetConcerne),
                key,
                body
              );
          }
        }
      }
    }

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["horaire"], newData: doc.horaire },
      HORAIRE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "COORDONNEEGEO_COORDONNEES",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["zones"], newData: doc.zones },
      ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "COORDONNEEGEO_COORDONNEES",
          },
        },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.transports?.length)
      await Transport.updateMany(
        { _id: { $in: doc.transports.map((d) => d._id || d) } },
        { $addToSet: { stations: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
coordonneeGeoSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      //#region new addToSet bloc

      if (this._update?.["$addToSet"]?.objetsConcernes && docs.modifiedCount) {
        let body;
        let key;
        if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "organisation_auteur"
        ) {
          key = ORGANISATION_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { cordonneeGeo: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "offre_operationtroc"
        ) {
          key = OFFRE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coorBien: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "acteurspro_acteurprofessionel"
        ) {
          key = ACTEURSPRO_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonneesGeo: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "agendaevent_event"
        ) {
          key = AGENDAEVENT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { lieuConcerne: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "programmeevent_event"
        ) {
          key = PROGRAMMEEVENT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { lieuConcerne: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "annonce_annonce"
        ) {
          key = ANNONCE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordBien: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() == "ongosc_ongonc"
        ) {
          key = ONGOSC_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonneesGeo: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "operationlivraison_livraison"
        ) {
          key = OPERATIONLIVRAISON_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              coordonneeLivraison: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "acteuroperationlivraison_livraison"
        ) {
          key = ACTEUROPERATIONLIVRAISON_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonneGeo: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "transactioncommerciale_transactioncommerciale"
        ) {
          key = TRANSACTIONCOMMERCIALE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              instanceCoordonnee: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "chargeaffaire_transactioncommerciale"
        ) {
          key = CHARGEAFFAIRE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { instanceCoord: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "instanceacteur_transactioncommerciale"
        ) {
          key = INSTANCEACTEUR_ADMIN_QUEUE;
          body = {
            operation: "$set",
            body: { instanceCoord: this.getQuery()?._id?.["$in"][0] },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "organisationconcernee_protagoniste"
        ) {
          key = ORGANISATIONCONCERNEE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonneesLieu: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "personneconcernee_protagoniste"
        ) {
          key = PERSONNECONCERNEE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonneesLieu: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "affectation_ressourcehumaine"
        ) {
          key = AFFECTATION_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonneesLieu: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "ressourcehumaine_ressourcehumaine"
        ) {
          key = RESSOURCEHUMAINE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonneesLieu: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "lieuconcerne_lieuconcerne"
        ) {
          key = LIEUCONCERNE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonneesLieu: { $each: this.getQuery()?._id?.["$in"] } },
          };
        }

        //#region new addToSet bloc
        else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "structureimmoouentrepot_structurephysique"
        ) {
          key = STRUCTUREIMMOOUENTREPOT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonneesLieu: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "element_structurephysique"
        ) {
          key = ELEMENT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonneeslieu: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "lieuintervention_lieuintervention"
        ) {
          key = LIEUINTERVENTION_ADMIN_QUEUE;
          body = {
            operation: "$set",
            body: { coordonnee: this.getQuery()?._id?.["$in"][0] },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "adressesutiles_adressesutiles"
        ) {
          key = ADRESSESUTILES_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { coordonnees: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "objectto_objectto"
        ) {
          key = OBJECTTO_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              coordonne: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjetConcerne.toLowerCase() ==
          "contact_plansites"
        ) {
          key = CONTACT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: {
              coordonneesGeo: { $each: this.getQuery()?._id?.["$in"] },
            },
          };
        }

        //#endregion new addToSet bloc
        if (body)
          publishUpdate(
            "update_items",
            this._update?.["$addToSet"].objetsConcernes.refObjetConcerne,
            key,
            body
          );
      }
      //#endregion new addToSet bloc

      if (this._update?.["$addToSet"].transports) {
        await Transport.updateOne(
          { _id: this._update?.["$addToSet"]?.transports },
          { $addToSet: { stations: { $each: this.getQuery()._id["$in"] } } }
        );
      }

      //bloc refactor updateMany addToSet m0
      // if (
      //   this._update?.["$addToSet"]?.objetsConcernes &&
      //   docs.modifiedCount /*new modifCount*/
      // )
      //   publishUpdate(
      //     "update_items",
      //     this._update?.["$addToSet"].objetsConcernes.refObjetConcerne,
      //     `${this._update?.[
      //       "$addToSet"
      //     ].objetsConcernes.typeObjetConcerne.toUpperCase()}_ADMIN_KEY`,
      //     {
      //       operation: "$addToSet",
      //       body: { coordonnees: { $each: this.getQuery()._id["$in"] } },
      //     }
      //   );
    } else {
      let doc = await coordonneeGeo.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.horaire)))],
          HORAIRE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.zones)))],
          ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );

        let data = /*updateGroupByupdateMany with dot*/ GroupBy(
          doc,
          "objetsConcernes.typeObjetConcerne"
        );
        for (let item of Object.keys(data)) {
          if (item) {
            let references = GroupBy(
              typeObjetConcerne[item],
              "refObjetConcerne"
            );
            for (let itemRef of Object.keys(references)) {
              if (itemRef) {
                let body;
                let key;
                if (item.toLowerCase() == "organisation_auteur") {
                  key = ORGANISATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      cordonneeGeo: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "adressesutiles_adressesutiles"
                ) {
                  key = ADRESSESUTILES_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonnees: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "offre_operationtroc") {
                  key = OFFRE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coorBien: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "acteurspro_acteurprofessionel"
                ) {
                  key = ACTEURSPRO_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonneesGeo: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "agendaevent_event") {
                  key = AGENDAEVENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      lieuConcerne: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "programmeevent_event") {
                  key = PROGRAMMEEVENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      lieuConcerne: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "annonce_annonce") {
                  key = ANNONCE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordBien: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "ongosc_ongonc") {
                  key = ONGOSC_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonneesGeo: {
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
                      coordonneeLivraison: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "acteuroperationlivraison_livraison"
                ) {
                  key = ACTEUROPERATIONLIVRAISON_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonneGeo: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "lieuspecial_livreur") {
                  key = LIEUSPECIAL_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonnee: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() ==
                  "transactioncommerciale_transactioncommerciale"
                ) {
                  key = TRANSACTIONCOMMERCIALE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCoordonnee: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "chargeaffaire_transactioncommerciale"
                ) {
                  key = CHARGEAFFAIRE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCoord: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "instanceacteur_transactioncommerciale"
                ) {
                  key = INSTANCEACTEUR_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      instanceCoord: {
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
                      coordonneesLieu: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "personneconcernee_protagoniste"
                ) {
                  key = PERSONNECONCERNEE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonneesLieu: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "affectation_ressourcehumaine"
                ) {
                  key = AFFECTATION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonneesLieu: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "ressourcehumaine_ressourcehumaine"
                ) {
                  key = RESSOURCEHUMAINE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonneesLieu: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "lieuconcerne_lieuconcerne") {
                  key = LIEUCONCERNE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonneesLieu: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (
                  item.toLowerCase() == "lieuintervention_lieuintervention"
                ) {
                  key = LIEUINTERVENTION_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonnee: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                }

                //#region new archive bloc
                else if (
                  item.toLowerCase() ==
                  "structureimmoouentrepot_structurephysique"
                ) {
                  key = STRUCTUREIMMOOUENTREPOT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonneesLieu: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "element_structurephysique") {
                  key = ELEMENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonneeslieu: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "objectto_objectto") {
                  key = OBJECTTO_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonne: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "contact_plansites") {
                  key = CONTACT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      coordonneesGeo: {
                        $in: references[itemRef].map((d) => d._id),
                      },
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

        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        let files = [];

        doc.map((d) => {
          if (d.planAcces) files.push(d.planAcces);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let contact = [];
        let indications = [];
        let coordonnesNumeriques = [];
        doc.map((d) => {
          contact.push(...d.contact.map((v) => v._id || v));
          indications.push(...d.indications.map((v) => v._id || v));
          coordonnesNumeriques.push(
            ...d.coordonnesNumeriques.map((v) => v._id || v)
          );
        });
        if (contact.length) {
          promises.push(
            PersonneContacter.updateMany(
              { _id: { $in: contact } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (indications.length) {
          promises.push(
            Indication.updateMany(
              { _id: { $in: indications } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (coordonnesNumeriques.length) {
          promises.push(
            CoordonneeNumerique.updateMany(
              { _id: { $in: coordonnesNumeriques } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let contact = [];
        let transports = [];
        let indications = [];
        let coordonnesNumeriques = [];

        doc.map((d) => {
          contact.push(...d.contact.map((v) => v._id || v));
          transports.push(...d.transports.map((v) => v._id || v));
          indications.push(...d.indications.map((v) => v._id || v));
          coordonnesNumeriques.push(
            ...d.coordonnesNumeriques.map((v) => v._id || v)
          );
        });
        if (contact.length) {
          promises.push(
            PersonneContacter.updateMany(
              { _id: { $in: contact } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (transports.length) {
          promises.push(
            Transport.updateMany(
              { _id: { $in: transports } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (indications.length) {
          promises.push(
            Indication.updateMany(
              { _id: { $in: indications } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (coordonnesNumeriques.length) {
          promises.push(
            CoordonneeNumerique.updateMany(
              { _id: { $in: coordonnesNumeriques } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
      }

      //#region new pull bloc
      if (this._update?.["$pull"]) {
        if (
          this._update?.["$pull"]?.zones &&
          docs.modifiedCount /*new modifCount*/ &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].zones,
            ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (this._update?.["$pull"].objetsConcernes) {
          let body;
          let key;
          console.log(this._update?.["$pull"]);
          if (this._update?.["$pull"].objetsConcernes.typeObjetConcerne) {
            switch (this._update?.["$pull"].objetsConcernes.typeObjetConcerne) {
              case "RESSOURCEHUMAINE_RESSOURCEHUMAINE":
                key = RESSOURCEHUMAINE_ADMIN_QUEUE;
                body = { coordonneesLieu: this.getQuery()._id };
                break;
              case "ADRESSESUTILES_ADRESSESUTILES":
                key = ADRESSESUTILES_ADMIN_QUEUE;
                body = { coordonnees: this.getQuery()._id };
                break;
              case "OFFRE_OPERATIONTROC":
                key = OFFRE_ADMIN_QUEUE;
                body = { coorBien: this.getQuery()._id };
                break;
              case "AGENDAEVENT_EVENT":
                key = AGENDAEVENT_ADMIN_QUEUE;
                body = { lieuConcerne: this.getQuery()._id };
                break;
              case "PROGRAMMEEVENT_EVENT":
                key = PROGRAMMEEVENT_ADMIN_QUEUE;
                body = { lieuConcerne: this.getQuery()._id };
                break;
              case "ACTEURSPRO_ACTEURPROFESSIONEL":
                key = ACTEURSPRO_ADMIN_QUEUE;
                body = { coordonneesGeo: this.getQuery()._id };
                break;
              case "OBJECTTO_OBJECTTO":
                key = OBJECTTO_ADMIN_QUEUE;
                body = { coordonne: this.getQuery()._id };
              case "contact_plansites":
                key = OBJECTTO_ADMIN_QUEUE;
                body = { coordonneesGeo: this.getQuery()._id };
            }
          }
          if (body)
            publishUpdate(
              "update_items",
              this._update?.["$pull"].objetsConcernes.refObjetConcerne,
              key,
              {
                operation: "$pull",
                body,
              }
            );
        }
      }

      //#endregion new pull bloc
      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
coordonneeGeoSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await coordonneeGeo.find(this.getQuery()).lean();
    const promises = [];
    let contact = [];
    let indications = [];
    let coordonnesNumeriques = [];
    doc.map((d) => {
      contact.push(...d.contact.map((v) => v._id || v));
      indications.push(...d.indications.map((v) => v._id || v));
      coordonnesNumeriques.push(
        ...d.coordonnesNumeriques.map((v) => v._id || v)
      );
    });
    if (contact.length) {
      promises.push(
        PersonneContacter.deleteMany({ _id: { $in: contact } }).exec()
      );
    }
    if (indications.length) {
      promises.push(
        Indication.deleteMany({ _id: { $in: indications } }).exec()
      );
    }
    if (coordonnesNumeriques.length) {
      promises.push(
        CoordonneeNumerique.deleteMany({
          _id: { $in: coordonnesNumeriques },
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
    if (methode == "postUpdateMany" || doc?.etatDePublication) {
      switch (methode) {
        case "preFindOneAndUpdate":
          if (
            targetState &&
            targetState != "code_3417" &&
            prevState == "code_3417"
          ) {
            await PublishMessage(COORDONNEEGEO_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            if (doc.planAcces) files.push(doc.planAcces);

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(COORDONNEEGEO_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(COORDONNEEGEO_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            let files = [];
            if (doc.planAcces) files.push(doc.planAcces);
            copyFiles(files);
            if (doc?.contact?.length) {
              PublishPersonneContacter(doc.contact);
            }
            if (doc?.transports?.length) {
              PublishTransport(doc.transports);
            }
            if (doc?.indications?.length) {
              PublishIndication(doc.indications);
            }
            if (doc?.coordonnesNumeriques?.length) {
              PublishCoordonneeNumerique(doc.coordonnesNumeriques);
            }
            //#region new publish bloc
            if (doc.horaire.length)
              publishUpdate("publish_data", doc.horaire, HORAIRE_ADMIN_QUEUE);
            if (doc.zones.length)
              publishUpdate(
                "publish_data",
                doc.zones,
                ZONEGEOGRAPHIQUE_ADMIN_QUEUE
              );
            //#endregion new publish bloc
          }
          return;
        case "postUpdateMany":
          await PublishMessage(COORDONNEEGEO_CLIENT_QUEUE, {
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
    console.error("coordonneeGeo communicateWithClient error==>", error);
  }
}
//add other hooks here
const coordonneeGeo = mongoose.model("coordonneeGeo", coordonneeGeoSchema);
module.exports = coordonneeGeo;
const PersonneContacter = require("../models/personneContacter.model");
const Transport = require("../models/transport.model");
const Indication = require("../models/indication.model");
const CoordonneeNumerique = require("../models/coordonneeNumerique.model");

const {
  PublishData: PublishPersonneContacter,
} = require("./repositories/personneContacter.repositorie");
const {
  PublishData: PublishTransport,
} = require("./repositories/transport.repositorie");
const {
  PublishData: PublishIndication,
} = require("./repositories/indication.repositorie");
const {
  PublishData: PublishCoordonneeNumerique,
} = require("./repositories/coordonneeNumerique.repositorie");

const {
  getDataByPath,
  publishUpdate,
  getDiffArray,
  sendRPCRequest,
  copyFiles,
  removeFiles,
  flatDeep,
  GroupBy,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  HORAIRE_ADMIN_RPC,
  ZONEGEOGRAPHIQUE_ADMIN_RPC,
  STRUCTUREIMMOOUENTREPOT_ADMIN_QUEUE,
  ELEMENT_ADMIN_QUEUE,
  LIEUINTERVENTION_ADMIN_QUEUE,
  LIEUCONCERNE_ADMIN_QUEUE,
  RESSOURCEHUMAINE_ADMIN_QUEUE,
  AFFECTATION_ADMIN_QUEUE,
  PERSONNECONCERNEE_ADMIN_QUEUE,
  ORGANISATIONCONCERNEE_ADMIN_QUEUE,
  INSTANCEACTEUR_ADMIN_QUEUE,
  CHARGEAFFAIRE_ADMIN_QUEUE,
  TRANSACTIONCOMMERCIALE_ADMIN_QUEUE,
  LIEUSPECIAL_ADMIN_QUEUE,
  ACTEUROPERATIONLIVRAISON_ADMIN_QUEUE,
  OPERATIONLIVRAISON_ADMIN_QUEUE,
  ONGOSC_ADMIN_QUEUE,
  ANNONCE_ADMIN_QUEUE,
  ACTEURSPRO_ADMIN_QUEUE,
  OFFRE_ADMIN_QUEUE,
  ADRESSESUTILES_ADMIN_QUEUE,
  ORGANISATION_ADMIN_QUEUE,
  COORDONNEEGEO_CLIENT_QUEUE,
  ZONEGEOGRAPHIQUE_ADMIN_QUEUE,
  HORAIRE_ADMIN_QUEUE,
  AGENDAEVENT_ADMIN_QUEUE,
  PROGRAMMEEVENT_ADMIN_QUEUE,
  LIEUSTOCK_ADMIN_QUEUE,
  OBJECTTO_ADMIN_QUEUE,
  CONTACT_ADMIN_QUEUE,
} = require("../config");
const { PublishMessage } = require("../helpers/communications");
