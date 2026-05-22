const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let caracteristiqueDemandableSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    reference: { type: String, required: true, unique: true },
    ordre: { type: Number, required: true, default: 1 },
    translations: {
      type: [
        {
          language: { type: String },
          label: { type: String, required: true },
          defaultValeurChar: { type: String },
        },
      ],
    },
    natureInfo: {
      type: String,
      required: true,
      enum: ["code_12353", "code_355", "code_356", "code_12354"],
    },
    typeInfo: {
      type: String,
      required: true,
      enum: [
        "code_2475",
        "code_2476",
        "code_1305",
        "code_2477",
        "code_1307",
        "code_1308",
        "code_12356",
        "code_1319",
      ],
    },
    defaultValeurNotChar: { type: Object },
    minVal: { type: Object },
    maxVal: { type: Object },
    unite: { type: Schema.Types.Mixed },
    operateurs: {
      type: [String],
      enum: [
        "code_1312",
        "code_1313",
        "code_1314",
        "code_1315",
        "code_1316",
        "code_1317",
        "code_1318",
        "code_12352",
      ],
    },
    groupe: {
      type: Schema.Types.ObjectId,
      ref: "groupeCaracteristique",
      required: true,
    },
    valeurs: [{ type: Schema.Types.ObjectId, ref: "valeurCaracteristique" }],
    etatValidation: {
      type: String,
      required: true,
      enum: ["code_223", "code_4268", "code_1407"],
    },
    icone: { type: String },
    imageAssocie: { type: String },
    instances: [
      { type: Schema.Types.ObjectId, ref: "instanceCaracteristique" },
    ],
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [
  { path: "valeurs", match: { etatObjet: "code-1" }, populate: [] },
  { path: "instances", match: { etatObjet: "code-1" }, populate: [] },
];
caracteristiqueDemandableSchema.pre("aggregate", function (next) {
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
caracteristiqueDemandableSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
let prevState = null;
/*new*/ /*new20*/ async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
            sendRPCRequest(doc, DOMAIN_ADMIN_RPC, ["unite"], "VIEW_ITEMS", {
              queryOptions: { select: "-children -taxonomies" },
            }),
          ]
          : [
            sendRPCRequest(doc, DOMAIN_ADMIN_RPC, ["unite"], "VIEW_ITEMS", {
              queryOptions: { select: "-children -taxonomies" },
            }),
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
caracteristiqueDemandableSchema.post(/find.*|save/, async function (doc, next) {
  try {
    if (doc) await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

caracteristiqueDemandableSchema.post("save", async function (doc, next) {
  try {
    if (this.groupe) {
      await GroupeCaracteristique.updateOne(
        { _id: this.groupe.toString() },
        { $addToSet: { caracteristiques: this._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
caracteristiqueDemandableSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    this.populate(doc, populateField);

    let groupe = GroupBy(doc, "groupe");
    for (let item of Object.keys(groupe)) {
      if (item)
        await GroupeCaracteristique.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              caracteristiques: { $each: groupe[item].map((d) => d._id) },
            },
          }
        );
    }

    next();
  } catch (error) {
    next(error);
  }
});
caracteristiqueDemandableSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await caracteristiqueDemandable.findOne(this.getQuery()).lean();
    if (doc) {
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const groupeId = this._update?.["$set"]?.groupe;
      if (doc?.groupe != groupeId && doc?.groupe != undefined) {
        await GroupeCaracteristique.updateOne(
          { _id: doc.groupe.toString() },
          { $pull: { caracteristiques: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
caracteristiqueDemandableSchema.post(
  "findOneAndUpdate",
  async function (doc, next) {
    try {
      communicateWithClient("postFindOneAndUpdate", doc, prevState);
      if (doc.groupe) {
        await GroupeCaracteristique.updateOne(
          { _id: doc.groupe?._id?.toString() || doc.groupe },
          { $addToSet: { caracteristiques: doc._id } }
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  }
);
caracteristiqueDemandableSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await caracteristiqueDemandable.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        try {
          let docsToUpdate = await caracteristiqueDemandable
            .find({
              _id: { $nin: doc.map((d) => d._id) },
              etatObjet: "code-1",
              groupe: doc[0].groupe,
            })
            .select("_id")
            .lean();
          console.log({ docsToUpdate });
          if (docsToUpdate.length) {
            let promises = [];
            for (let [i, item] of docsToUpdate.entries())
              promises.push(
                caracteristiqueDemandable.findOneAndUpdate(
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
          if (d.imageAssocie) files.push(d.imageAssocie);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let valeurs = [];
        let instances = [];
        doc.map((d) => {
          valeurs.push(...d.valeurs.map((v) => v._id || v));
          instances.push(...d.instances.map((v) => v._id || v));
        });
        if (valeurs.length) {
          promises.push(
            ValeurCaracteristique.updateMany(
              { _id: { $in: valeurs } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (instances.length) {
          promises.push(
            InstanceCaracteristique.updateMany(
              { _id: { $in: instances } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let valeurs = [];
        let instances = [];

        doc.map((d) => {
          valeurs.push(...d.valeurs.map((v) => v._id || v));
          instances.push(...d.instances.map((v) => v._id || v));
        });
        if (valeurs.length) {
          promises.push(
            ValeurCaracteristique.updateMany(
              { _id: { $in: valeurs } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (instances.length) {
          promises.push(
            InstanceCaracteristique.updateMany(
              { _id: { $in: instances } },
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
caracteristiqueDemandableSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await caracteristiqueDemandable.find(this.getQuery()).lean();
    const promises = [];
    let valeurs = [];
    let instances = [];
    doc.map((d) => {
      valeurs.push(...d.valeurs.map((v) => v._id || v));
      instances.push(...d.instances.map((v) => v._id || v));
    });
    if (valeurs.length) {
      promises.push(
        ValeurCaracteristique.deleteMany({ _id: { $in: valeurs } }).exec()
      );
    }
    if (instances.length) {
      promises.push(
        InstanceCaracteristique.deleteMany({ _id: { $in: instances } }).exec()
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
            await PublishMessage(CARACTERISTIQUEDEMANDABLE_CLIENT_QUEUE, {
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
            await PublishMessage(CARACTERISTIQUEDEMANDABLE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(CARACTERISTIQUEDEMANDABLE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            let files = [];
            doc.map((d) => {
              if (d.imageAssocie) files.push(d.imageAssocie);
            });
            copyFiles(files);
            if (doc?.valeurs?.length) {
              PublishValeurCaracteristique(doc.valeurs);
            }
            if (doc?.instances?.length) {
              PublishInstanceCaracteristique(doc.instances);
            }
          }
          return;
        case "postUpdateMany":
          await PublishMessage(CARACTERISTIQUEDEMANDABLE_CLIENT_QUEUE, {
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
      "caracteristiqueDemandable communicateWithClient error==>",
      error
    );
  }
}

//add other hooks here
const caracteristiqueDemandable = mongoose.model(
  "caracteristiqueDemandable",
  caracteristiqueDemandableSchema
);
module.exports = caracteristiqueDemandable;
const GroupeCaracteristique = require("../models/groupeCaracteristique.model");
const { GroupBy, sendRPCRequest } = require("../helpers/helpers");
const ValeurCaracteristique = require("../models/valeurCaracteristique.model");
const InstanceCaracteristique = require("../models/instanceCaracteristique.model");
const { PublishMessage } = require("../helpers/communications");

const {
  PublishData: PublishValeurCaracteristique,
} = require("./repositories/valeurCaracteristique.repositorie");
const {
  PublishData: PublishInstanceCaracteristique,
} = require("./repositories/instanceCaracteristique.repositorie");
const { copyFiles, removeFiles } = require("../helpers/helpers");


const {
  DOMAIN_ADMIN_RPC,
  CARACTERISTIQUEDEMANDABLE_CLIENT_QUEUE,
} = require("../config");
