const mongoose = require("mongoose");
const produitService = require("./produitService.model");
const produitAssocie = require("./produitAssocie.model");
const Schema = mongoose.Schema;

const elementProduitAssocieSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    quantiteMaxProduit: { type: Number, required: true },
    prixInclus: { type: Boolean, required: true },
    tarifIndicatif: [{ type: Schema.Types.ObjectId, ref: "tarifUIndicatif" }],
    refProduit: { type: Schema.Types.ObjectId, ref: "produitService" },
    produitAssocie: { type: Schema.Types.ObjectId, ref: "produitAssocie" },
  },

  { timestamps: true }
);

elementProduitAssocieSchema.pre("aggregate", function (next) {
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
elementProduitAssocieSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      { path: "tarifIndicatif", match: { etatObjet: "code-1" }, populate: [] },
    ]);
    next();
  } catch (error) {
    next(error);
  }
});

elementProduitAssocieSchema.post("save", async function (doc, next) {
  try {
    if (this.refProduit) {
      await produitService.updateOne(
        { _id: this.refProduit.toString() },
        { $addToSet: { elementProduitAssocie: this._id } }
      );
    }
    if (this.produitAssocie) {
      await produitAssocie.updateOne(
        { _id: this.produitAssocie.toString() },
        { $addToSet: { elementProduitAssocie: this._id } }
      );
    }

    next();
  } catch {
    next(error);
  }
});
//rewrite insertMany
elementProduitAssocieSchema.post("insertMany", async function (doc, next) {
  try {
    let refProduit = GroupBy(doc, "refProduit");
    for (let item of Object.keys(refProduit)) {
      if (item)
        await produitService.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              elementProduitAssocie: {
                $each: refProduit[item].map((d) => d._id),
              },
            },
          }
        );
    }

    let produitAssocieItem = GroupBy(doc, "produitAssocie");
    for (let item of Object.keys(produitAssocieItem)) {
      if (item)
        await produitAssocie.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              elementProduitAssocie: {
                $each: produitAssocieItem[item].map((d) => d._id),
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
elementProduitAssocieSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await elementProduitAssocie.findOne(this.getQuery()).lean();
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
        await produitService.updateOne(
          { _id: doc.refProduit.toString() },
          { $pull: { elementProduitAssocie: doc._id } }
        );
      const produitAssocieId = this._update?.["$set"]?.produitAssocie;

      if (
        produitAssocieId &&
        doc?.produitAssocie != produitAssocieId &&
        doc?.produitAssocie != undefined
      )
        await produitAssocie.updateOne(
          { _id: doc.produitAssocie.toString() },
          { $pull: { elementProduitAssocie: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
elementProduitAssocieSchema.post(
  "findOneAndUpdate",
  async function (doc, next) {
    try {
      communicateWithClient("postFindOneAndUpdate", doc, prevState);
      if (doc.refProduit)
        await produitService.updateOne(
          { _id: doc.refProduit?._id?.toString() || doc.refProduit },
          { $addToSet: { elementProduitAssocie: doc._id } }
        );
      if (doc.produitAssocie)
        await produitAssocie.updateOne(
          { _id: doc.produitAssocie?._id?.toString() || doc.produitAssocie },
          { $addToSet: { elementProduitAssocie: doc._id } }
        );
      next();
    } catch (error) {
      next(error);
    }
  }
);

elementProduitAssocieSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await elementProduitAssocie.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        communicateWithClient("postUpdateMany", this.getQuery());

        let refProduit = [];
        let produitAssocieItem = [];
        doc.map((d) => {
          refProduit.push(d.refProduit.map((v) => v._id || v));
          produitAssocieItem.push(d.produitAssocie.map((v) => v._id || v));
        });
        if (refProduit.length) {
          promises.push(
            produitService
              .updateMany(
                { _id: { $in: refProduit } },
                { $set: { etatObjet: "code-2" } }
              )
              .exec()
          );
        }
        if (produitAssocieItem.length) {
          promises.push(
            produitAssocie
              .updateMany(
                { _id: { $in: produitAssocieItem } },
                { $set: { etatObjet: "code-2" } }
              )
              .exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let refProduit = [];
        let produitAssocieItem = [];
        doc.map((d) => {
          refProduit.push(d.refProduit.map((v) => v._id || v));
          produitAssocieItem.push(d.produitAssocie.map((v) => v._id || v));
        });
        if (refProduit.length) {
          promises.push(
            produitService
              .updateMany(
                { _id: { $in: refProduit } },
                { $set: { etatObjet: "code-1" } }
              )
              .exec()
          );
        }
        if (produitAssocieItem.length) {
          promises.push(
            produitAssocie
              .updateMany(
                { _id: { $in: produitAssocieItem } },
                { $set: { etatObjet: "code-1" } }
              )
              .exec()
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
elementProduitAssocieSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await elementProduitAssocie.find(this.getQuery()).lean();
    const promises = [];
    let refProduit = [];
    let produitAssocieItem = [];
    doc.map((d) => {
      refProduit.push(d.refProduit.map((v) => v._id || v));
      produitAssocieItem.push(d.produitAssocie.map((v) => v._id || v));
    });

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
            await PublishMessage(ELEMENTPRODUITASSOCIE_CLIENT_QUEUE, {
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
const elementProduitAssocie = mongoose.model(
  "elementProduitAssocie",
  elementProduitAssocieSchema
);

module.exports = elementProduitAssocie;

const {
  ELEMENTPRODUITASSOCIE_CLIENT_QUEUE,
  GRILLETARIFAIRE_CLIENT_QUEUE,
} = require("../config");
const { GroupBy } = require("../helpers/helpers");
