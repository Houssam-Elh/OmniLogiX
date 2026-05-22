const mongoose = require("mongoose");
const domain = require("./domain.model");
const Schema = mongoose.Schema;

let taxonomieSchema = new Schema(
  {
    translations: [
      {
        language: String,
        designation: String,
        description: String,
      },
    ],
    domain: { type: mongoose.Schema.Types.ObjectId, ref: "domain" },
    logo: String,
    parent: {
      type: mongoose.Types.ObjectId,
      ref: "taxonomie",
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "taxonomie",
      },
    ],
    etatObjet: { type: String, default: "code-1" },
    etatCreation: { type: String, default: "etatCreation.creation" },
  },
  {
    timestamps: true,
  }
);

let autoPopulateChildren = function (next) {
  this.populate({
    path: "children",
    match: {
      etatObjet: "code-1",
    },
  });
  next();
};

taxonomieSchema.pre("aggregate", function (next) {
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
taxonomieSchema.pre("find", autoPopulateChildren);
taxonomieSchema.pre("findOne", autoPopulateChildren);

// taxonomieSchema.pre("save", function (next) {

// });

taxonomieSchema.post("save", async (doc, next) => {
  try {
    if (doc.domain) {
      await domain.findByIdAndUpdate(doc.domain.toString(), {
        $push: { taxonomies: doc._id },
      });
    }

    if (doc.parent) {
      await taxonomie.findByIdAndUpdate(doc.parent.toString(), {
        $push: { children: doc._id },
      });
    }
    PublishMessage(TAXONOMIE_CLIENT_QUEUE, {
      operation: "ADD_ITEM",
      data: { req: { body: doc } },
    });
  } catch (err) {
    next(err);
  }
});

taxonomieSchema.post("insertMany", async (docs, next) => {
  try {
    let domains = GroupBy(docs, "domain");
    for (let item of Object.keys(domains))
      if (item) {
        await domain.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              taxonomies: { $each: domains[item].map((d) => d._id) },
            },
          }
        );
      }

    let parents = GroupBy(docs, "parent");
    for (let parent of Object.keys(parents))
      if (parent) {
        await taxonomie.updateOne(
          { _id: parent.toString() },
          {
            $addToSet: {
              children: { $each: parents[parent].map((d) => d._id) },
            },
          }
        );
      }
  } catch (err) {
    next(err);
  }
});
taxonomieSchema.post("findOneAndUpdate", async function (doc, next) {
  if(doc){
  PublishMessage(TAXONOMIE_CLIENT_QUEUE, {
    operation: "UPDATE_ITEM",
    data: { req: { params: { id: doc._id }, body: doc } },
  });
}
  next()
})
module.exports = taxonomie = mongoose.model("taxonomie", taxonomieSchema);

const { GroupBy } = require("../helpers/helpers");const { PublishMessage } = require("../helpers/communications");
const { TAXONOMIE_CLIENT_QUEUE } = require("../config");

