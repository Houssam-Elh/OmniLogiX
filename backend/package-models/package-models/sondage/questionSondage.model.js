const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let questionSondageSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    reference: { type: String, required: true, unique: true },
    ordre: { type: Number, required: true },
    translations: {
      type: [
        {
          language: { type: String },
          labelQuestion: { type: String, required: true },
          commentaire: { type: String },
        },
      ],
    },
    imageRepresentative: { type: String },
    etatValidation: {
      type: String,
      required: true,
      enum: ["code_224", "code_1852"],
    },
    choix: [{ type: Schema.Types.ObjectId, ref: "choixSondage" }],
    sondage: { type: Schema.Types.ObjectId, ref: "sondage", required: true },
    objetsAssocies: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

questionSondageSchema.pre("aggregate", function (next) {
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
questionSondageSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      { path: "choix", match: { etatObjet: "code-1" }, populate: [] },
    ]);
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
          ? []
          : [
            sendRPCRequest(
              doc,
              OBJETASSOCIEE_ADMIN_RPC,
              ["objetsAssocies"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObjet" } }
            ),
          ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => { });
        } else {
          if (doc["objetsAssocies"] && doc["objetsAssocies"].length)
            doc["objetsAssocies"] = doc["objetsAssocies"].map(
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
questionSondageSchema.post("save", async function (doc, next) {
  try {
    console.log("this", this);
    console.log("doc", doc);
    if (this.sondage) {
      await Sondage.updateOne(
        { _id: this.sondage.toString() },
        { $addToSet: { questionSondage: this._id } }
      );
    }

    //comment ADMIN_QUEUE

    //#region new save bloc
    if (doc.objetsAssocies.length)
      publishUpdate(
        "update_items",
        doc.objetsAssocies,
        OBJETASSOCIEE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjet: doc._id,
            typeObjetConcerne: "QUESTIONSONDAGE_SONDAGE",
          },
        }
      );

    //#enregion new save bloc
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
questionSondageSchema.post("insertMany", async function (doc, next) {
  try {
    let sondage = GroupBy(doc, "sondage");
    for (let item of Object.keys(sondage)) {
      if (item)
        await Sondage.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              questionSondage: { $each: sondage[item].map((d) => d._id) },
            },
          }
        );
    }

    //comment ADMIN_QUEUE

    next();
  } catch (error) {
    next(error);
  }
});
let prevState = null;
let itemToCheck = {};

questionSondageSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await questionSondage.findOne(this.getQuery()).lean();

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["objetsAssocies"] = doc.objetsAssocies;
      //#endregion new pre find and update bloc
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const sondageId = this._update?.["$set"]?.sondage;
      if (doc?.sondage != sondageId && doc?.sondage != undefined)
        await Sondage.updateOne(
          { _id: doc.sondage.toString() },
          { $pull: { questionSondage: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
questionSondageSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    //#region new post find and update bloc
    let itemToPull,
      itemToPush = [];

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["objetsAssocies"], newData: doc.objetsAssocies },
      OBJETASSOCIEE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjet: null, typeObjetConcerne: null },
        bodyPush: {
          refObjet: doc._id,
          typeObjetConcerne: "QUESTIONSONDAGE_SONDAGE",
        },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.sondage)
      await Sondage.updateOne(
        { _id: doc.sondage?._id?.toString() || doc.sondage },
        { $addToSet: { questionSondage: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
questionSondageSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await questionSondage.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.objetsAssocies)))],
          OBJETASSOCIEE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );

        //#endregion new archive bloc

        //comment ADMIN_QUEUE
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          doc.map((d) => d.imageRepresentative)
        );

        let choix = [];
        doc.map((d) => {
          choix.push(...d.choix.map((v) => v._id || v));
        });
        if (choix.length) {
          promises.push(
            ChoixSondage.updateMany(
              { _id: { $in: choix } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let choix = [];

        doc.map((d) => {
          choix.push(...d.choix.map((v) => v._id || v));
        });
        if (choix.length) {
          promises.push(
            ChoixSondage.updateMany(
              { _id: { $in: choix } },
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
questionSondageSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await questionSondage.find(this.getQuery()).lean();
    const promises = [];
    let choix = [];
    doc.map((d) => {
      choix.push(...d.choix.map((v) => v._id || v));
    });
    if (choix.length) {
      promises.push(ChoixSondage.deleteMany({ _id: { $in: choix } }).exec());
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
            await PublishMessage(QUESTIONSONDAGE_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            removeFiles(doc.imageRepresentative);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(QUESTIONSONDAGE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(QUESTIONSONDAGE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            copyFiles(doc.imageRepresentative);
            if (doc?.choix?.length) {
              PublishChoixSondage(doc.choix);
            }
            //#region new publish bloc
            if (doc.objetsAssocies.length)
              publishUpdate(
                "publish_data",
                doc.objetsAssocies,
                OBJETASSOCIEE_ADMIN_QUEUE
              );
            //#endregion new publish bloc
          }
          return;
        case "postUpdateMany":
          await PublishMessage(QUESTIONSONDAGE_CLIENT_QUEUE, {
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
    console.error("questionSondage communicateWithClient error==>", error);
  }
}
//add other hooks here
const questionSondage = mongoose.model(
  "questionSondage",
  questionSondageSchema
);
module.exports = questionSondage;
const Sondage = require("../models/sondage.model");
const ChoixSondage = require("../models/choixSondage.model");

const {
  PublishData: PublishChoixSondage,
} = require("./repositories/choixSondage.repositorie");

const { PublishMessage } = require("../helpers/communications");

const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  getDiffArray,
  GroupBy,
  removeFiles,
  copyFiles,
  flatDeep,
} = require("../helpers/helpers");

const {
  OBJETASSOCIEE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_QUEUE,
  QUESTIONSONDAGE_CLIENT_QUEUE,
} = require("../config");
