const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let partcipationSchema = new Schema(
  {
    translations: {
      type: [
        {
          language: { type: String },
          titre: { type: String },
          message: { type: String, required: true },
        },
      ],
    },
    dateHeureParticipation: { type: Date, required: true },
    ordre: { type: Number },
    etatValidation: {
      type: String,
      required: true,
      enum: ["code_4268", "code_1407", "code_223"],
    },
    parent: { type: Schema.Types.ObjectId, ref: "partcipation" },
    children: [{ type: Schema.Types.ObjectId, ref: "partcipation" }],
    theme: { type: Schema.Types.ObjectId, ref: "theme" },
    acteur: { type: Schema.Types.ObjectId, ref: "acteurForum" },
    etatObjet: { type: String, default: "code-1" },
    objetAssocie: [{ type: Schema.Types.ObjectId }],
    elementsAdditionnels: [
      { type: Schema.Types.ObjectId, ref: "elementAdditionnel" },
    ],
  },
  { timestamps: true }
);

//  autoPopulate hook

partcipationSchema.pre("aggregate", function (next) {
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
partcipationSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      { path: "children", match: { etatObjet: "code-1" }, populate: [] },
      // { path: "theme", match: { etatObjet: "code-1" }, populate: [] },
      { path: "acteur", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "elementsAdditionnels",
        match: { etatObjet: "code-1" },
        populate: [],
      },
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
          ? []
          : [
            sendRPCRequest(
              doc,
              OBJETASSOCIEE_ADMIN_RPC,
              ["objetAssocie"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObjet" } }
            ),
          ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => { });
        } else {
          if (doc["objetAssocie"] && doc["objetAssocie"].length)
            doc["objetAssocie"] = doc["objetAssocie"].map(
              (d) =>
                (d = result[0].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
partcipationSchema.post("save", async function (doc, next) {
  try {
    if (this.theme && !this.parent) {
      let themeParent = await Theme.findOne({
        etatObjet: "code-1",
        _id: this.theme.toString(),
      });
      let acteurs = readActeurs(themeParent.participations);



      let themeData = await Theme.findOne({_id:this.theme.toString()})
      .select("forum -refResponsableTheme -participations")
      .lean();
      
      console.log("🚀 ~ themeData:", themeData)
      if (themeData.forum) {
        await Forum.updateOne(
          {
            _id: themeData.forum?._id?.toString() || themeData.forum.toString(),
          },
          {
            $addToSet: {
              acteurs: doc.acteur?._id?.toString() || doc.acteur?.toString(),
            },
          }
        );
      }

      if (themeParent && this.acteur) {
        if (!acteurs.includes(this.acteur.toString())) {
          await Theme.updateOne(
            { _id: this.theme.toString() },
            {
              $inc: {
                nbrParticipants: 1,
                nbrEchanges: 1,
              },
              $addToSet: { participations: this._id },
            }
          );
        } else {
          await Theme.updateOne(
            { _id: this.theme.toString() },
            {
              $inc: {
                nbrEchanges: 1,
              },
              $addToSet: { participations: this._id },
            }
          );
        }

        await Forum.updateOne(
          { _id: themeParent.forum.toString() },
          { $inc: { nombreDesEchanges: 1 } }
        );
      }
    } else if (this.parent) {
      let themeId = await readTheme(this.parent);
      let themeParent = await Theme.findOne({
        etatObjet: "code-1",
        _id: themeId.toString(),
      });
      let acteurs = readActeurs(themeParent.participations);

      if (themeParent && this.acteur) {
        if (!acteurs.includes(this.acteur.toString())) {
          await Theme.updateOne(
            { _id: themeId.toString() },
            {
              $inc: {
                nbrParticipants: 1,
                nbrEchanges: 1,
              },
            }
          );
        } else {
          await Theme.updateOne(
            { _id: themeId.toString() },
            {
              $inc: {
                nbrEchanges: 1,
              },
            }
          );
        }
        console.log("🚀 ~ this.theme:", this)
        let themeData = await Theme.findOne({ _id: this.theme.toString() })
          .select("forum -refResponsableTheme -participations")
          .lean();

        console.log("🚀 ~ themeData:", themeData);
        if (themeData.forum) {
          await Forum.updateOne(
            {
              _id:
                themeData.forum?._id?.toString() || themeData.forum.toString(),
            },
            {
              $addToSet: {
                acteurs: doc.acteur?._id?.toString() || doc.acteur?.toString(),
              },
            }
          );
        }
        await Forum.updateOne(
          { _id: themeParent.forum.toString() },
          { $inc: { nombreDesEchanges: 1 } }
        );
      }
    }

    if (this.acteur) {
      await ActeurForum.updateOne(
        { _id: this.acteur.toString() },
        { $addToSet: { participation: this._id } }
      );
    }
    if (this.parent) {
      await partcipation.updateOne(
        { _id: this.parent.toString() },
        { $addToSet: { children: this._id } }
      );
    } else if (this.children?.length) {
      await partcipation.updateMany(
        { _id: { $in: this.children.map((d) => d._id || d) } },
        { $set: { parent: this._id } }
      );
    }

    //comment ADMIN_QUEUE

    //#region new save bloc
    if (doc.objetAssocie.length)
      publishUpdate(
        "update_items",
        doc.objetAssocie,
        OBJETASSOCIEE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: { refObjet: doc._id, typeObjetConcerne: "PARTCIPATION_FORUM" },
        }
      );

    //#enregion new save bloc
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
partcipationSchema.post("insertMany", async function (doc, next) {
  try {
    let theme = GroupBy(doc, "theme");
    for (let item of Object.keys(theme)) {
      if (item)
        await Theme.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              participations: { $each: theme[item].map((d) => d._id) },
            },
          }
        );
    }

    let acteur = GroupBy(doc, "acteur");
    for (let item of Object.keys(acteur)) {
      if (item)
        await ActeurForum.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              participation: { $each: acteur[item].map((d) => d._id) },
            },
          }
        );
    }

    let parent = GroupBy(doc, "parent");
    for (let item of Object.keys(parent)) {
      if (item)
        await partcipation.updateOne(
          { _id: item.toString() },
          { $addToSet: { children: { $each: parent[item].map((d) => d._id) } } }
        );
    }

    //comment ADMIN_QUEUE

    next();
  } catch (error) {
    next(error);
  }
});
let prevState = null;
let itemToCheck = {};
function readActeurs(data) {
  let acteurs = new Set();
  data.map(m=> {
    acteurs.add(m.acteur._id.toString() || m.acteur.toString());
    if (m.children.length) {
      readActeurs(m.children);
    }
  });
  acteurs = [...acteurs];
  return acteurs;
}


async function readTheme(data) {
  let participationParent = await partcipation.findOne({etatObjet: 'code-1', _id: data.toString()});
  if (participationParent.theme) {
    return participationParent.theme;
  } else if (participationParent.parent) {
    return readTheme(participationParent.parent);
  }
  return null;
}
partcipationSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await partcipation.findOne(this.getQuery()).lean();

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["objetAssocie"] = doc.objetAssocie;
      //#endregion new pre find and update bloc
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const themeId = this._update?.["$set"]?.theme;
      if (themeId && doc?.theme != themeId && doc?.theme != undefined)
        await Theme.updateOne(
          { _id: doc.theme.toString() },
          { $pull: { participations: doc._id } }
        );
      const acteurId = this._update?.["$set"]?.acteur;
      if (acteurId && doc?.acteur != acteurId && doc?.acteur != undefined)
        await ActeurForum.updateOne(
          { _id: doc.acteur.toString() },
          { $pull: { participation: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
partcipationSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    //#region new post find and update bloc
    let itemToPull,
      itemToPush = [];

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["objetAssocie"], newData: doc.objetAssocie },
      OBJETASSOCIEE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjet: null, typeObjetConcerne: null },
        bodyPush: {
          refObjet: doc._id,
          typeObjetConcerne: "PARTCIPATION_FORUM",
        },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.theme)
      await Theme.updateOne(
        { _id: doc.theme?._id?.toString() || doc.theme },
        { $addToSet: { participations: doc._id } }
      );
    if (doc.acteur)
      await ActeurForum.updateOne(
        { _id: doc.acteur?._id?.toString() || doc.acteur },
        { $addToSet: { participation: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
partcipationSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await partcipation.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.objetAssocie)))],
          OBJETASSOCIEE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );

        //#endregion new archive bloc

        //comment ADMIN_QUEUE
        communicateWithClient("postUpdateMany", this.getQuery());

        let children = [];
        let elementsAdditionnels = [];
        doc.map((d) => {
          children.push(...d.children.map((v) => v._id || v));
          elementsAdditionnels.push(
            ...d.elementsAdditionnels.map((v) => v._id || v)
          );
        });

        doc.map((d) => {
          children.push(...d.children.map((v) => v._id || v));
        });
        if (children.length) {
          promises.push(
            partcipation
              .updateMany(
                { _id: { $in: children } },
                { $set: { etatObjet: "code-2" } }
              )
              .exec()
          );
        }

        if (elementsAdditionnels.length) {
          promises.push(
            ElementAdditionnel.updateMany(
              { _id: { $in: elementsAdditionnels } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let children = [];
        let elementsAdditionnels = [];

        doc.map((d) => {
          children.push(...d.children.map((v) => v._id || v));
          elementsAdditionnels.push(
            ...d.elementsAdditionnels.map((v) => v._id || v)
          );
        });

        doc.map((d) => {
          children.push(...d.children.map((v) => v._id || v));
        });
        if (children.length) {
          promises.push(
            partcipation
              .updateMany(
                { _id: { $in: children } },
                { $set: { etatObjet: "code-1" } }
              )
              .exec()
          );
        }

        if (elementsAdditionnels.length) {
          promises.push(
            ElementAdditionnel.updateMany(
              { _id: { $in: elementsAdditionnels } },
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
partcipationSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await partcipation.find(this.getQuery()).lean();
    const promises = [];
    let children = [];
    let elementsAdditionnels = [];
    doc.map((d) => {
      children.push(...d.children.map((v) => v._id || v));
      elementsAdditionnels.push(
        ...d.elementsAdditionnels.map((v) => v._id || v)
      );
    });

    doc.map((d) => {
      children.push(...d.children.map((v) => v._id || v));
    });
    if (children.length) {
      promises.push(partcipation.deleteMany({ _id: { $in: children } }).exec());
    }

    if (elementsAdditionnels.length) {
      promises.push(
        ElementAdditionnel.deleteMany({
          _id: { $in: elementsAdditionnels },
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
            await PublishMessage(PARTCIPATION_CLIENT_QUEUE, {
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
            await PublishMessage(PARTCIPATION_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(PARTCIPATION_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            if (doc?.parent?.length) {
              PublishPartcipation(doc.parent);
            }

            if (doc?.elementsAdditionnels?.length) {
              PublishElementAdditionnel(doc.elementsAdditionnels);
            }
            //#region new publish bloc
            if (doc.objetAssocie.length)
              publishUpdate(
                "publish_data",
                doc.objetAssocie,
                OBJETASSOCIEE_ADMIN_QUEUE
              );
            //#endregion new publish bloc
          }
          return;
        case "postUpdateMany":
          await PublishMessage(PARTCIPATION_CLIENT_QUEUE, {
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
    console.error("partcipation communicateWithClient error==>", error);
  }
}
//add other hooks here
const partcipation = mongoose.model("partcipation", partcipationSchema);
module.exports = partcipation;
const Theme = require("../models/theme.model");
const ActeurForum = require("../models/acteurForum.model");
const ElementAdditionnel = require("../models/elementAdditionnel.model");

const Forum = require("../models/forum.model");

const {
  PublishData: PublishElementAdditionnel,
} = require("./repositories/elementAdditionnel.repositorie");

const { PublishMessage } = require("../helpers/communications");
const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  getDiffArray,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");

const {
  OBJETASSOCIEE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_QUEUE,
  PARTCIPATION_CLIENT_QUEUE,
} = require("../config");
