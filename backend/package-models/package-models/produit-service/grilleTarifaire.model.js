const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let grilleTarifaireSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    dateDebut: { type: Date },
    dateFin: { type: Date },
    quantiteInf: { type: Number, required: true },
    quantiteSup: { type: Number, required: true },
    tarifUnitaireHT: { type: Number, required: true },
    tarifUnitairePublic: { type: Number /*required: true */ },
    gainsParUnite: { type: Number, required: true },
    monnaie: { type: Schema.Types.Mixed, required: true },
    translations: {
      type: [{ language: { type: String }, commentaire: { type: String } }],
    },
    actif: { type: Boolean },
    produitAssocie: { type: Schema.Types.ObjectId, ref: "produitService" },
    serviceSpecial: { type: Schema.Types.ObjectId },
    applicationAssocie: { type: [ObjectId] },

    instanceProduitServiceReservation: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

//  autoPopulate hook

grilleTarifaireSchema.pre("aggregate", function (next) {
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
grilleTarifaireSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      // { path: "monnaie", match: { etatObjet: "code-1" }, populate: [] },
    ]);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
/*new*/ /*new20*/ async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
              sendRPCRequest(
                doc,
                MONNAIE_ADMIN_RPC,
                ["monnaie"],
                "VIEW_ITEMS",
                {}
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                MONNAIE_ADMIN_RPC,
                ["monnaie"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                SERVICESPECIAL_ADMIN_RPC,
                ["serviceSpecial"],
                "VIEW_ITEMS",
                {}
              ),
            ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["monnaie"])
              d["monnaie"] =
                result[0].find(
                  (item) => item._id == (d["monnaie"]._id || d["monnaie"])
                ) || d["monnaie"];
          });
        } else {
          if (doc["monnaie"])
            doc["monnaie"] =
              result[0].find(
                (item) => item._id == (doc["monnaie"]._id || doc["monnaie"])
              ) || doc["monnaie"];
          if (doc["serviceSpecial"] && result[1])
            doc["serviceSpecial"] = result[1] || doc["serviceSpecial"];
          if (doc["serviceSpecial"] && result[1])
            doc["serviceSpecial"] = result[1] || doc["serviceSpecial"];
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
grilleTarifaireSchema.post(/find.*|save/, async function (doc, next) {
  try {
    if (doc) await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

async function checkAnomalie(data, idGrille, next) {
  try {
    let listGrille = await grilleTarifaire
      .find(
        {
          _id: { $nin: [idGrille] },
          etatObjet: "code-1",
          produitAssocie: data.produitAssocie,
        },
        {},
        { sort: { quantiteInf: 1, quantiteSup: 1 } }
      )
      .lean();
    let dataToSave = [listGrille[0]]; // Start with the first grille as valid
    if (listGrille.length) {
      for (let i = 1; i < listGrille.length; i++) {
        const grille = listGrille[i];
        for (const savedGrille of dataToSave) {
          // Check for NEW GRILLE included in the OLD GRILLE
          if (
            (this.numberInRange(
              grille.dateDebut?.getTime(),
              savedGrille.dateDebut?.getTime(),
              savedGrille.dateFin?.getTime(),
              "1.1"
            ) ||
              this.numberInRange(
                grille.dateFin?.getTime(),
                savedGrille.dateDebut?.getTime(),
                savedGrille.dateFin?.getTime(),
                "1.2"
              )) &&
            (this.numberInRange(
              grille.quantiteInf,
              savedGrille.quantiteInf,
              savedGrille.quantiteSup,
              "1.3"
            ) ||
              this.numberInRange(
                grille.quantiteSup,
                savedGrille.quantiteInf,
                savedGrille.quantiteSup,
                "1.4"
              ) ||
              this.numberInRange(
                savedGrille.quantiteInf,
                grille.quantiteInf,
                grille.quantiteSup,
                "1.5"
              ) ||
              this.numberInRange(
                savedGrille.quantiteSup,
                grille.quantiteInf,
                grille.quantiteSup,
                "1.6"
              ))
          ) {
            console.log("case 1 break", { savedGrille, grille });
            return next({
              anomalie: true,
              error: "New grille included in the old grille",
              grille: savedGrille,
            });
          }
          // Check for OLD GRILLE included in the NEW GRILLE
          if (
            (this.numberInRange(
              savedGrille.dateDebut?.getTime(),
              grille.dateDebut?.getTime(),
              grille.dateFin?.getTime(),
              "2.1"
            ) ||
              this.numberInRange(
                savedGrille.dateFin?.getTime(),
                grille.dateDebut?.getTime(),
                grille.dateFin?.getTime(),
                "2.2"
              )) &&
            (this.numberInRange(
              grille.quantiteInf,
              savedGrille.quantiteInf,
              savedGrille.quantiteSup,
              "2.3"
            ) ||
              this.numberInRange(
                grille.quantiteSup,
                savedGrille.quantiteInf,
                savedGrille.quantiteSup,
                "2.4"
              ) ||
              this.numberInRange(
                savedGrille.quantiteInf,
                grille.quantiteInf,
                grille.quantiteSup,
                "2.5"
              ) ||
              this.numberInRange(
                savedGrille.quantiteSup,
                grille.quantiteInf,
                grille.quantiteSup,
                "2.6"
              ))
          ) {
            console.log("case 2 break", { savedGrille, grille });
            return next({
              anomalie: true,
              error: "Old grille included in the new grille",
              grille: savedGrille,
            });
          }
          // Check for QUANTITE_INF conflict
        }
        // If no conflict, save the grille
        dataToSave.push(grille);
      }
    }
    return next({ anomalie: false });
  } catch (error) {
    console.log("idGrille===>", idGrille);
    console.log("error===>", error);
  }
}

grilleTarifaireSchema.pre("save", async function (next) {
  console.log("thiq====>", this);
  // await checkAnomalie(this, next);
});

let prevState = null;
grilleTarifaireSchema.pre("findOneAndUpdate", async function (next) {
  try {
    // this.getQuery()["$and"]?.[0]?._id || this.getQuery()._id,
    let doc = await grilleTarifaire.findOne(this.getQuery()).lean();
    console.log("findOneAndUpdate===>", doc);
    // await checkAnomalie(
    //   this._update["$set"],
    //   next
    // );
    if (doc) {
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

grilleTarifaireSchema.post("save", async function (doc, next) {
  try {
    console.log("doc save", doc);

    if (doc.serviceSpecial) {
      publishUpdate(
        "update_items",
        doc.serviceSpecial,
        SERVICESPECIAL_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: { grilleTarifaire: doc._id },
        }
      );
    }

    if (this.produitAssocie) {
      await ProduitService.updateOne(
        { _id: this.produitAssocie.toString() },
        { $addToSet: { grilleAssocie: this._id } }
      );
    }

    if (this.instanceProduitServiceReservation) {
      publishUpdate(
        "update_items",
        doc.grilleTarifaire,
        INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: { grilleTarifaire: doc._id },
        }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
grilleTarifaireSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    let produitAssocie = GroupBy(doc, "produitAssocie");
    for (let item of Object.keys(produitAssocie)) {
      if (item)
        await ProduitService.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              grilleAssocie: { $each: produitAssocie[item].map((d) => d._id) },
            },
          }
        );
    }
    let serviceSpecial = GroupBy(doc, "serviceSpecial");
    for (let item of Object.keys(serviceSpecial)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(serviceSpecial[item].map((d) => d.serviceSpecial))
            ),
          ],
          SERVICESPECIAL_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              grilleTarifaire: {
                $each: serviceSpecial[item].map((i) => i._id),
              },
            },
          }
        );
    }

    let instanceProduitServiceReservation = GroupBy(
      doc,
      "instanceProduitServiceReservation"
    );

    for (let item of Object.keys(instanceProduitServiceReservation)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                instanceProduitServiceReservation[item].map(
                  (d) => d.instanceProduitServiceReservation
                )
              )
            ),
          ],
          INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              grilleTarifaire: {
                $each: instanceProduitServiceReservation[item].map(
                  (i) => i._id
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
grilleTarifaireSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await grilleTarifaire.findOne(this.getQuery()).lean();
    if (doc) {
      // itemToCheck["serviceSpecial"] = doc.serviceSpecial;
      // itemToCheck["serviceSpecial"] = doc.serviceSpecial;

      const produitAssocieId = this._update?.["$set"]?.produitAssocie;
      if (
        produitAssocieId &&
        doc?.produitAssocie != produitAssocieId &&
        doc?.produitAssocie != undefined
      )
        await ProduitService.updateOne(
          { _id: doc.produitAssocie.toString() },
          { $pull: { grilleAssocie: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
grilleTarifaireSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    // publishUpdate(
    //   "pullAndPush",
    //   { oldData: itemToCheck["serviceSpecial"], newData: doc.serviceSpecial },
    //   SERVICESPECIAL_ADMIN_QUEUE,
    //   {
    //     operation: "$pull",
    //     bodyPull: { grilleTarifaire: doc._id },
    //     bodyPush: { grilleTarifaire: doc._id },
    //   }
    // );
    // publishUpdate(
    //   "pullAndPush",
    //   { oldData: itemToCheck["serviceSpecial"], newData: doc.serviceSpecial },
    //   SERVICESPECIAL_ADMIN_QUEUE,
    //   {
    //     operation: "$pull",
    //     bodyPull: { grilleTarifaire: doc._id },
    //     bodyPush: { grilleTarifaire: doc._id },
    //   }
    // );
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.produitAssocie)
      await ProduitService.updateOne(
        { _id: doc.produitAssocie?._id?.toString() || doc.produitAssocie },
        { $addToSet: { grilleAssocie: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
grilleTarifaireSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await grilleTarifaire.find(this.getQuery()).lean();
      const promises = [];
      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.serviceSpecial)))],
          SERVICESPECIAL_ADMIN_QUEUE,
          { operation: "$pull", body: { grilleTarifaire: this.getQuery()._id } }
        );
        if (
          this._update?.["$set"]?.etatObjet?.includes("code-2") &&
          docs.modifiedCount /*new modifCount*/
        ) {
          publishUpdate(
            "update_items",
            [...new Set(flatDeep(doc.map((d) => d.serviceSpecial)))],
            SERVICESPECIAL_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { grilleTarifaire: this.getQuery()._id },
            }
          );

          publishUpdate(
            "update_items",
            [
              ...new Set(
                flatDeep(doc.map((d) => d.instanceProduitServiceReservation))
              ),
            ],
            INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { grilleTarifaire: this.getQuery()._id },
            }
          );

          communicateWithClient("postUpdateMany", this.getQuery());

          doc.map(() => {});
        } else if (
          Object.keys(this._update?.["$set"]).length == 1 &&
          this._update?.["$set"]?.etatObjet?.includes("code-1")
        ) {
          doc.map(() => {});
        }

        if (promises.length) await Promise.all(promises);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});
grilleTarifaireSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await grilleTarifaire.find(this.getQuery()).lean();
    const promises = [];

    doc.map(() => {});

    if (promises.length) await Promise.all(promises);

    next();
  } catch (error) {
    next(error);
  }
});
async function communicateWithClient(methode, doc, prevState, targetState) {
  try {
    if (methode == "postUpdateMany" || doc?.etatDePublication) {
      switch (methode) {
        case "preFindOneAndUpdate":
          if (
            targetState &&
            targetState != "code_3417" &&
            prevState == "code_3417"
          ) {
            await PublishMessage(GRILLETARIFAIRE_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(GRILLETARIFAIRE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(GRILLETARIFAIRE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          return;
        case "postUpdateMany":
          await PublishMessage(GRILLETARIFAIRE_CLIENT_QUEUE, {
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
    console.error("grilleTarifaire communicateWithClient error==>", error);
  }
}
//add other hooks here
const grilleTarifaire = mongoose.model(
  "grilleTarifaire",
  grilleTarifaireSchema
);
module.exports = grilleTarifaire;
const ProduitService = require("../models/produitService.model");

const {
  GroupBy,
  sendRPCRequest,
  publishUpdate,
  flatDeep,
} = require("../helpers/helpers");

const { PublishMessage } = require("../helpers/communications");

const {
  TAXONOMIE_ADMIN_RPC,
  GRILLETARIFAIRE_CLIENT_QUEUE,
  SERVICESPECIAL_ADMIN_QUEUE,
  SERVICESPECIAL_ADMIN_RPC,
  MONNAIE_ADMIN_RPC,
  INSTANCEPRODUITSERVICERESERVATION_ADMIN_QUEUE,
} = require("../config");
