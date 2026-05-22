const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let groupeCaracteristiqueSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    reference: { type: String, required: true, unique: true },
    translations: {
      type: [
        {
          language: { type: String },
          designation: { type: String, required: true },
          description: { type: String },
        },
      ],
    },
    etatValidation: {
      type: String,
      required: true,
      enum: ["code_223", "code_4268", "code_1407"],
    },
    caracteristiques: [
      { type: Schema.Types.ObjectId, ref: "caracteristiqueDemandable" },
    ],
    parent: { type: Schema.Types.ObjectId, ref: "groupeCaracteristique" },
    sousGroupe: [{ type: Schema.Types.ObjectId, ref: "groupeCaracteristique" }],
    domainsConcernes: {
      type: [
        {
          domaine: { type: Schema.Types.Mixed, required: true },
          typeRelation: {
            type: String,
            required: true,
            enum: ["code_12347", "code_12348"],
          },
          taxonomieConcerne: [{ type: Schema.Types.Mixed }],
        },
      ],
    },
    icone: { type: String },
    imageRepresentative: { type: String },
    objetsAssocies: { type: [ObjectId] },
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [
  { path: "caracteristiques", match: { etatObjet: "code-1" }, populate: [] },
  { path: "sousGroupe", match: { etatObjet: "code-1" }, populate: [] },
];
groupeCaracteristiqueSchema.pre("aggregate", function (next) {
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
groupeCaracteristiqueSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
let prevState = null;
async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
            sendRPCRequest(
              doc,
              DOMAIN_ADMIN_RPC,
              ["domainsConcernes.domaine"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-children -taxonomies" } }
            ),
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["domainsConcernes.taxonomieConcerne"],
              "VIEW_ITEMS",
              {}
            ),
          ]
          : [
            sendRPCRequest(
              doc,
              DOMAIN_ADMIN_RPC,
              ["domainsConcernes.domaine"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-children -taxonomies" } }
            ),
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["domainsConcernes.taxonomieConcerne"],
              "VIEW_ITEMS",
              {}
            ),
          ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["domainsConcernes"].length)
              for (let item of d["domainsConcernes"]) {
                item.domaine =
                  result[0].find(
                    (d) => d._id == (item.domaine?._id || item.domaine)
                  ) || item.domaine;
                if (item.taxonomieConcerne && item.taxonomieConcerne.length)
                  item.taxonomieConcerne = item.taxonomieConcerne.map(
                    (elt) =>
                    (elt =
                      result[1].find(
                        (item) => item._id == (elt?._id || elt)
                      ) || elt)
                  );
              }
          });
        } else {
          if (doc["domainsConcernes"].length)
            for (let item of doc["domainsConcernes"]) {
              item.domaine =
                result[0].find(
                  (d) => d._id == (item.domaine?._id || item.domaine)
                ) || item.domaine;
              if (item.taxonomieConcerne && item.taxonomieConcerne.length)
                item.taxonomieConcerne = item.taxonomieConcerne.map(
                  (d) =>
                  (d =
                    result[1].find((item) => item._id == (d?._id || d)) || d)
                );
              console.log(item);
            }
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}

groupeCaracteristiqueSchema.post(/find.*|save/, async function (doc, next) {
  try {
    if (doc) await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

groupeCaracteristiqueSchema.post("save", async function (doc, next) {
  try {
    if (this.parent) {
      await groupeCaracteristique.updateOne(
        { _id: this.parent.toString() },
        { $addToSet: { sousGroupe: this._id } }
      );
    } else if (this.sousGroupe?.length) {
      await groupeCaracteristique.updateMany(
        { _id: { $in: this.sousGroupe.map((d) => d._id || d) } },
        { $set: { parent: this._id } }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
groupeCaracteristiqueSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    this.populate(doc, populateField);

    let parent = GroupBy(doc, "parent");
    for (let item of Object.keys(parent)) {
      if (item)
        await groupeCaracteristique.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              sousGroupe: { $each: parent[item].map((d) => d._id) },
            },
          }
        );
    }

    next();
  } catch (error) {
    next(error);
  }
});
groupeCaracteristiqueSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await groupeCaracteristique.findOne(this.getQuery()).lean();
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
groupeCaracteristiqueSchema.post(
  "findOneAndUpdate",
  async function (doc, next) {
    try {
      communicateWithClient("postFindOneAndUpdate", doc, prevState);

      next();
    } catch (error) {
      next(error);
    }
  }
);
groupeCaracteristiqueSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await groupeCaracteristique.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
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

        let sousGroupe = [];
        let caracteristiques = [];
        doc.map((d) => {
          sousGroupe.push(...d.sousGroupe.map((v) => v._id || v));
          caracteristiques.push(...d.caracteristiques.map((v) => v._id || v));
        });
        if (sousGroupe.length) {
          promises.push(
            groupeCaracteristique
              .updateMany(
                { _id: { $in: sousGroupe } },
                { $set: { etatObjet: "code-2" } }
              )
              .exec()
          );
        }
        if (caracteristiques.length) {
          promises.push(
            CaracteristiqueDemandable.updateMany(
              { _id: { $in: caracteristiques } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let sousGroupe = [];
        let caracteristiques = [];

        doc.map((d) => {
          sousGroupe.push(...d.sousGroupe.map((v) => v._id || v));
          caracteristiques.push(...d.caracteristiques.map((v) => v._id || v));
        });
        if (sousGroupe.length) {
          promises.push(
            groupeCaracteristique
              .updateMany(
                { _id: { $in: sousGroupe } },
                { $set: { etatObjet: "code-1" } }
              )
              .exec()
          );
        }
        if (caracteristiques.length) {
          promises.push(
            CaracteristiqueDemandable.updateMany(
              { _id: { $in: caracteristiques } },
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
groupeCaracteristiqueSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await groupeCaracteristique.find(this.getQuery()).lean();
    const promises = [];
    let sousGroupe = [];
    let caracteristiques = [];
    doc.map((d) => {
      sousGroupe.push(...d.sousGroupe.map((v) => v._id || v));
      caracteristiques.push(...d.caracteristiques.map((v) => v._id || v));
    });
    if (sousGroupe.length) {
      promises.push(
        groupeCaracteristique.deleteMany({ _id: { $in: sousGroupe } }).exec()
      );
    }
    if (caracteristiques.length) {
      promises.push(
        CaracteristiqueDemandable.deleteMany({
          _id: { $in: caracteristiques },
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
            await PublishMessage(GROUPECARACTERISTIQUE_CLIENT_QUEUE, {
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
            await PublishMessage(GROUPECARACTERISTIQUE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(GROUPECARACTERISTIQUE_CLIENT_QUEUE, {
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
            if (doc?.parent?.length) {
              PublishGroupeCaracteristique(doc.parent);
            }
            if (doc?.caracteristiques?.length) {
              PublishCaracteristiqueDemandable(doc.caracteristiques);
            }
          }
          return;
        case "postUpdateMany":
          await PublishMessage(GROUPECARACTERISTIQUE_CLIENT_QUEUE, {
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
      "groupeCaracteristique communicateWithClient error==>",
      error
    );
  }
}

//add other hooks here
const groupeCaracteristique = mongoose.model(
  "groupeCaracteristique",
  groupeCaracteristiqueSchema
);
module.exports = groupeCaracteristique;
const { GroupBy, sendRPCRequest } = require("../helpers/helpers");
const CaracteristiqueDemandable = require("../models/caracteristiqueDemandable.model");
const { PublishMessage } = require("../helpers/communications");
const {
  TAXONOMIE_ADMIN_RPC,
  GROUPECARACTERISTIQUE_CLIENT_QUEUE,
} = require("../config");
const {
  PublishData: PublishCaracteristiqueDemandable,
} = require("./repositories/caracteristiqueDemandable.repositorie");
const { copyFiles, removeFiles } = require("../helpers/helpers");

const { DOMAIN_ADMIN_RPC } = require("../config");
