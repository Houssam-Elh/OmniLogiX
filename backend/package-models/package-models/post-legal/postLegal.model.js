const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let postLegalSchema = new Schema(
  {
    etatDePublication: {
      type: String,
      default: "etatDeCreation.creation",
      required: true,
      enum: ["code_541", "code_223", "code_3417"],
    },
    etatObjet: { type: String, default: "code-1" },
    categorie: {
      type: String,
      required: true,
      enum: [
        "code_17704",
        "code_17705",
        "code_17706",
        "code_17707",
        "code_17708",
        "code_17709",
      ],
    },
    translations: {
      type: [
        {
          language: { type: String },
          titre: { type: String, required: true },
          sousTitre: { type: String },
          contenu: { type: String },
        },
      ],
    },
    datePublication: { type: Date, required: true },
    motsCles: [{ type: Schema.Types.ObjectId }],
    etats: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [];
postLegalSchema.pre("aggregate", function (next) {
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
postLegalSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
//refactor bloc for distantRequest
async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? []
          : [
              sendRPCRequest(
                doc,
                MOTCLES_ADMIN_RPC,
                ["motsCles"],
                "VIEW_ITEMS",
                // { queryOptions: { select: "-objetsConcernes" } }
              ),
              sendRPCRequest(
                doc,
                ETATOBJET_ADMIN_RPC,
                ["etats"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObject" } }
              ),
            ]
      ).then((result) => {
        if (doc instanceof Array) {
        } else {
          if (doc["motsCles"] && doc["motsCles"].length)
            doc["motsCles"] = doc["motsCles"].map(
              (d) =>
                (d = result[0].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["etats"] && doc["etats"].length)
            doc["etats"] = doc["etats"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
postLegalSchema.post(/find.*|save/, async function (doc) {
  try {
    await distantRequest(doc);
  } catch (error) {
    console.error(
      "error while getting distant data for model postLegal==>",
      error
    );
  }
});

let prevState = null;

postLegalSchema.post("save", async function (doc, next) {
  try {
    if (doc.motsCles.length)
      publishUpdate("update_items", doc.motsCles, MOTCLES_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "POSTLEGAL_LEGALPOST",
          },
        },
      });
    if (doc.etats.length)
      publishUpdate("update_items", doc.etats, ETATOBJET_ADMIN_QUEUE, {
        operation: "$set",
        body: { refObject: doc._id, typeObject: "POSTLEGAL_LEGALPOST" },
      });
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
postLegalSchema.post("insertMany", async function (doc, next) {
  try {
    let motsCles = GroupBy(doc, "motsCles");
    for (let item of Object.keys(motsCles)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(motsCles[item].map((d) => d.motsCles)))],
          MOTCLES_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: motsCles[item].map(
                  (i) =>
                    (i = { refObjet: i._id, typeObjet: "POSTLEGAL_LEGALPOST" })
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
let itemToCheck = {};

postLegalSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await postLegal.findOne(this.getQuery()).lean();

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["motsCles"] = doc.motsCles;
      itemToCheck["etats"] = doc.etats;
      //#endregion new pre find and update bloc
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
postLegalSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    //#region new post find and update bloc
    let itemToPull,
      itemToPush = [];

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["motsCles"], newData: doc.motsCles },
      MOTCLES_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "POSTLEGAL_LEGALPOST",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["etats"], newData: doc.etats },
      ETATOBJET_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObject: null, typeObject: null },
        bodyPush: { refObject: doc._id, typeObject: "POSTLEGAL_LEGALPOST" },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    next();
  } catch (error) {
    next(error);
  }
});
postLegalSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await postLegal.find(this.getQuery()).lean();
      const promises = [];
      if (
        docs.modifiedCount /*new modifCount*/ &&
        this._update?.["$set"]?.etatObjet?.includes("code-2")
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.motsCles)))],
          MOTCLES_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.etats)))],
          ETATOBJET_ADMIN_QUEUE,
          { operation: "$set", body: { typeObject: null, refObject: null } }
        );
        communicateWithClient("postUpdateMany", this.getQuery());

        doc.map((d) => {});
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        doc.map((d) => {});
      }

      //#region new pull bloc
      if (this._update?.["$pull"] && docs.modifiedCount) {
        if (
          docs.modifiedCount /*new modifCount*/ &&
          this._update?.["$pull"]?.motsCles
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].motsCles,
            MOTCLES_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
      }
      //#endregion new pull bloc
      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
postLegalSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await postLegal.find(this.getQuery()).lean();
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
    switch (methode) {
      case "preFindOneAndUpdate":
        if (doc?.etatDePublication) {
          if (
            targetState &&
            targetState != "code_3417" &&
            prevState == "code_3417"
          ) {
            await PublishMessage(POSTLEGAL_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
          }
        }
        return;
      case "postFindOneAndUpdate":
        if (doc?.etatDePublication) {
          if (doc.etatDePublication && prevState == doc.etatDePublication) {
            await PublishMessage(POSTLEGAL_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(POSTLEGAL_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          //#region new publish bloc
          if (doc.motsCles.length)
            publishUpdate("publish_data", doc.motsCles, MOTCLES_ADMIN_QUEUE);
          if (doc.etats.length)
            publishUpdate("publish_data", doc.etats, ETATOBJET_ADMIN_QUEUE);
          //#endregion new publish bloc
        }
        return;
      case "postUpdateMany":
        await PublishMessage(POSTLEGAL_CLIENT_QUEUE, {
          operation: "REMOVE_ITEMS",
          data: { condition: doc },
        });

        return;

      case "publishData":
        return;

      case "translate":
        return;
    }
  } catch (error) {
    console.error("postLegal communicateWithClient error==>", error);
  }
}

//add other hooks here
const postLegal = mongoose.model("postLegal", postLegalSchema);
module.exports = postLegal;

const { PublishMessage } = require("../helpers/communications");
const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  getDiffArray,
  flatDeep,
} = require("../helpers/helpers");
const {
  MOTCLES_ADMIN_RPC,
  MOTCLES_ADMIN_QUEUE,
  ETATOBJET_ADMIN_RPC,
  ETATOBJET_ADMIN_QUEUE,
  POSTLEGAL_CLIENT_QUEUE,
} = require("../config");
