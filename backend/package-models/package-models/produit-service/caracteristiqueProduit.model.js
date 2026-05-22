const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let caracteristiqueProduitSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    natureCaracteristique: {
      type: String,
      required: true,
      enum: ["code_3622", "code_8351"],
    },
    refcaracteristique: { type: String, required: true, unique: true },
    affichageUniqEnPrive: { type: Boolean, required: true },
    ordreCaracteristique: { type: Number, required: true },
    produitPrincipal: { type: Schema.Types.ObjectId, ref: "produitService" },
    refProduitAssocie: { type: Schema.Types.ObjectId, ref: "produitAssocie" },
    instanceCaracteristique: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

caracteristiqueProduitSchema.pre("aggregate", function (next) {
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
caracteristiqueProduitSchema.pre(/find.*/, function (next) {
  try {
    this.populate([]);
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
              INSTANCECARACTERISTIQUE_ADMIN_RPC,
              ["instanceCaracteristique"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObjetConcerne" } }
            ),
          ]
          : [
            sendRPCRequest(
              doc,
              INSTANCECARACTERISTIQUE_ADMIN_RPC,
              ["instanceCaracteristique"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObjetConcerne" } }
            ),
          ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (
              d["instanceCaracteristique"] &&
              d["instanceCaracteristique"].length
            )
              d["instanceCaracteristique"] = d["instanceCaracteristique"].map(
                (d) =>
                  (d = result[0].find((item) => item._id == (d._id || d)) || d)
              );
          });
        } else {
          if (
            doc["instanceCaracteristique"] &&
            doc["instanceCaracteristique"].length
          )
            doc["instanceCaracteristique"] = doc["instanceCaracteristique"].map(
              (d) =>
                (d = result[0].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
caracteristiqueProduitSchema.post(/find.*|save/, async function (doc) {
  try {
    await distantRequest(doc);
  } catch (error) {
    console.error(
      "error while getting distant data for model caracteristiqueProduit==>",
      error
    );
  }
});

caracteristiqueProduitSchema.post("save", async function (doc, next) {
  try {
    if (this.produitPrincipal) {
      await ProduitService.updateOne(
        { _id: this.produitPrincipal.toString() },
        { $addToSet: { caracteristiqueAssocie: this._id } }
      );
    }
    if (this.refProduitAssocie) {
      await ProduitAssocie.updateOne(
        { _id: this.refProduitAssocie.toString() },
        { $addToSet: { caracteristiqueAssocie: this._id } }
      );
    }

    if (doc.instanceCaracteristique.length)
      publishUpdate(
        "update_items",
        doc.instanceCaracteristique,
        INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "CARACTERISTIQUEPRODUIT_PRODUITSETVICE",
          },
        }
      );

    next();
  } catch (error) {
    console.log(error)
    next(error);
  }
});
//rewrite insertMany
caracteristiqueProduitSchema.post("insertMany", async function (doc, next) {
  try {
    let produitPrincipal = GroupBy(doc, "produitPrincipal");
    for (let item of Object.keys(produitPrincipal)) {
      if (item)
        await ProduitService.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              caracteristiqueAssocie: {
                $each: produitPrincipal[item].map((d) => d._id),
              },
            },
          }
        );
    }

    let refProduitAssocie = GroupBy(doc, "refProduitAssocie");
    for (let item of Object.keys(refProduitAssocie)) {
      if (item)
        await ProduitAssocie.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              caracteristiqueAssocie: {
                $each: refProduitAssocie[item].map((d) => d._id),
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

caracteristiqueProduitSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await caracteristiqueProduit.findOne(this.getQuery()).lean();

    if (doc) {
      itemToCheck["instanceCaracteristique"] = doc.instanceCaracteristique;
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );

      const produitPrincipalId = this._update?.["$set"]?.produitPrincipal;
      if (
        produitPrincipalId &&
        doc?.produitPrincipal != produitPrincipalId &&
        doc?.produitPrincipal != undefined
      )
        await ProduitService.updateOne(
          { _id: doc.produitPrincipal.toString() },
          { $pull: { caracteristiqueAssocie: doc._id } }
        );
      const refProduitAssocieId = this._update?.["$set"]?.refProduitAssocie;
      if (
        doc?.refProduitAssocie != refProduitAssocieId &&
        doc?.refProduitAssocie != undefined
      )
        await ProduitAssocie.updateOne(
          { _id: doc.refProduitAssocie.toString() },
          { $pull: { caracteristiqueAssocie: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
caracteristiqueProduitSchema.post(
  "findOneAndUpdate",
  async function (doc, next) {
    try {
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["instanceCaracteristique"],
          newData: doc.instanceCaracteristique,
        },
        INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
          bodyPush: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "CARACTERISTIQUEPRODUIT_PRODUITSETVICE",
          },
        }
      );
      communicateWithClient("postFindOneAndUpdate", doc, prevState);

      if (doc.produitPrincipal)
        await ProduitService.updateOne(
          {
            _id: doc.produitPrincipal?._id?.toString() || doc.produitPrincipal,
          },
          { $addToSet: { caracteristiqueAssocie: doc._id } }
        );
      if (doc.refProduitAssocie)
        await ProduitAssocie.updateOne(
          {
            _id:
              doc.refProduitAssocie?._id?.toString() || doc.refProduitAssocie,
          },
          { $addToSet: { caracteristiqueAssocie: doc._id } }
        );
      next();
    } catch (error) {
      next(error);
    }
  }
);
caracteristiqueProduitSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await caracteristiqueProduit.find(this.getQuery()).lean();
      const promises = [];
      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.instanceCaracteristique)))],
          INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );

        communicateWithClient("postUpdateMany", this.getQuery());

        doc.map((d) => { });
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        doc.map((d) => { });
      }

      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
caracteristiqueProduitSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await caracteristiqueProduit.find(this.getQuery()).lean();
    const promises = [];

    doc.map((d) => { });

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
            await PublishMessage(CARACTERISTIQUEPRODUIT_CLIENT_QUEUE, {
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
            await PublishMessage(CARACTERISTIQUEPRODUIT_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(CARACTERISTIQUEPRODUIT_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc.instanceCaracteristique.length)
            publishUpdate(
              "publish_data",
              doc.instanceCaracteristique,
              INSTANCECARACTERISTIQUE_ADMIN_QUEUE
            );

          return;
        case "postUpdateMany":
          await PublishMessage(CARACTERISTIQUEPRODUIT_CLIENT_QUEUE, {
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
      "caracteristiqueProduit communicateWithClient error==>",
      error
    );
  }
}
//add other hooks here
const caracteristiqueProduit = mongoose.model(
  "caracteristiqueProduit",
  caracteristiqueProduitSchema
);
module.exports = caracteristiqueProduit;
const ProduitService = require("../models/produitService.model");
const ProduitAssocie = require("../models/produitAssocie.model");


const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");

const {
  INSTANCECARACTERISTIQUE_ADMIN_RPC,
  INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
} = require("../config");

const { CARACTERISTIQUEPRODUIT_CLIENT_QUEUE } = require("../config");
