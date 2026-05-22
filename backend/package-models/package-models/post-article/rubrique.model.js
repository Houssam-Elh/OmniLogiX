const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let rubriqueSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    refRubrique: { type: String, required: true, unique: true },
    taxoCategorie: { type: Schema.Types.Mixed, required: true },
    translations: {
      type: [
        {
          language: { type: String },
          titreRubrique: { type: String, required: true },
          descriptif: { type: String, required: true },
        },
      ],
    },
    photoRubrique: { type: String },
    iconeRubrique: { type: String },
    etatDePublication: {
      type: String,
      required: true,
      enum: [
        "code_541",
        "code_223",
        "code_3516",
        "code_550",
        "code_318",
        "code_11201",
        "code_3417",
      ],
    },
    postArticle: [{ type: Schema.Types.ObjectId, ref: "postArticle" }],
    menu: { type: [ObjectId] },
    blogs: [{ type: Schema.Types.ObjectId }],
    objetsConcernes: {
      type: [
        {
          typeObjet: { type: String },
          refObjet: { type: Schema.Types.ObjectId },
          _id: false,
        },
      ],
    },
  },
  { timestamps: true }
);

//  autoPopulate hook

// hooks
async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["taxoCategorie"],
                "VIEW_ITEMS",
                {}
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["taxoCategorie"],
                "VIEW_ITEMS",
                {}
              ),
            ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["taxoCategorie"])
              d["taxoCategorie"] =
                result[0].find(
                  (item) =>
                    item._id == (d["taxoCategorie"]._id || d["taxoCategorie"])
                ) || d["taxoCategorie"];
          });
        } else {
          if (doc["taxoCategorie"])
            doc["taxoCategorie"] =
              result[0].find(
                (item) =>
                  item._id == (doc["taxoCategorie"]._id || doc["taxoCategorie"])
              ) || doc["taxoCategorie"];
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
rubriqueSchema.pre("aggregate", function (next) {
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

rubriqueSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      {
        path: "postArticle",
        match: { etatObjet: "code-1" },
        populate: [],
        select: "-rubriques",
      },
    ]);
    next();
  } catch (error) {
    next(error);
  }
});

rubriqueSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});
rubriqueSchema.post("save", async function (doc, next) {
  try {
    if (this.postArticle?.length) {
      await PostArticle.updateMany(
        { _id: { $in: this.postArticle } },
        { $addToSet: { rubriques: this._id } }
      );
    }

    if (doc.blogs && doc.blogs.length) {
      publishUpdate("update_items", doc.blogs, BLOG_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { rubrique: doc._id },
      });
    }
    if (doc.objetsConcernes.length) {
      let data = GroupBy(doc.objetsConcernes, "typeObjet");
      for (let item of Object.keys(data)) {
        if (item) {
          let body;
          let key;
          if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
            key = ACTEURSPRO_ADMIN_QUEUE;
            body = { operation: "$set", body: { conseilPratiques: doc._id } };
          }


          
          if (body)
            publishUpdate(
              "update_items",
              data[item].map((i) => i.refObjet),
              key,
              body
            );
        }
      }
    }

    next();
  } catch (error) {
    console.log("🚀 ~ error:", error);
    next(error);
  }
});

rubriqueSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);
    let blogs = GroupBy(doc, "blogs");
    for (let item of Object.keys(blogs)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(blogs[item].map((d) => d.blogs)))],
          BLOG_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { rubrique: { $each: blogs[item].map((i) => i._id) } },
          }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});

let prevState = null;
let itemToCheck = {};

rubriqueSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await rubrique.findOne(this.getQuery()).lean();
    if (doc) {
      prevState = doc?.etatDePublication;
      itemToCheck["blogs"] = doc.blogs;

      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const postArticleIds = this._update?.["$set"]?.postArticle;
      if (
        postArticleIds &&
        doc?.postArticle &&
        doc?.postArticle?.length != postArticleIds?.length
      ) {
        let ids = doc?.postArticle
          .map((item) => item._id || item)
          .filter((item) => !postArticleIds.includes(item));
        await PostArticle.updateMany(
          { _id: { $in: ids } },
          { $pull: { rubriques: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
rubriqueSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["blogs"], newData: doc.blogs },
      BLOG_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { rubrique: doc._id },
        bodyPush: { rubrique: doc._id },
      }
    );

    if (doc.postArticle)
      await PostArticle.updateMany(
        { _id: { $in: doc.postArticle.map((d) => d._id || d) } },
        { $addToSet: { rubriques: doc._id } }
      );

    next();
  } catch (error) {
    next(error);
  }
});
rubriqueSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      if (this._update?.["$addToSet"].postArticle) {
        await PostArticle.updateOne(
          { _id: this._update?.["$addToSet"]?.postArticle },
          { $addToSet: { rubriques: { $each: this.getQuery()._id["$in"] } } }
        );
      }

      if (this._update?.["$addToSet"]?.blogs && docs.modifiedCount)
        publishUpdate(
          "update_items",
          this._update?.["$addToSet"].blogs,
          BLOG_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { rubrique: { $each: this.getQuery()._id["$in"] } },
          }
        );
    } else {
      let doc = await rubrique.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.blogs)))],
          BLOG_ADMIN_QUEUE,
          { operation: "$pull", body: { rubrique: this.getQuery()._id } }
        );

        let files = [];

        doc.map((d) => {
          if (d.photoRubrique) files.push(d.photoRubrique);
          if (d.iconeRubrique) files.push(d.iconeRubrique);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        doc.map(() => {});
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let postArticle = [];

        doc.map((d) => {
          postArticle.push(...d.postArticle.map((v) => v._id || v));
        });
        if (postArticle.length) {
          promises.push(
            PostArticle.updateMany(
              { _id: { $in: postArticle } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
      }

      if (this._update?.["$pull"]) {
        if (this._update?.["$pull"]?.blogs && docs.modifiedCount)
          publishUpdate(
            "update_items",
            this._update?.["$pull"].blogs,
            BLOG_ADMIN_QUEUE,
            { operation: "$pull", body: { rubrique: this.getQuery()._id } }
          );
      }

      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
rubriqueSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await rubrique.find(this.getQuery()).lean();
    const promises = [];

    doc.map(() => {});

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
            await PublishMessage(RUBRIQUE_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];

            if (doc.photoRubrique) files.push(doc.photoRubrique);
            if (doc.iconeRubrique) files.push(doc.iconeRubrique);

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(RUBRIQUE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(RUBRIQUE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            let files = [];
            if (doc.photoRubrique) files.push(doc.photoRubrique);
            if (doc.iconeRubrique) files.push(doc.iconeRubrique);
            copyFiles(files);
            if (doc?.postArticle?.length) {
              articleRepo.PublishData(doc.postArticle, "rubrique");
            }
            //#region new publish bloc
            if (doc.blogs.length)
              publishUpdate("publish_data", doc.blogs, BLOG_ADMIN_QUEUE);
            //#endregion new publish bloc
          }
          return;
        case "postUpdateMany":
          await PublishMessage(RUBRIQUE_CLIENT_QUEUE, {
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
    console.error("rubrique communicateWithClient error==>", error);
  }
}
//add other hooks here
const rubrique = mongoose.model("rubrique", rubriqueSchema);
module.exports = rubrique;

const { PublishMessage } = require("../helpers/communications");
const {
  sendRPCRequest,
  publishUpdate,
  copyFiles,
  removeFiles,
  flatDeep,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  BLOG_ADMIN_QUEUE,
  RUBRIQUE_CLIENT_QUEUE,
  ACTEURSPRO_ADMIN_QUEUE,
} = require("../config");

const { GroupBy } = require("../helpers/helpers");
const articleRepo = require("./repositories/postArticle.repositorie");
const PostArticle = require("../models/postArticle.model");
