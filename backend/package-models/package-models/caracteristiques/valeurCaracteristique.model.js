const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let valeurCaracteristiqueSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    reference: { type: String, required: true, unique: true },
    ordre: { type: Number, required: true, default: 1 },
    translations: {
      type: [
        {
          language: { type: String },
          valeurChar: { type: String },
        },
      ],
    },
    valeurNotChar: { type: Object },
    default: { type: Boolean, required: true },
    caracteriristique: {
      type: Schema.Types.ObjectId,
      ref: "caracteristiqueDemandable",
      required: true,
    },
    icone: { type: String },
    imageRepresentative: { type: String },
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [];
valeurCaracteristiqueSchema.pre("aggregate", function (next) {
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
valeurCaracteristiqueSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
let prevState = null;
async function checkIfExist(data) {
  let count = 0;
  if (data.caracteriristique) {
    if (data.valeurNotChar)
      count = await valeurCaracteristique.countDocuments({
        _id: { $ne: data._id },
        etatObjet: "code-1",
        caracteriristique: (
          data.caracteriristique._id || data.caracteriristique
        ).toString(),
        valeurNotChar: data.valeurNotChar,
      });
    else if (data["translations.$"])
      count = await valeurCaracteristique.countDocuments({
        _id: { $ne: data._id },
        etatObjet: "code-1",
        caracteriristique: (
          data.caracteriristique._id || data.caracteriristique
        ).toString(),
        "translations.valeurChar": data["translations.$"].valeurChar,
        "translations.language": data["translations.$"].language,
      });
  }
  if (count) throw { dup: count };
}
valeurCaracteristiqueSchema.pre("save", async function (next) {
  try {
    await checkIfExist(this);
    next();
  } catch (error) {
    next(error);
  }
});
valeurCaracteristiqueSchema.post("save", async function (doc, next) {
  try {
    if (this.caracteriristique) {
      await CaracteristiqueDemandable.updateOne(
        { _id: this.caracteriristique.toString() },
        { $addToSet: { valeurs: this._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
valeurCaracteristiqueSchema.post("insertMany", async function (doc, next) {
  try {
    this.populate(doc, populateField);

    let caracteriristique = GroupBy(doc, "caracteriristique");
    for (let item of Object.keys(caracteriristique)) {
      if (item)
        await CaracteristiqueDemandable.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              valeurs: { $each: caracteriristique[item].map((d) => d._id) },
            },
          }
        );
    }

    next();
  } catch (error) {
    next(error);
  }
});
valeurCaracteristiqueSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await valeurCaracteristique.findOne(this.getQuery()).lean();
    if (doc) {
      await checkIfExist({ ...doc, ...this._update?.["$set"] });
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const caracteriristiqueId = this._update?.["$set"]?.caracteriristique;
      if (
        caracteriristiqueId &&
        doc?.caracteriristique != caracteriristiqueId &&
        doc?.caracteriristique != undefined
      ) {
        await CaracteristiqueDemandable.updateOne(
          { _id: doc.caracteriristique.toString() },
          { $pull: { valeurs: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
valeurCaracteristiqueSchema.post(
  "findOneAndUpdate",
  async function (doc, next) {
    try {
      communicateWithClient("postFindOneAndUpdate", doc, prevState);
      if (doc.caracteriristique) {
        await CaracteristiqueDemandable.updateOne(
          {
            _id:
              doc.caracteriristique?._id?.toString() || doc.caracteriristique,
          },
          { $addToSet: { valeurs: doc._id } }
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  }
);
valeurCaracteristiqueSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await valeurCaracteristique.find(this.getQuery()).lean();
      console.log({ doc });
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        try {
          let docsToUpdate = await valeurCaracteristique
            .find({
              _id: { $nin: doc.map((d) => d._id) },
              etatObjet: "code-1",
              caracteriristique: doc[0].caracteriristique,
            })
            .select("_id")
            .lean();
          console.log({ docsToUpdate });
          if (docsToUpdate.length) {
            let promises = [];
            for (let [i, item] of docsToUpdate.entries())
              promises.push(
                valeurCaracteristique.findOneAndUpdate(
                  { _id: item._id },
                  { $set: { ordre: i + 1 } },
                  { new: true }
                )
              );
            Promise.all(promises).then(
              (result) => {
                // console.log({ result });
              },
              (error) => {
                console.log("err===>", error);
              }
            );
          }
        } catch (error) {
          console.log("error===>", error);
        }
        let files = [];

        doc.map((d) => {
          if (d.imageRepresentative) files.push(d.imageRepresentative);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        doc.map((d) => {});
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        doc.map((d) => {});
      }

      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
valeurCaracteristiqueSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await valeurCaracteristique.find(this.getQuery()).lean();
    const promises = [];

    doc.map((d) => {});

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
            await PublishMessage(VALEURCARACTERISTIQUE_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            doc.map((d) => {
              if (d.imageRepresentative) files.push(d.imageRepresentative);
            });

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(VALEURCARACTERISTIQUE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(VALEURCARACTERISTIQUE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            let files = [];
            doc.map((d) => {
              if (d.imageRepresentative) files.push(d.imageRepresentative);
            });
            copyFiles(files);
          }
          return;
        case "postUpdateMany":
          await PublishMessage(VALEURCARACTERISTIQUE_CLIENT_QUEUE, {
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
      "valeurCaracteristique communicateWithClient error==>",
      error
    );
  }
}

//add other hooks here
const valeurCaracteristique = mongoose.model(
  "valeurCaracteristique",
  valeurCaracteristiqueSchema
);
module.exports = valeurCaracteristique;
const CaracteristiqueDemandable = require("../models/caracteristiqueDemandable.model");
const { GroupBy } = require("../helpers/helpers");
const { PublishMessage } = require("../helpers/communications");
const { VALEURCARACTERISTIQUE_CLIENT_QUEUE } = require("../config");
const { copyFiles, removeFiles } = require("../helpers/helpers");
