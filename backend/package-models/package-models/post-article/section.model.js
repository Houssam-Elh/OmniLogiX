const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let sectionSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    translations: {
      type: [
        {
          language: { type: String },
          titreSection: { type: String, required: true },
          sousTitre: { type: String },
          contenuSection: { type: String },
          contenuCms: { type: String },
        },
      ],
    },
    typeContenu: {
      type: String,
      required: true,
      enum: ["code_6959", "code_6960"],
    },
    ordreSection: { type: Number, required: true },
    sectionParent: { type: Schema.Types.ObjectId, ref: "section" },
    sectionChildren: [{ type: Schema.Types.ObjectId, ref: "section" }],
    postArticle: { type: Schema.Types.ObjectId, ref: "postArticle" },
    motsCles: [{ type: Schema.Types.ObjectId, ref: "motcles" }],
    instanceElementAssocie: [
      { type: Schema.Types.ObjectId, ref: "instanceElementAssocie" },
    ],
    contenuMMedia: { type: [ObjectId] },
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [
  { path: "sectionChildren", match: { etatObjet: "code-1" }, populate: [] },
  { path: "motsCles", match: { etatObjet: "code-1" }, populate: [] },
  {
    path: "instanceElementAssocie",
    match: { etatObjet: "code-1" },
    populate: [],
  },
];
sectionSchema.pre("aggregate", function (next) {
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
sectionSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
let prevState = null;

sectionSchema.post("save", async function (doc, next) {
  try {
    if (this.postArticle) {
      await PostArticle.updateOne(
        { _id: this.postArticle.toString() },
        { $addToSet: { sections: this._id } }
      );
    }
    if (this.sectionParent) {
      await section.updateOne(
        { _id: this.sectionParent.toString() },
        { $addToSet: { sectionChildren: this._id } }
      );
    } else if (this.sectionChildren?.length) {
      await section.updateMany(
        { _id: { $in: this.sectionChildren.map((d) => d._id || d) } },
        { $set: { sectionParent: this._id } }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
sectionSchema.post("insertMany", async function (doc, next) {
  try {
    this.populate(doc, populateField);

    let postArticle = GroupBy(doc, "postArticle");
    for (let item of Object.keys(postArticle)) {
      if (item)
        await PostArticle.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              sections: { $each: postArticle[item].map((d) => d._id) },
            },
          }
        );
    }

    let sectionParent = GroupBy(doc, "sectionParent");
    for (let item of Object.keys(sectionParent)) {
      if (item)
        await section.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              sectionChildren: { $each: sectionParent[item].map((d) => d._id) },
            },
          }
        );
    }

    next();
  } catch (error) {
    next(error);
  }
});
sectionSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await section.findOne(this.getQuery()).lean();
    if (doc) {
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const postArticleId = this._update?.["$set"]?.postArticle;
      if (
        postArticleId &&
        doc?.postArticle != postArticleId &&
        doc?.postArticle != undefined
      ) {
        await PostArticle.updateOne(
          { _id: doc.postArticle.toString() },
          { $pull: { sections: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
sectionSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    communicateWithClient("postFindOneAndUpdate", doc, prevState);
    if (doc.postArticle) {
      await PostArticle.updateOne(
        { _id: doc.postArticle?._id?.toString() || doc.postArticle },
        { $addToSet: { sections: doc._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
sectionSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await section.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        communicateWithClient("postUpdateMany", this.getQuery());

        let sectionChildren = [];
        let motsCles = [];
        let instanceElementAssocie = [];
        doc.map((d) => {
          sectionChildren.push(...d.sectionChildren.map((v) => v._id || v));
          motsCles.push(...d.motsCles.map((v) => v._id || v));
          instanceElementAssocie.push(
            ...d.instanceElementAssocie.map((v) => v._id || v)
          );
        });
        if (sectionChildren.length) {
          promises.push(
            section
              .updateMany(
                { _id: { $in: sectionChildren } },
                { $set: { etatObjet: "code-2" } }
              )
              .exec()
          );
        }
        if (motsCles.length) {
          promises.push(
            Motcles.updateMany(
              { _id: { $in: motsCles } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (instanceElementAssocie.length) {
          promises.push(
            InstanceElementAssocie.updateMany(
              { _id: { $in: instanceElementAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let sectionChildren = [];
        let motsCles = [];
        let instanceElementAssocie = [];

        doc.map((d) => {
          sectionChildren.push(...d.sectionChildren.map((v) => v._id || v));
          motsCles.push(...d.motsCles.map((v) => v._id || v));
          instanceElementAssocie.push(
            ...d.instanceElementAssocie.map((v) => v._id || v)
          );
        });
        if (sectionChildren.length) {
          promises.push(
            section
              .updateMany(
                { _id: { $in: sectionChildren } },
                { $set: { etatObjet: "code-1" } }
              )
              .exec()
          );
        }
        if (motsCles.length) {
          promises.push(
            Motcles.updateMany(
              { _id: { $in: motsCles } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (instanceElementAssocie.length) {
          promises.push(
            InstanceElementAssocie.updateMany(
              { _id: { $in: instanceElementAssocie } },
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
sectionSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await section.find(this.getQuery()).lean();
    const promises = [];
    let sectionChildren = [];
    let motsCles = [];
    let instanceElementAssocie = [];
    doc.map((d) => {
      sectionChildren.push(...d.sectionChildren.map((v) => v._id || v));
      motsCles.push(...d.motsCles.map((v) => v._id || v));
      instanceElementAssocie.push(
        ...d.instanceElementAssocie.map((v) => v._id || v)
      );
    });
    if (sectionChildren.length) {
      promises.push(
        section.deleteMany({ _id: { $in: sectionChildren } }).exec()
      );
    }
    if (motsCles.length) {
      promises.push(Motcles.deleteMany({ _id: { $in: motsCles } }).exec());
    }
    if (instanceElementAssocie.length) {
      promises.push(
        InstanceElementAssocie.deleteMany({
          _id: { $in: instanceElementAssocie },
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
            await PublishMessage(SECTION_CLIENT_QUEUE, {
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
            await PublishMessage(SECTION_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(SECTION_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            if (doc?.sectionParent?.length) {
              PublishSection(doc.sectionParent);
            }
            if (doc?.motsCles?.length) {
              PublishMotcles(doc.motsCles);
            }
            if (doc?.instanceElementAssocie?.length) {
              PublishInstanceElementAssocie(doc.instanceElementAssocie);
            }
          }
          return;
        case "postUpdateMany":
          await PublishMessage(SECTION_CLIENT_QUEUE, {
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
    console.error("section communicateWithClient error==>", error);
  }
}

//add other hooks here
const section = mongoose.model("section", sectionSchema);
module.exports = section;
const PostArticle = require("../models/postArticle.model");
const { GroupBy } = require("../helpers/helpers");
const Motcles = require("../models/motcles.model");
const InstanceElementAssocie = require("../models/instanceElementAssocie.model");
const { PublishMessage } = require("../helpers/communications");
const { SECTION_CLIENT_QUEUE } = require("../config");
const {
  PublishData: PublishMotcles,
} = require("./repositories/motcles.repositorie");
const {
  PublishData: PublishInstanceElementAssocie,
} = require("./repositories/instanceElementAssocie.repositorie");
