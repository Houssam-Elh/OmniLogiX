const mongoose = require("mongoose");
const produitService = require("./produitService.model");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let typeRelationSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    produitPrincipal: { type: Schema.Types.ObjectId, ref: "produitService" },
    produitAssocie: [{ type: Schema.Types.ObjectId, ref: "produitService" }],
    typeRelation: {
      type: String,
      required: true,
      enum: ["code_3034", "code_997"],
    },
  },
  { timestamps: true }
);

//  autoPopulate hook

typeRelationSchema.pre("aggregate", function (next) {
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
typeRelationSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      { path: "produitAssocie", match: { etatObjet: "code-1" }, populate: [] },
    ]);
    next();
  } catch (error) {
    next(error);
  }
});
typeRelationSchema.post("save", async function (doc, next) {
  try {
    if (this.produitPrincipal) {
      await produitService.updateOne(
        { _id: this.produitPrincipal.toString() },
        { $addToSet: { typeRelation: this._id } }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
typeRelationSchema.post("insertMany", async function (doc, next) {
  try {
    let produitPrincipal = GroupBy(doc, "produitPrincipal");
    for (let item of Object.keys(produitPrincipal)) {
      if (item)
        await produitService.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              typeRelation: { $each: produitPrincipal[item].map((d) => d._id) },
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
typeRelationSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await typeRelation.findOne(this.getQuery()).lean();
    if (doc) {
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );

      const produitPrincipalId = this._update?.["$set"]?.produitPrincipal;
      if (
        produitPrincipalId &&
        doc?.produitPrincipal != produitPrincipalId &&
        doc?.produitPrincipal != undefined
      )
        await produitService.updateOne(
          { _id: doc.produitPrincipal.toString() },
          { $pull: { typeRelation: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
typeRelationSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.produitPrincipal)
      await produitService.updateOne(
        {
          _id: doc.produitPrincipal?._id?.toString() || doc.produitPrincipal,
        },
        { $addToSet: { typeRelation: doc._id } }
      );

    next();
  } catch (error) {
    next(error);
  }
});

typeRelationSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await typeRelation.find(this.getQuery()).lean();
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

typeRelationSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await typeRelation.find(this.getQuery()).lean();
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
            await PublishMessage(TYPERELATION_CLIENT_QUEUE, {
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
            await PublishMessage(TYPERELATION_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(TYPERELATION_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          return;
        case "postUpdateMany":
          await PublishMessage(TYPERELATION_CLIENT_QUEUE, {
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
    console.error("typeRelation communicateWithClient error==>", error);
  }
}

const typeRelation = mongoose.model("typeRelation", typeRelationSchema);
module.exports = typeRelation;

const { GroupBy } = require("../helpers/helpers");

const { PublishMessage } = require("../helpers/communications");
const { TYPERELATION_CLIENT_QUEUE } = require("../config");
