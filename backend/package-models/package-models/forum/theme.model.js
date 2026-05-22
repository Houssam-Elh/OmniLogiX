const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let themeSchema = new Schema(
  {
    etatDePublication: {
      type: String,
      required: true,
      enum: ["code_541", "code_3516", "code_3417"],
    },
    reference: { type: String, required: true, unique: true },
    type: [{ type: Schema.Types.Mixed, required: true }],
    translations: {
      type: [
        {
          language: { type: String },
          designationTheme: { type: String, required: true },
          descriptifTheme: { type: String },
        },
      ],
    },
    refResponsableTheme: { type: Schema.Types.Mixed, required: true },
    ordre: { type: Number },
    imageTheme: { type: String },
    dateOuverture: { type: Date, required: true },
    datecloture: { type: Date, required: true },
    nbrParticipants: { type: Number },
    nbrEchanges: { type: Number },
    participations: [{ type: Schema.Types.ObjectId, ref: "partcipation" }],
    forum: { type: Schema.Types.ObjectId, ref: "forum", required: true },
    etatObjet: { type: String, default: "code-1" },
    objetsAssocies: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

themeSchema.pre("aggregate", function (next) {
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
themeSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      // { path: "type", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "refResponsableTheme",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "participations", match: { etatObjet: "code-1" }, populate: [] },
      // { path: "forum", match: { etatObjet: "code-1" }, populate: [] },
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
              ["type"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              MEMBRE_ADMIN_RPC,
              ["refResponsableTheme"],
              "VIEW_ITEMS",
              {}
            ),
          ]
          : [
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["type"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              MEMBRE_ADMIN_RPC,
              ["refResponsableTheme"],
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
            if (d["type"] && d["type"].length)
              d["type"] = d["type"].map(
                (d) =>
                  (d = result[0].find((item) => item._id == (d._id || d)) || d)
              );
            if (d["refResponsableTheme"])
              d["refResponsableTheme"] =
                result[1].find(
                  (item) =>
                    item._id ==
                    (d["refResponsableTheme"]._id || d["refResponsableTheme"])
                ) || d["refResponsableTheme"];
          });
        } else {
          if (doc["type"] && doc["type"].length)
            doc["type"] = doc["type"].map(
              (d) =>
                (d = result[0].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["refResponsableTheme"])
            doc["refResponsableTheme"] =
              result[1].find(
                (item) =>
                  item._id ==
                  (doc["refResponsableTheme"]._id || doc["refResponsableTheme"])
              ) || doc["refResponsableTheme"];
          if (doc["objetsAssocies"] && doc["objetsAssocies"].length)
            doc["objetsAssocies"] = doc["objetsAssocies"].map(
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
themeSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

themeSchema.post("save", async function (doc, next) {
  try {
    if (this.forum) {
      await Forum.updateOne(
        { _id: this.forum.toString() },
        { $addToSet: { themes: this._id } }
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
          body: { refObjet: doc._id, typeObjetConcerne: "THEME_FORUM" },
        }
      );

    //#enregion new save bloc
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
themeSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    let forum = GroupBy(doc, "forum");
    for (let item of Object.keys(forum)) {
      if (item)
        await Forum.updateOne(
          { _id: item.toString() },
          { $addToSet: { themes: { $each: forum[item].map((d) => d._id) } } }
        );
    }

    next();
  } catch (error) {
    next(error);
  }
});
let prevState = null;
let itemToCheck = {};

themeSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await theme.findOne(this.getQuery()).lean();

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["objetsAssocies"] = doc.objetsAssocies;
      //#endregion new pre find and update bloc
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const forumId = this._update?.["$set"]?.forum;
      if (doc?.forum != forumId && doc?.forum != undefined)
        await Forum.updateOne(
          { _id: doc.forum.toString() },
          { $pull: { themes: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
themeSchema.post("findOneAndUpdate", async function (doc, next) {
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
        bodyPush: { refObjet: doc._id, typeObjetConcerne: "THEME_FORUM" },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);
    console.log("doc", doc);
    if (doc.forum)
      await Forum.updateOne(
        { _id: doc.forum?._id?.toString() || doc.forum },
        { $addToSet: { themes: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
themeSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await theme.find(this.getQuery()).lean();
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
          if (d.imageTheme) files.push(d.imageTheme);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let participations = [];
        doc.map((d) => {
          participations.push(...d.participations.map((v) => v._id || v));
        });
        if (participations.length) {
          promises.push(
            Partcipation.updateMany(
              { _id: { $in: participations } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let participations = [];

        doc.map((d) => {
          participations.push(...d.participations.map((v) => v._id || v));
        });
        if (participations.length) {
          promises.push(
            Partcipation.updateMany(
              { _id: { $in: participations } },
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
themeSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await theme.find(this.getQuery()).lean();
    const promises = [];
    let participations = [];
    doc.map((d) => {
      participations.push(...d.participations.map((v) => v._id || v));
    });
    if (participations.length) {
      promises.push(
        Partcipation.deleteMany({ _id: { $in: participations } }).exec()
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
            await PublishMessage(THEME_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            if (doc.imageTheme) files.push(doc.imageTheme);

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(THEME_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(THEME_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            let files = [];
            if (doc.imageTheme) files.push(doc.imageTheme);

            copyFiles(files);
            if (doc?.participations?.length) {
              PublishPartcipation(doc.participations);
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
          await PublishMessage(THEME_CLIENT_QUEUE, {
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
    console.error("theme communicateWithClient error==>", error);
  }
}
//add other hooks here
const theme = mongoose.model("theme", themeSchema);
module.exports = theme;
const Forum = require("../models/forum.model");
const Partcipation = require("../models/partcipation.model");

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
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  MEMBRE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_QUEUE,
  THEME_CLIENT_QUEUE,
} = require("../config");
