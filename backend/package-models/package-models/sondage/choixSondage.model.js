const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let choixSondageSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    reference: { type: String, required: true, unique: true },
    ordre: { type: Number, required: true },
    translations: {
      type: [
        {
          language: { type: String },
          valeurChoix: { type: String, required: true },
        },
      ],
    },
    nombreReponse: { type: Number, default: 0 },
    questionSondage: {
      type: Schema.Types.ObjectId,
      ref: "questionSondage",
      required: true,
    },
  },
  { timestamps: true }
);

//  autoPopulate hook

choixSondageSchema.pre("aggregate", function (next) {
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
choixSondageSchema.pre(/find.*/, function (next) {
  try {
    this.populate([]);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks

choixSondageSchema.post("save", async function (doc, next) {
  try {
    if (this.questionSondage) {
      await QuestionSondage.updateOne(
        { _id: this.questionSondage.toString() },
        { $addToSet: { choix: this._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
choixSondageSchema.post("insertMany", async function (doc, next) {
  try {
    let questionSondage = GroupBy(doc, "questionSondage");
    for (let item of Object.keys(questionSondage)) {
      if (item)
        await QuestionSondage.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              choix: { $each: questionSondage[item].map((d) => d._id) },
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
choixSondageSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await choixSondage.findOne(this.getQuery()).lean();
    if (doc) {
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const questionSondageId = this._update?.["$set"]?.questionSondage;
      if (
        doc?.questionSondage != questionSondageId &&
        doc?.questionSondage != undefined
      )
        await QuestionSondage.updateOne(
          { _id: doc.questionSondage.toString() },
          { $pull: { choix: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
choixSondageSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.questionSondage)
      await QuestionSondage.updateOne(
        { _id: doc.questionSondage?._id?.toString() || doc.questionSondage },
        { $addToSet: { choix: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
choixSondageSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await choixSondage.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
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
choixSondageSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await choixSondage.find(this.getQuery()).lean();
    const promises = [];

    doc.map((d) => { });

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
            await PublishMessage(CHOIXSONDAGE_CLIENT_QUEUE, {
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
            await PublishMessage(CHOIXSONDAGE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(CHOIXSONDAGE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          return;
        case "postUpdateMany":
          await PublishMessage(CHOIXSONDAGE_CLIENT_QUEUE, {
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
    console.error("choixSondage communicateWithClient error==>", error);
  }
}
//add other hooks here
const choixSondage = mongoose.model("choixSondage", choixSondageSchema);
module.exports = choixSondage;
const QuestionSondage = require("../models/questionSondage.model");


const { PublishMessage } = require("../helpers/communications");
const { CHOIXSONDAGE_CLIENT_QUEUE } = require("../config");
const { GroupBy } = require("../helpers/helpers");
