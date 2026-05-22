const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let questionsFAQSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    reference: { type: String, required: true, unique: true },
    translations: {
      type: [
        {
          language: { type: String },
          question: { type: String, required: true },
          reponse: { type: String },
          nomAuteurQuestion: { type: String },
        },
      ],
    },
    refAuteurQuestion: { type: Schema.Types.Mixed },
    emailAuteur: { type: String, required: true },
    dateQuestion: { type: Date, required: true },
    ordre: { type: Number, required: true },
    etatQst: { type: String, required: true, enum: ["code_4268", "code_1407"] },
    provenance: {
      type: String,
      required: true,
      enum: ["code_211", "code_212"],
    },
    nbrVue: { type: Number },
    refAuteurReponse: { type: Schema.Types.Mixed },
    dateReponse: { type: Date },
    etatValidationReponse: { type: String, enum: ["code_4268", "code_1407"] },
    refValidateur: { type: Schema.Types.Mixed },
    dateValidationReponse: { type: Date },
    faq: { type: Schema.Types.ObjectId, ref: "faq" },
    objetAssocieReponse: [{ type: Schema.Types.ObjectId }],
    etats: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [];
questionsFAQSchema.pre("aggregate", function (next) {
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
questionsFAQSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
let prevState = null;
//refactor bloc for distantRequest
/*new*/ /*new20*/ async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
            sendRPCRequest(
              doc,
              MEMBRE_ADMIN_RPC,
              ["refAuteurQuestion", "refAuteurReponse", "refValidateur"],
              "VIEW_ITEMS",
              {}
            ),
          ]
          : [
            sendRPCRequest(
              doc,
              MEMBRE_ADMIN_RPC,
              ["refAuteurQuestion", "refAuteurReponse", "refValidateur"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              OBJETASSOCIEE_ADMIN_RPC,
              ["objetAssocieReponse"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObjet" } }
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
          doc.map((d) => {
            if (d["refAuteurQuestion"])
              d["refAuteurQuestion"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["refAuteurQuestion"]._id || d["refAuteurQuestion"])
                ) || d["refAuteurQuestion"];
            if (d["refAuteurReponse"])
              d["refAuteurReponse"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["refAuteurReponse"]._id || d["refAuteurReponse"])
                ) || d["refAuteurReponse"];
            if (d["refValidateur"])
              d["refValidateur"] =
                result[0].find(
                  (item) =>
                    item._id == (d["refValidateur"]._id || d["refValidateur"])
                ) || d["refValidateur"];
          });
        } else {
          if (doc["refAuteurQuestion"])
            doc["refAuteurQuestion"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["refAuteurQuestion"]._id || doc["refAuteurQuestion"])
              ) || doc["refAuteurQuestion"];
          if (doc["refAuteurReponse"])
            doc["refAuteurReponse"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["refAuteurReponse"]._id || doc["refAuteurReponse"])
              ) || doc["refAuteurReponse"];
          if (doc["refValidateur"])
            doc["refValidateur"] =
              result[0].find(
                (item) =>
                  item._id == (doc["refValidateur"]._id || doc["refValidateur"])
              ) || doc["refValidateur"];
          if (doc["objetAssocieReponse"] && doc["objetAssocieReponse"].length)
            doc["objetAssocieReponse"] = doc["objetAssocieReponse"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["etats"] && doc["etats"].length)
            doc["etats"] = doc["etats"].map(
              (d) =>
                (d = result[2].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
questionsFAQSchema.post(/find.*|save/, async function (doc, next) {
  try {
    if (doc) {
      await distantRequest(doc);
      next();
    }
  } catch (err) {
    next(err);
  }
});
questionsFAQSchema.post("save", async function (doc, next) {
  try {
    if (this.faq) {
      await Faq.updateOne(
        { _id: this.faq.toString() },
        { $addToSet: { questions: this._id } }
      );
    }

    //comment ADMIN_QUEUE

    //comment ADMIN_QUEUE

    //#region new save bloc
    if (doc.objetAssocieReponse.length)
      publishUpdate(
        "update_items",
        doc.objetAssocieReponse,
        OBJETASSOCIEE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: { refObjet: doc._id, typeObjetConcerne: "QUESTIONSFAQ_FAQ" },
        }
      );
    if (doc.etats.length)
      publishUpdate("update_items", doc.etats, ETATOBJET_ADMIN_QUEUE, {
        operation: "$set",
        body: { refObject: doc._id, typeObject: "QUESTIONSFAQ_FAQ" },
      });

    //#enregion new save bloc
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
questionsFAQSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    this.populate(doc, populateField);

    let faq = GroupBy(doc, "faq");
    for (let item of Object.keys(faq)) {
      if (item)
        await Faq.updateOne(
          { _id: item.toString() },
          { $addToSet: { questions: { $each: faq[item].map((d) => d._id) } } }
        );
    }

    next();
  } catch (error) {
    next(error);
  }
});
let itemToCheck = {};

questionsFAQSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await questionsFAQ.findOne(this.getQuery()).lean();

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["objetAssocieReponse"] = doc.objetAssocieReponse;
      itemToCheck["etats"] = doc.etats;
      //#endregion new pre find and update bloc
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const faqId = this._update?.["$set"]?.faq;
      if (faqId && doc?.faq != faqId && doc?.faq != undefined) {
        await Faq.updateOne(
          { _id: doc.faq.toString() },
          { $pull: { questions: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
questionsFAQSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    //#region new post find and update bloc
    let itemToPull,
      itemToPush = [];

    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["objetAssocieReponse"],
        newData: doc.objetAssocieReponse,
      },
      OBJETASSOCIEE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjet: null, typeObjetConcerne: null },
        bodyPush: { refObjet: doc._id, typeObjetConcerne: "QUESTIONSFAQ_FAQ" },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["etats"], newData: doc.etats },
      ETATOBJET_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { refObject: doc._id, typeObject: "QUESTIONSFAQ_FAQ" },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);
    if (doc.faq) {
      await Faq.updateOne(
        { _id: doc.faq?._id?.toString() || doc.faq },
        { $addToSet: { questions: doc._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
questionsFAQSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await questionsFAQ.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.objetAssocieReponse)))],
          OBJETASSOCIEE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.etats)))],
          ETATOBJET_ADMIN_QUEUE,
          { operation: "$set", body: { etatObjet: "code-2" } }
        );

        //#endregion new archive bloc

        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
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
questionsFAQSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await questionsFAQ.find(this.getQuery()).lean();
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
            await PublishMessage(QUESTIONSFAQ_CLIENT_QUEUE, {
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
            await PublishMessage(QUESTIONSFAQ_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(QUESTIONSFAQ_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            //#region new publish bloc
            if (doc.objetAssocieReponse.length)
              publishUpdate(
                "publish_data",
                doc.objetAssocieReponse,
                OBJETASSOCIEE_ADMIN_QUEUE
              );
            if (doc.etats.length)
              publishUpdate("publish_data", doc.etats, ETATOBJET_ADMIN_QUEUE);
            //#endregion new publish bloc
          }
          return;
        case "postUpdateMany":
          await PublishMessage(QUESTIONSFAQ_CLIENT_QUEUE, {
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
    console.error("questionsFAQ communicateWithClient error==>", error);
  }
}

//add other hooks here
const questionsFAQ = mongoose.model("questionsFAQ", questionsFAQSchema);
module.exports = questionsFAQ;
const Faq = require("../models/faq.model");

const { PublishMessage } = require("../helpers/communications");
const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  getDiffArray,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");

const {
  MEMBRE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  ETATOBJET_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_QUEUE,
  ETATOBJET_ADMIN_QUEUE,
  QUESTIONSFAQ_CLIENT_QUEUE,
} = require("../config");
