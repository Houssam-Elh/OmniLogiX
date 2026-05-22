const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let produitAssocieSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    translations: {
      type: [{ language: { type: String }, designation: { type: String } }],
    },

    typeProduitAssocie: {
      type: String,
      required: true,
      enum: ["code_13564", "code_6545", "code_1295", "code_13565", "code_3034"],
    },
    quantiteTotalUnite: { type: Number, required: true },
    quantiteProduitAssocie: { type: Number, required: true },
    refProduit: { type: Schema.Types.ObjectId, ref: "produitService" },
    elementProduitAssocie: [
      { type: Schema.Types.ObjectId, ref: "elementProduitAssocie" },
    ],
    caracteristiqueAssocie: [
      { type: Schema.Types.ObjectId, ref: "caracteristiqueProduit" },
    ],
    // typeAssociation: { type: Schema.Types.Mixed },
    // typeProduit: {
    //   type: String,
    //   required: true,
    //   enum: [
    //     "code_8373",
    //     "code_8374",
    //     "code_8403",
    //     "code_8404",
    //     "code_8405",
    //     "code_8406",
    //   ],
    // },
    // quantite: { type: Number, required: true },
    // uniteQuanttite: { type: Schema.Types.Mixed, required: true },
    // coutAdditionnel: { type: Boolean, required: true },
    // typeCoutAdditionnel: {
    //   type: String,
    // },
    // valeurCoutAdditionnel: { type: Number },
    // prixDefaut: { type: Number, required: true },
    // refProduit: { type: Schema.Types.ObjectId, ref: "produitService" },
    // arrayRefProduit: [{ type: Schema.Types.ObjectId, ref: "produitService" }],
    // caracteristiqueAssocie: [
    //   { type: Schema.Types.ObjectId, ref: "caracteristiqueProduit" },
    // ],
  },
  { timestamps: true }
);

//  autoPopulate hook

/*new20*/ async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["typeAssociation", "uniteQuanttite"],
              "VIEW_ITEMS",
              {}
            ),
          ]
          : [
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["typeAssociation", "uniteQuanttite"],
              "VIEW_ITEMS",
              {}
            ),
          ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["typeAssociation"])
              d["typeAssociation"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["typeAssociation"]._id || d["typeAssociation"])
                ) || d["typeAssociation"];
            if (d["uniteQuanttite"])
              d["uniteQuanttite"] =
                result[0].find(
                  (item) =>
                    item._id == (d["uniteQuanttite"]._id || d["uniteQuanttite"])
                ) || d["uniteQuanttite"];
          });
        } else {
          if (doc["typeAssociation"])
            doc["typeAssociation"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["typeAssociation"]._id || doc["typeAssociation"])
              ) || doc["typeAssociation"];
          if (doc["uniteQuanttite"])
            doc["uniteQuanttite"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["uniteQuanttite"]._id || doc["uniteQuanttite"])
              ) || doc["uniteQuanttite"];
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
produitAssocieSchema.pre("aggregate", function (next) {
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
produitAssocieSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      // { path: "typeAssociation", match: { etatObjet: "code-1" }, populate: [] },
      // { path: "uniteQuanttite", match: { etatObjet: "code-1" }, populate: [] },
      // { path: "arrayRefProduit", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "caracteristiqueAssocie",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "elementProduitAssocie",
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

produitAssocieSchema.post("save", async function (doc, next) {
  try {
    if (this.refProduit) {
      await ProduitService.updateOne(
        { _id: this.refProduit.toString() },
        { $addToSet: { produitAssocie: this._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
produitAssocieSchema.post("insertMany", async function (doc, next) {
  try {
    let refProduit = GroupBy(doc, "refProduit");
    for (let item of Object.keys(refProduit)) {
      if (item)
        await ProduitService.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              produitAssocie: { $each: refProduit[item].map((d) => d._id) },
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
produitAssocieSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await produitAssocie.findOne(this.getQuery()).lean();
    if (doc) {
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );

      const refProduitId = this._update?.["$set"]?.refProduit;
      if (
        refProduitId &&
        doc?.refProduit != refProduitId &&
        doc?.refProduit != undefined
      )
        await ProduitService.updateOne(
          { _id: doc.refProduit.toString() },
          { $pull: { produitAssocie: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
produitAssocieSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.refProduit)
      await ProduitService.updateOne(
        { _id: doc.refProduit?._id?.toString() || doc.refProduit },
        { $addToSet: { produitAssocie: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
produitAssocieSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await produitAssocie.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        communicateWithClient("postUpdateMany", this.getQuery());

        let elementProduitAssocie = [];
        let caracteristiqueAssocie = [];
        doc.map((d) => {
          elementProduitAssocie.push(
            ...d.elementProduitAssocie.map((v) => v._id || v)
          );
          caracteristiqueAssocie.push(
            ...d.caracteristiqueAssocie.map((v) => v._id || v)
          );
        });
        if (elementProduitAssocie.length) {
          promises.push(
            ElementProduitAssocie.updateMany(
              { _id: { $in: elementProduitAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
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
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let elementProduitAssocie = [];
        let caracteristiqueAssocie = [];

        doc.map((d) => {
          elementProduitAssocie.push(
            ...d.elementProduitAssocie.map((v) => v._id || v)
          );
          caracteristiqueAssocie.push(
            ...d.caracteristiqueAssocie.map((v) => v._id || v)
          );
        });
        if (elementProduitAssocie.length) {
          promises.push(
            ElementProduitAssocie.updateMany(
              { _id: { $in: elementProduitAssocie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
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
      }

      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
produitAssocieSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await produitAssocie.find(this.getQuery()).lean();
    const promises = [];
    let elementProduitAssocie = [];
    let caracteristiqueAssocie = [];
    doc.map((d) => {
      elementProduitAssocie.push(
        ...d.elementProduitAssocie.map((v) => v._id || v)
      );
      caracteristiqueAssocie.push(
        ...d.caracteristiqueAssocie.map((v) => v._id || v)
      );
    });
    if (elementProduitAssocie.length) {
      promises.push(
        ElementProduitAssocie.deleteMany({
          _id: { $in: elementProduitAssocie },
        }).exec()
      );
    }
    if (caracteristiqueAssocie.length) {
      promises.push(
        CaracteristiqueProduit.deleteMany({
          _id: { $in: caracteristiqueAssocie },
        }).exec()
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
    if (methode == "postUpdateMany" || doc?.etatDePublication) {
      switch (methode) {
        case "preFindOneAndUpdate":
          if (
            targetState &&
            targetState != "code_3417" &&
            prevState == "code_3417"
          ) {
            await PublishMessage(PRODUITASSOCIE_CLIENT_QUEUE, {
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
            await PublishMessage(PRODUITASSOCIE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(PRODUITASSOCIE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            if (doc?.elementProduitAssocie?.length) {
              PublishElementProduitAssocie(doc.elementProduitAssocie);
            }
            if (doc?.caracteristiqueAssocie?.length) {
              PublishCaracteristiqueProduit(doc.caracteristiqueAssocie);
            }
          }
          return;
        case "postUpdateMany":
          await PublishMessage(PRODUITASSOCIE_CLIENT_QUEUE, {
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
    console.error("produitAssocie communicateWithClient error==>", error);
  }
}
//add other hooks here
const produitAssocie = mongoose.model("produitAssocie", produitAssocieSchema);
module.exports = produitAssocie;
const ElementProduitAssocie = require("../models/elementProduitAssocie.model");
const CaracteristiqueProduit = require("../models/caracteristiqueProduit.model");

const { GroupBy } = require("../helpers/helpers");


const { PublishMessage } = require("../helpers/communications");

const {
  PublishData: PublishElementProduitAssocie,
} = require("./repositories/elementProduitAssocie.repositorie");
const {
  PublishData: PublishCaracteristiqueProduit,
} = require("./repositories/caracteristiqueProduit.repositorie");
const ProduitService = require("./produitService.model");

const {
  TAXONOMIE_ADMIN_RPC,
  PRODUITASSOCIE_CLIENT_QUEUE,
} = require("../config");

const { sendRPCRequest } = require("../helpers/helpers");
