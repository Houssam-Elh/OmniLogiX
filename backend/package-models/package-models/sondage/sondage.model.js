const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let sondageSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    themeSondage: { type: Schema.Types.Mixed, required: true },
    translations: {
      type: [
        {
          language: { type: String },
          designation: { type: String, required: true },
          description: { type: String },
        },
      ],
    },
    proprietaire: { type: Schema.Types.Mixed, required: true },
    acteurs: {
      type: {
        responsable: { type: Schema.Types.Mixed, required: true },
        validateur: { type: Schema.Types.Mixed, required: true },
        createur: { type: Schema.Types.Mixed, required: true },
      },
    },
    dateOuverture: { type: Date, required: true },
    dateCloture: { type: Date, required: true },
    imageRepresentative: { type: String },
    nbrParticipant: { type: Number, default: 0 },
    questionSondage: [{ type: Schema.Types.ObjectId, ref: "questionSondage" }],
    etatObjet: { type: String, default: "code-1" },
    etatDePublication: {
      type: String,
      required: true,
      enum: ["code_541", "code_223", "code_224", "code_3417", "code_3573"],
    },
  },
  { timestamps: true }
);

//  autoPopulate hook

sondageSchema.pre("aggregate", function (next) {
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
sondageSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      { path: "themeSondage", match: { etatObjet: "code-1" }, populate: [] },
      { path: "questionSondage", match: { etatObjet: "code-1" }, populate: [] },
      { path: "proprietaire", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "acteurs.responsable",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "acteurs.validateur",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "acteurs.createur",
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
              ["themeSondage"],
              "VIEW_ITEMS",
              {}
            ),
          ]
          : [
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["themeSondage"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              PROTAGONISTEPOTONTIEL_ADMIN_RPC,
              ["acteurs"],
              "VIEW_ITEM",
              {
                queryOptions: {
                  select:
                    "-documentsLegals -moment -etats -opportinutes -risques -criteresConditions -echangesCommunications -incidents -elementsBudgets -activites -objetsAssocies -caracteristiques -referentiels -instructions -reglesActivations -echangesEtCommunications -objetsConcernes",
                },
              }
            ),
          ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["themeSondage"])
              d["themeSondage"] =
                result[0].find(
                  (item) =>
                    item._id == (d["themeSondage"]._id || d["themeSondage"])
                ) || d["themeSondage"];
          });
        } else {
          if (doc["themeSondage"])
            doc["themeSondage"] =
              result[0].find(
                (item) =>
                  item._id == (doc["themeSondage"]._id || doc["themeSondage"])
              ) || doc["themeSondage"];
          if (doc["acteurs"] && doc["acteurs"].length && result[1])
            doc["acteurs"] = doc["acteurs"].map((d) => (d = result[1] || d));
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
sondageSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

sondageSchema.post("save", async function (doc, next) {
  try {
    //#region new save bloc
    if (doc.acteurs.length)
      publishUpdate(
        "update_items",
        doc.acteurs,
        PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "SONDAGE_SONDAGE",
            },
          },
        }
      );

    //#enregion new save bloc
    next();
  } catch (error) {
    next(error);
  }
});
//new added hook
//rewrite insertMany
sondageSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    //#region new insert many bloc
    let acteurs = GroupBy(doc, "acteurs");
    for (let item of Object.keys(acteurs)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(acteurs[item].map((d) => d.acteurs)))],
          PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: acteurs[item].map(
                  (i) => (i = { refObjet: i._id, typeObjet: "SONDAGE_SONDAGE" })
                ),
              },
            },
          }
        );
    }

    //#enregion new insert many bloc

    next();
  } catch (error) {
    next(error);
  }
});

let prevState = null;
let itemToCheck = {};

sondageSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await sondage.findOne(this.getQuery()).lean();

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["acteurs"] = doc.acteurs;
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
sondageSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    //#region new post find and update bloc
    let itemToPull,
      itemToPush = [];

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["acteurs"], newData: doc.acteurs },
      PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: { refObjet: doc._id, typeObjet: "SONDAGE_SONDAGE" },
        },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    next();
  } catch (error) {
    next(error);
  }
});
sondageSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await sondage.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.acteurs)))],
          PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );

        //#endregion new archive bloc

        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          doc.map((d) => d.imageRepresentative)
        );

        let questionSondage = [];
        doc.map((d) => {
          questionSondage.push(...d.questionSondage.map((v) => v._id || v));
        });
        if (questionSondage.length) {
          promises.push(
            QuestionSondage.updateMany(
              { _id: { $in: questionSondage } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let questionSondage = [];

        doc.map((d) => {
          questionSondage.push(...d.questionSondage.map((v) => v._id || v));
        });
        if (questionSondage.length) {
          promises.push(
            QuestionSondage.updateMany(
              { _id: { $in: questionSondage } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
      }

      //#region new pull bloc
      if (this._update?.["$pull"]) {
        if (
          this._update?.["$pull"]?.acteurs &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].acteurs,
            PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
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
    console.log("error post ===>", error);
    next(error);
  }
});
sondageSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await sondage.find(this.getQuery()).lean();
    const promises = [];
    let questionSondage = [];
    doc.map((d) => {
      questionSondage.push(...d.questionSondage.map((v) => v._id || v));
    });
    if (questionSondage.length) {
      promises.push(
        QuestionSondage.deleteMany({ _id: { $in: questionSondage } }).exec()
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
            await PublishMessage(SONDAGE_CLIENT_QUEUE, {
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
            await PublishMessage(SONDAGE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(SONDAGE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            copyFiles(doc.imageRepresentative);
            if (doc?.questionSondage?.length) {
              PublishQuestionSondage(doc.questionSondage);
            }
            //#region new publish bloc
            if (doc.acteurs.length)
              publishUpdate(
                "publish_data",
                doc.acteurs,
                PROTAGONISTEPOTONTIEL_ADMIN_QUEUE
              );
            //#endregion new publish bloc
          }
          return;
        case "postUpdateMany":
          await PublishMessage(SONDAGE_CLIENT_QUEUE, {
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
    console.error("sondage communicateWithClient error==>", error);
  }
}
//add other hooks here
const sondage = mongoose.model("sondage", sondageSchema);
module.exports = sondage;
const QuestionSondage = require("../models/questionSondage.model");

const {
  PublishData: PublishQuestionSondage,
} = require("./repositories/questionSondage.repositorie");

const { PublishMessage } = require("../helpers/communications");

const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  getDiffArray,
  copyFiles,
  removeFiles,
  flatDeep,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  PROTAGONISTEPOTONTIEL_ADMIN_RPC,
  PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
  SONDAGE_CLIENT_QUEUE,
  MEMBRE_ADMIN_RPC,
} = require("../config");

const { GroupBy } = require("../helpers/helpers");
