const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let forumSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    categorie: [{ type: Schema.Types.Mixed, required: true }],
    translations: {
      type: [
        {
          language: { type: String },
          designation: { type: String, required: true },
          description: { type: String },
        },
      ],
    },
    refresponsable: { type: Schema.Types.Mixed, required: true },
    dateOuverture: { type: Date, required: true },
    dateCloture: { type: Date, required: true },
    imageRepresentative: { type: String },
    nombreGlobalDesMembres: { type: Number, default: 0 },
    nombreDesMembresActifs: { type: Number, default: 0 },
    nombreDesEchanges: { type: Number, default: 0 },
    themes: [{ type: Schema.Types.ObjectId, ref: "theme", required: true }],
    acteurs: [{ type: Schema.Types.ObjectId, ref: "acteurForum" }],
    etatDePublication: {
      type: String,
      required: true,
      enum: ["code_541", "code_3516", "code_3417"],
    },
    etatObjet: { type: String, default: "code-1" },
    objetsAssocies: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

forumSchema.pre("aggregate", function (next) {
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
forumSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      // { path: "categorie", match: { etatObjet: "code-1" }, populate: [] },
      // { path: "refresponsable", match: { etatObjet: "code-1" }, populate: [] },
      { path: "themes", match: { etatObjet: "code-1" }, populate: [] },
      { path: "acteurs", match: { etatObjet: "code-1" }, populate: [] },
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
              ["categorie"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              MEMBRE_ADMIN_RPC,
              ["refresponsable"],
              "VIEW_ITEMS",
              {}
            ),
          ]
          : [
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["categorie"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              MEMBRE_ADMIN_RPC,
              ["refresponsable"],
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
            if (d["categorie"] && d["categorie"].length)
              d["categorie"] = d["categorie"].map(
                (d) =>
                  (d = result[0].find((item) => item._id == (d._id || d)) || d)
              );
            if (d["refresponsable"])
              d["refresponsable"] =
                result[1].find(
                  (item) =>
                    item._id == (d["refresponsable"]._id || d["refresponsable"])
                ) || d["refresponsable"];
          });
        } else {
          if (doc["categorie"] && doc["categorie"].length)
            doc["categorie"] = doc["categorie"].map(
              (d) =>
                (d = result[0].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["refresponsable"])
            doc["refresponsable"] =
              result[1].find(
                (item) =>
                  item._id ==
                  (doc["refresponsable"]._id || doc["refresponsable"])
              ) || doc["refresponsable"];
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
forumSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});
//rewrite insertMany
forumSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    //comment ADMIN_QUEUE

    next();
  } catch (error) {
    next(error);
  }
});

forumSchema.post("save", async function (doc, next) {
  try {
    if (this.acteurs?.length) {
      await ActeurForum.updateMany(
        { _id: { $in: this.acteurs } },
        { $addToSet: { froum: this._id } }
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
          body: { refObjet: doc._id, typeObjetConcerne: "FORUM_FORUM" },
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

forumSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await forum.findOne(this.getQuery()).lean();

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
      const acteursIds = this._update?.["$set"]?.acteurs;
      if (doc?.acteurs && doc?.acteurs != acteursIds) {
        let ids = doc?.acteurs
          .map((item) => item._id || item)
          .filter((item) => !acteursIds.includes(item));
        await ActeurForum.updateMany(
          { _id: { $in: ids } },
          { $pull: { froum: doc._id } }
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
forumSchema.post("findOneAndUpdate", async function (doc, next) {
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
        bodyPush: { refObjet: doc._id, typeObjetConcerne: "FORUM_FORUM" },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.acteurs?.length)
      await ActeurForum.updateMany(
        { _id: { $in: doc.acteurs.map((d) => d._id || d) } },
        { $addToSet: { froum: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
forumSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      console.log('----------------------------------------')

      if (this._update?.["$addToSet"].acteurs) {
        await ActeurForum.updateOne(
          { _id: this._update?.["$addToSet"]?.acteurs },
          { $addToSet: { froum: { $each: this.getQuery()._id["$in"] } } }
        );
      }
    } else {


      console.log('========================================')
      let doc = await forum.find(this.getQuery()).lean();
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
          if (d.imageRepresentative) files.push(d.imageRepresentative);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let themes = [];
        doc.map((d) => {
          themes.push(...d.themes.map((v) => v._id || v));
        });
        if (themes.length) {
          promises.push(
            Theme.updateMany(
              { _id: { $in: themes } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let themes = [];
        let acteurs = [];

        doc.map((d) => {
          themes.push(...d.themes.map((v) => v._id || v));
          acteurs.push(...d.acteurs.map((v) => v._id || v));
        });
        if (themes.length) {
          promises.push(
            Theme.updateMany(
              { _id: { $in: themes } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (acteurs.length) {
          promises.push(
            ActeurForum.updateMany(
              { _id: { $in: acteurs } },
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
forumSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await forum.find(this.getQuery()).lean();
    const promises = [];
    let themes = [];
    doc.map((d) => {
      themes.push(...d.themes.map((v) => v._id || v));
    });
    if (themes.length) {
      promises.push(Theme.deleteMany({ _id: { $in: themes } }).exec());
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
            await PublishMessage(FORUM_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            if (doc.imageRepresentative) files.push(doc.imageRepresentative);
            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(FORUM_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(FORUM_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            let files = [];
            if (doc.imageRepresentative) files.push(doc.imageRepresentative);
            copyFiles(files);
            if (doc?.themes?.length) {
              PublishTheme(doc.themes);
            }
            if (doc?.acteurs?.length) {
              PublishActeurForum(doc.acteurs);
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
          await PublishMessage(FORUM_CLIENT_QUEUE, {
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
    console.error("forum communicateWithClient error==>", error);
  }
}
//add other hooks here
const forum = mongoose.model("forum", forumSchema);
module.exports = forum;
const Theme = require("../models/theme.model");
const ActeurForum = require("../models/acteurForum.model");

const {
  PublishData: PublishTheme,
} = require("./repositories/theme.repositorie");
const {
  PublishData: PublishActeurForum,
} = require("./repositories/acteurForum.repositorie");

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
  TAXONOMIE_ADMIN_RPC,
  MEMBRE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_QUEUE,
  FORUM_CLIENT_QUEUE,
} = require("../config");
