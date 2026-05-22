const mongoose = require("mongoose");
const { DOMAIN_CLIENT_QUEUE } = require("../config");
const { PublishMessage } = require("../helpers/communications");
const Schema = mongoose.Schema;

let domainSchema = new Schema(
  {
    translations: [
      {
        language: String,
        designation: String,
        description: String,
      },
    ],
    logo: String,
    code: { type: String, required: true },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "domain",
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: "domain",
      },
    ],
    /* children: {
      type: [{
          type: Schema.Types.ObjectId,
          ref: "domain"
      }],
      minItems :1,
      maxItems :10,
      
  },*/
    taxonomies: [
      {
        type: Schema.Types.ObjectId,
        ref: "taxonomie",
      },
    ],
    hasTaxonomies: { type: Boolean, default: false },
    etatObjet: { type: String, default: "code-1" },
    etatCreation: { type: String, default: "etatCreation.creation" },
  },
  {
    timestamps: true,
  }
);

let autoPopulateChildren = function (next) {
  this.populate([
    {
      path: "children",
      match: {
        etatObjet: "code-1",
      },
    },
    {
      path: "taxonomies",
      match: {
        etatObjet: "code-1",
      },
    },
  ]);
  next();
};

domainSchema.pre("aggregate", function (next) {
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
domainSchema.pre("find", autoPopulateChildren);
domainSchema.pre("findOne", autoPopulateChildren);

domainSchema.post("save", (doc, next) => {
  if (doc) {
    PublishMessage(DOMAIN_CLIENT_QUEUE, {
      operation: "ADD_ITEM",
      data: { req: { body: doc } },
    });
  }
  if (doc.parent) {
    domain.findByIdAndUpdate(
      doc.parent.toString(),
      { $push: { children: doc._id } },
      (err, doc) => {
        next();
      }
    );
  } else {
    next();
  }
});
domainSchema.post("insertMany", (docs, next) => {
  try {
    if (docs[0].parent) {
      domain.updateOne(
        { _id: docs[0].parent.toString() },
        { $addToSet: { children: { $each: docs.map((d) => d._id) } } },
        (err, doc) => {
          next();
        }
      );
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
});
let prevParent;
domainSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await domain.findOne(this.getQuery()).lean();
    if (doc) {
      prevParent = doc.parent
        ? (doc.parent?._id || doc.parent).toString()
        : null;
    }
    next();
  } catch (error) {
    next(error);
  }
});
domainSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    if (doc.parent && prevParent != (doc.parent._id || doc.parent).toString()) {
      await domain.updateOne(
        { _id: (doc.parent._id || doc.parent).toString() },
        { $addToSet: { children: doc._id } }
      );
    } else if (!doc.parent && prevParent) {
      await domain.updateOne(
        { _id: prevParent.toString() },
        { $pull: { children: doc._id } }
      );
    }
    if (doc) {
      PublishMessage(DOMAIN_CLIENT_QUEUE, {
        operation: "UPDATE_ITEM",
        data: { req: { params: { id: doc._id }, body: doc } },
      });
    }
    next()

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
    if (methode == "postUpdateMany" || doc?.etatCreation) {
      switch (methode) {
        case "preFindOneAndUpdate":
          if (
            targetState &&
            targetState != "code_3417" &&
            prevState == "code_3417"
          ) {
            await PublishMessage(DOMAIN_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatCreation &&
            doc.etatCreation == "code_3417"
          ) {
            await PublishMessage(DOMAIN_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatCreation == "code_3417") {
            await PublishMessage(DOMAIN_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          return;
        case "postUpdateMany":
          await PublishMessage(DOMAIN_CLIENT_QUEUE, {
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
    console.error("infoEnchere communicateWithClient error==>", error);
  }
}
module.exports = domain = mongoose.model("domain", domainSchema);
