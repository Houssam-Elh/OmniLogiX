const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let acteurForumSchema = new Schema(
  {
    etatDePublication: {
      type: String,
      required: true,
      enum: ["code_319", "code_3417", "code_311"],
    },
    type: {
      type: String,
      enum: ["code_161", "code_414", "code_1948", "code_2119", "code_4384"],
    },
    reference: { type: String },
    translations: {
      type: [
        {
          language: { type: String },
          nom: { type: String, required: true },
          apropos: { type: String },
        },
      ],
    },
    refMembre: { type: Schema.Types.Mixed },
    pseudoAuteur: { type: String },
    emailAuteur: { type: String },
    passWord: { type: String },
    imageAuteur: { type: String },
    etatMembre: {
      type: String,
      enum: ["code_4316", "code_4317", null],
    },
    froum: [{ type: Schema.Types.ObjectId, ref: "forum" }],
    participation: [{ type: Schema.Types.ObjectId, ref: "partcipation" }],
    etatObjet: { type: String, default: "code-1" },
    objetsAssocies: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

acteurForumSchema.pre("aggregate", function (next) {
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
acteurForumSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      { path: "refMembre", match: { etatObjet: "code-1" }, populate: [] },
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
                MEMBRE_ADMIN_RPC,
                ["refMembre"],
                "VIEW_ITEMS",
                {}
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                MEMBRE_ADMIN_RPC,
                ["refMembre"],
                "VIEW_ITEMS",
                {}
              ),
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
          doc.map((d) => {
            if (d["refMembre"])
              d["refMembre"] =
                result[0].find(
                  (item) => item._id == (d["refMembre"]._id || d["refMembre"])
                ) || d["refMembre"];
          });
        } else {
          if (doc["refMembre"])
            doc["refMembre"] =
              result[0].find(
                (item) => item._id == (doc["refMembre"]._id || doc["refMembre"])
              ) || doc["refMembre"];
          if (doc["objetsAssocies"] && doc["objetsAssocies"].length)
            doc["objetsAssocies"] = doc["objetsAssocies"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
acteurForumSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

//rewrite insertMany
acteurForumSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    //comment ADMIN_QUEUE

    next();
  } catch (error) {
    next(error);
  }
});

acteurForumSchema.post("save", async function (doc, next) {
  try {
    if (this.froum?.length) {
      console.log("🚀 ~ this.froum:", this.froum);
      await Forum.updateMany(
        { _id: { $in: this.froum } },
        {
          $inc: {
            nombreGlobalDesMembres: 1,
            nombreDesMembresActifs: this.etatMembre == "code_4316" ? 1 : 0,
          },
          $addToSet: { acteurs: this._id },
        }
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
          body: { refObjet: doc._id, typeObjetConcerne: "ACTEURFORUM_FORUM" },
        }
      );

    //#enregion new save bloc
    next();
  } catch (error) {
    next(error);
  }
});

let prevState = null;
let itemToCheck = {};

acteurForumSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await acteurForum.findOne(this.getQuery()).lean();
    console.log("🚀 ~ doc:", doc);

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["objetsAssocies"] = doc.objetsAssocies;
      //#endregion new pre find and update bloc
      prevState = doc?.etatDePublication;
      console.log(`🚀 ~ this._update["$set"]:`, this._update["$set"]);

      if (this._update["$set"].etatDePublication)
        communicateWithClient(
          "preFindOneAndUpdate",
          doc,
          prevState,
          this._update["$set"].etatDePublication
        );

      if (this._update?.["$set"]?.froum) {
        const froumIds = this._update?.["$set"]?.froum;
        if (doc?.froum && doc?.froum?.length != froumIds?.length) {
          let ids = doc?.froum
            .map((item) => item._id || item)
            .filter((item) => !froumIds.includes(item));
          await Forum.updateMany(
            { _id: { $in: ids } },
            {
              $inc: {
                nombreDesMembresActifs: this.etatMembre == "code_4316" ? 1 : 0,
              },
              $pull: { acteurs: doc._id },
            }
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
acteurForumSchema.post("findOneAndUpdate", async function (doc, next) {
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
        bodyPush: { refObjet: doc._id, typeObjetConcerne: "ACTEURFORUM_FORUM" },
      }
    );
    //#endregion new post find and update bloc
    console.log('console.log(this.update)',this._update)
    if(doc.etatDePublication != prevState )
     communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.froum)
      for (d of doc.froum) {
        await Forum.updateOne(
          { _id: d._id || d },
          { $addToSet: { acteurs: doc._id } }
        );
      }
    next();
  } catch (error) {
    next(error);
  }
});
acteurForumSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      if (this._update?.["$addToSet"].froum) {
        await Forum.updateOne(
          { _id: this._update?.["$addToSet"]?.froum },
          { $addToSet: { acteurs: { $each: this.getQuery()._id["$in"] } } }
        );
      }
    } else {
      let doc = await acteurForum.find(this.getQuery()).lean();
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
        let files = [];

        doc.map((d) => {
          if (d.imageAuteur) files.push(d.imageAuteur);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let participation = [];
        doc.map((d) => {
          participation.push(...d.participation.map((v) => v._id || v));
        });
        if (participation.length) {
          promises.push(
            Partcipation.updateMany(
              { _id: { $in: participation } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let froum = [];
        let participation = [];

        doc.map((d) => {
          froum.push(...d.froum.map((v) => v._id || v));
          participation.push(...d.participation.map((v) => v._id || v));
        });
        if (froum.length) {
          promises.push(
            Forum.updateMany(
              { _id: { $in: froum } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (participation.length) {
          promises.push(
            Partcipation.updateMany(
              { _id: { $in: participation } },
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
acteurForumSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await acteurForum.find(this.getQuery()).lean();
    const promises = [];
    let participation = [];
    doc.map((d) => {
      participation.push(...d.participation.map((v) => v._id || v));
    });
    if (participation.length) {
      promises.push(
        Partcipation.deleteMany({ _id: { $in: participation } }).exec()
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
            await PublishMessage(ACTEURFORUM_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            if (doc.imageAuteur) files.push(doc.imageAuteur);

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(ACTEURFORUM_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(ACTEURFORUM_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            let files = [];
            if (doc.imageAuteur) files.push(doc.imageAuteur);

            copyFiles(files);
            if (doc?.froum?.length) {
              PublishForum(doc.froum);
            }
            if (doc?.participation?.length) {
              PublishPartcipation(doc.participation);
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
          await PublishMessage(ACTEURFORUM_CLIENT_QUEUE, {
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
    console.error("acteurForum communicateWithClient error==>", error);
  }
}
//add other hooks here
const acteurForum = mongoose.model("acteurForum", acteurForumSchema);
module.exports = acteurForum;
const Forum = require("../models/forum.model");
const Partcipation = require("../models/partcipation.model");

const {
  PublishData: PublishForum,
} = require("./repositories/forum.repositorie");
const {
  PublishData: PublishPartcipation,
} = require("./repositories/partcipation.repositorie");

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
  MEMBRE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_QUEUE,
  ACTEURFORUM_CLIENT_QUEUE,
} = require("../config");
