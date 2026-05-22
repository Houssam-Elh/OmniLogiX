const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let instancequestionsFAQSchema = new Schema(
  {
    etatDePublication: { type: String, default: "etatDeCreation.creation" },
    etatObjet: { type: String, default: "code-1" },
    reference: { type: String, required: true, unique: true },
    translations: {
      type: [
        {
          language: { type: String },
          question: { type: String, required: true },
          reponse: { type: String },
          nomAuteurQuestion: { type: String, required: true },
          questionReformule: { type: String },
          motif: {
            type: String,
            enum: [
              "code_13821",
              "code_13823",
              "code_13825",
              "code_13826",
              "code_13827",
              "code_13828",
              "code_13829",
              "code_13830",
            ],
          },
        },
      ],
    },
    refAuteurQuestion: { type: Schema.Types.Mixed },
    emailAuteur: { type: String, required: true },
    dateQuestion: { type: Date, required: true },
    ordre: { type: Number, required: true },
    etatQst: { type: String, required: true, enum: ["code_1407", "code_4268"] },
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
    faqDestination: {
      type: Schema.Types.ObjectId,
      // ref: "faq"
    },
    objetAssocieReponse: { type: [Object] },
    etats: { type: [Object] },
    typeObjetConcerne: { type: String },
    refObjetConcerne: { type: ObjectId },
    faqOrigine: { type: Schema.Types.ObjectId, ref: "faq" },
    envoyeReponse: { type: Boolean },
    reponceEnvoye: { type: Boolean },
    dateEnvoie: { type: Date },
    transfere: { type: Boolean },
    qestionDestination: { type: Schema.Types.ObjectId, ref: "questionsFAQ" },
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [];
instancequestionsFAQSchema.pre("aggregate", function (next) {
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
instancequestionsFAQSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

//rewrite insertMany
instancequestionsFAQSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    this.populate(doc, populateField);

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
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
instancequestionsFAQSchema.post(/find.*|save/, async function (doc, next) {
  try {
    if (doc) {
      await distantRequest(doc);
      next();
    }
  } catch (err) {
    next(err);
  }
});

instancequestionsFAQSchema.post("save", async function (doc, next) {
  try {
    next();
  } catch (error) {
    next(error);
  }
});

instancequestionsFAQSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await instancequestionsFAQ.findOne(this.getQuery()).lean();
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
instancequestionsFAQSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    next();
  } catch (error) {
    next(error);
  }
});
instancequestionsFAQSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await instancequestionsFAQ.find(this.getQuery()).lean();
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
instancequestionsFAQSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await instancequestionsFAQ.find(this.getQuery()).lean();
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
            await PublishMessage(INSTANCEQUESTIONSFAQ_CLIENT_QUEUE, {
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
            await PublishMessage(INSTANCEQUESTIONSFAQ_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(INSTANCEQUESTIONSFAQ_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          return;
        case "postUpdateMany":
          await PublishMessage(INSTANCEQUESTIONSFAQ_CLIENT_QUEUE, {
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
    console.error("instancequestionsFAQ communicateWithClient error==>", error);
  }
}

//add other hooks here
const instancequestionsFAQ = mongoose.model(
  "instancequestionsFAQ",
  instancequestionsFAQSchema
);
module.exports = instancequestionsFAQ;
const { PublishMessage } = require("../helpers/communications");


const { sendRPCRequest } = require("../helpers/helpers");

const {
  MEMBRE_ADMIN_RPC,
  INSTANCEQUESTIONSFAQ_CLIENT_QUEUE,
} = require("../config");
