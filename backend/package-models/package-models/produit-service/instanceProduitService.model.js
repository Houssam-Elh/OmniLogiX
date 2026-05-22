const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let instanceProduitServiceSchema = new Schema(
  {
    etatDePublication: { type: String, default: "etatDeCreation.creation" },
    etatObjet: { type: String, default: "code-1" },
    categorieProduit: { type: Schema.Types.Mixed, required: true },
    translations: {
      type: [
        {
          languages: { type: String },
          designation: { type: String, required: true },
          descritpion: { type: String },
        },
      ],
    },
    photo: { type: String },
    quantiteProduit: { type: Number, required: true },
    uniteQuantite: { type: Schema.Types.Mixed, required: true },
    montantHt: { type: Number, required: true },
    montantRemise: { type: Number, required: true },
    montantTVATaxesAssocie: { type: Number, required: true },
    relation: [{ type: Schema.Types.ObjectId, ref: "relation" }],
    produitService: { type: ObjectId },
    instanceAssurance: { type: [ObjectId] },
    instanceReservation: { type: Schema.Types.ObjectId },
    instruction: { type: [ObjectId] },
    actionEntreprendre: { type: [ObjectId] },
    acteurConcerne: { type: [ObjectId] },
    lieu: { type: [ObjectId] },
    event: { type: Schema.Types.ObjectId },
    beneficiare: {
      type: [
        {
          translations: {
            type: [
              {
                language: { type: String },
                nom: { type: String, required: true },
                prenom: { type: String, required: true },
              },
            ],
          },

          email: { type: String, required: true },
          telephone: { type: String, required: true },
        },
      ],
    },

    livraison: {
      livreur: { type: Schema.Types.ObjectId },
      tarifExpedition: { type: Schema.Types.ObjectId },
    },

    //#region new attribut declaration
    //#endregion
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [];
instanceProduitServiceSchema.pre("aggregate", function (next) {
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
instanceProduitServiceSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

//rewrite insertMany
instanceProduitServiceSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    this.populate(doc, populateField);

    let relation = GroupBy(doc, "relation");
    // for (let item of Object.keys(relation)) {
    //   if (item)
    //     await Relation.updateOne(
    //       { _id: item.toString() },
    //       {
    //         $addToSet: {
    //           produitAssocie: { $each: relation[item].map((d) => d._id) },
    //         },
    //       }
    //     );
    // }

    let event = GroupBy(doc, "event");
    for (let item of Object.keys(event)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(event[item].map((d) => d.event)))],
          AGENDAEVENT_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { produitServices: { $each: event[item].map((i) => i._id) } },
          }
        );
    }
    let instanceReservation = GroupBy(doc, "instanceReservation");
    for (let item of Object.keys(instanceReservation)) {
      if (item) {
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                instanceReservation[item].map((d) => d.instanceReservation)
              )
            ),
          ],
          INSTANCERESERVATION_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              instanceProduitServiceConcerne: {
                $each: instanceReservation[item].map((i) => i._id),
              },
            },
          }
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// hooks
let prevState = null;
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
                ["categorieProduit", "uniteQuantite"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                PRODUITSERVICE_ADMIN_RPC,
                ["produitService"],
                "VIEW_ITEMS",
                {}
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["categorieProduit", "uniteQuantite"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                PRODUITSERVICE_ADMIN_RPC,
                ["produitService"],
                "VIEW_ITEMS",
                {}
              ),
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
            if (d["uniteQuantite"])
              d["uniteQuantite"] =
                result[0].find(
                  (item) =>
                    item._id == (d["uniteQuantite"]._id || d["uniteQuantite"])
                ) || d["uniteQuantite"];

            if (d["produitService"])
              d["produitService"] =
                result[1].find(
                  (item) =>
                    item._id == (d["produitService"]._id || d["produitService"])
                ) || d["produitService"];
          });
        } else {
          if (doc["categorieProduit"])
            doc["categorieProduit"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["categorieProduit"]._id || doc["categorieProduit"])
              ) || doc["categorieProduit"];
          if (doc["uniteQuantite"])
            doc["uniteQuantite"] =
              result[0].find(
                (item) =>
                  item._id == (doc["uniteQuantite"]._id || doc["uniteQuantite"])
              ) || doc["uniteQuantite"];

          if (doc["produitService"])
            doc["produitService"] =
              result[1].find(
                (item) =>
                  item._id ==
                  (doc["produitService"]._id || doc["produitService"])
              ) || doc["produitService"];
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
instanceProduitServiceSchema.post(/find.*|save/, async function (doc, next) {
  try {
    if (doc) await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

instanceProduitServiceSchema.post("save", async function (doc, next) {
  try {
    // if (this.relation) {
    //   await Relation.updateOne(
    //     { _id: this.relation.toString() },
    //     { $addToSet: { produitAssocie: this._id } }
    //   );
    // }

    if (this.relation.length) {
      await Relation.updateMany(
        { _id: { $in: this.relation.map((v) => v._id || v) } },
        { $addToSet: { produitAssocie: this._id } }
      );
    }

    if (doc.event)
      publishUpdate("update_items", doc.event, AGENDAEVENT_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { produitServices: doc._id },
      });
    if (doc.instanceReservation)
      publishUpdate(
        "update_items",
        doc.instanceReservation,
        INSTANCERESERVATION_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: { instanceProduitServiceConcerne: doc._id },
        }
      );

    next();
  } catch (error) {
    next(error);
  }
});

let itemToCheck = {};

instanceProduitServiceSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await instanceProduitService.findOne(this.getQuery()).lean();

    if (doc) {
      itemToCheck["event"] = doc.event;
      itemToCheck["instanceReservation"] = doc.instanceReservation;
      const relationId = this._update?.["$set"]?.relation;
      if (
        relationId &&
        doc?.relation != relationId &&
        doc?.relation != undefined
      ) {
        await Relation.updateOne(
          { _id: doc.relation.toString() },
          { $pull: { produitAssocie: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
instanceProduitServiceSchema.post(
  "findOneAndUpdate",
  async function (doc, next) {
    try {
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["event"], newData: doc.event },
        AGENDAEVENT_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { produitServices: doc._id },
          bodyPush: { produitServices: doc._id },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["instanceReservation"],
          newData: doc.instanceReservation,
        },
        INSTANCERESERVATION_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { instanceProduitServiceConcerne: doc._id },
          bodyPush: { instanceProduitServiceConcerne: doc._id },
        }
      );
      // if (doc.relation) {
      //   await Relation.updateOne(
      //     { _id: doc.relation?._id?.toString() || doc.relation },
      //     { $addToSet: { produitAssocie: doc._id } }
      //   );
      // }
      next();
    } catch (error) {
      next(error);
    }
  }
);
instanceProduitServiceSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await instanceProduitService.find(this.getQuery()).lean();

      const promises = [];

      if (this.cart) {
        await cart.updateOne(
          { _id: doc.cart },
          { $addToSet: { instanceProduit: doc._id } },
        );
      }



      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.event)))],
          AGENDAEVENT_ADMIN_QUEUE,
          { operation: "$pull", body: { produitServices: this.getQuery()._id } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.instanceReservation)))],
          INSTANCERESERVATION_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { instanceProduitServiceConcerne: this.getQuery()._id },
          }
        );

        let relation = [];
        doc.map((d) => {
          relation.push(...d.relation.map((v) => v._id || v));
        });
        if (relation.length) {
          promises.push(
            Relation.updateMany(
              { _id: { $in: relation } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }

        let relations = await Relation.find({
          produitAssocie: this.getQuery()._id,
        }).lean();

        for (let rlt of relations) {
          if (rlt.produitAssocie.length == 0) {
            await instanceProduitService.updateOne(
              {
                _id: rlt.produitPrincipale,
              },
              {
                $pull: {
                  relation: rlt._id,
                },
              }
            );
          }
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let relation = [];

        doc.map((d) => {
          relation.push(...d.relation.map((v) => v._id || v));
        });
        if (relation.length) {
          promises.push(
            Relation.updateMany(
              { _id: { $in: relation } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
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
instanceProduitServiceSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await instanceProduitService.find(this.getQuery()).lean();
    const promises = [];
    let relation = [];
    doc.map((d) => {
      relation.push(...d.relation.map((v) => v._id || v));
    });
    if (relation.length) {
      promises.push(Relation.deleteMany({ _id: { $in: relation } }).exec());
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
          return;
        case "postFindOneAndUpdate":
          return;
        case "postUpdateMany":
          return;

        case "publishData":
          return;

        case "translate":
          return;
      }
    }
  } catch (error) {
    console.error(
      "instanceProduitService communicateWithClient error==>",
      error
    );
  }
}

//add other hooks here
const instanceProduitService = mongoose.model(
  "instanceProduitService",
  instanceProduitServiceSchema
);
module.exports = instanceProduitService;
const Relation = require("../models/relation.model");

const {
  sendRPCRequest,
  publishUpdate,
  GroupBy,
  copyFiles,
  removeFiles,
  flatDeep,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  AGENDAEVENT_ADMIN_RPC,
  AGENDAEVENT_ADMIN_QUEUE,
  INSTANCERESERVATION_ADMIN_RPC,
  INSTANCERESERVATION_ADMIN_QUEUE,
  PRODUITSERVICE_ADMIN_RPC,
} = require("../config");
