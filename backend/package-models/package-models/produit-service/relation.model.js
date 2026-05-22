const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let relationSchema = new Schema(
  {
    etatDePublication: { type: String, default: "etatDeCreation.creation" },
    etatObjet: { type: String, default: "code-1" },
    typeRelation: { type: String, required: true },
    produitPrincipale: {
      type: Schema.Types.ObjectId,
      ref: "instanceProduitService",
    },
    produitAssocie: [
      { type: Schema.Types.ObjectId, ref: "instanceProduitService" },
    ],
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [
  { path: "produitAssocie", match: { etatObjet: "code-1" }, populate: [] },
];
relationSchema.pre("aggregate", function (next) {
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
relationSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
let prevState = null;

relationSchema.post("save", async function (doc, next) {
  try {
    if (this.produitPrincipale) {
      await InstanceProduitService.updateOne(
        { _id: this.produitPrincipale.toString() },
        { $addToSet: { relation: this._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
relationSchema.post("insertMany", async function (doc, next) {
  try {
    this.populate(doc, populateField);

    let produitPrincipale = GroupBy(doc, "produitPrincipale");
    console.log("🚀 ~ produitPrincipale:", produitPrincipale);
    for (let item of Object.keys(produitPrincipale)) {
      if (item) {
        console.log("🚀 ~ item:", item);

        await InstanceProduitService.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              relation: { $each: produitPrincipale[item].map((d) => d._id) },
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
relationSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await relation.findOne(this.getQuery()).lean();

    if (doc) {
      const produitPrincipaleId = this._update?.["$set"]?.produitPrincipale;
      if (
        produitPrincipaleId &&
        doc?.produitPrincipale != produitPrincipaleId &&
        doc?.produitPrincipale != undefined
      ) {
        await InstanceProduitService.updateOne(
          { _id: doc.produitPrincipale.toString() },
          { $pull: { relation: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
relationSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    if (doc.produitPrincipale) {
      await InstanceProduitService.updateOne(
        {
          _id: doc.produitPrincipale?._id?.toString() || doc.produitPrincipale,
        },
        { $addToSet: { relation: doc._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
relationSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await relation.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        let produitAssocie = [];
        doc.map((d) => {
          produitAssocie.push(...d.produitAssocie.map((v) => v._id || v));
        });
        if (produitAssocie.length) {
          promises.push(
            InstanceProduitService.updateMany(
              { _id: { $in: produitAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let produitAssocie = [];

        doc.map((d) => {
          produitAssocie.push(...d.produitAssocie.map((v) => v._id || v));
        });
        if (produitAssocie.length) {
          promises.push(
            InstanceProduitService.updateMany(
              { _id: { $in: produitAssocie } },
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
relationSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await relation.find(this.getQuery()).lean();
    const promises = [];
    let produitAssocie = [];
    doc.map((d) => {
      produitAssocie.push(...d.produitAssocie.map((v) => v._id || v));
    });
    if (produitAssocie.length) {
      promises.push(
        InstanceProduitService.deleteMany({
          _id: { $in: produitAssocie },
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
    console.error("relation communicateWithClient error==>", error);
  }
}

//add other hooks here
const relation = mongoose.model("relation", relationSchema);
module.exports = relation;
const InstanceProduitService = require("../models/instanceProduitService.model");
const { GroupBy } = require("../helpers/helpers");
