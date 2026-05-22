const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let motclesSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    translations: {
      type: [
        {
          language: { type: String },
          motsCles: { type: String, required: true },
          descriptif: { type: String, required: true },
        },
      ],
    },
    image: { type: String },
    lien: { type: String },
    nbrClics: { type: Number, default: 0 },
    postArticle: { type: Schema.Types.ObjectId, ref: "postArticle" },
    section: { type: Schema.Types.ObjectId, ref: "section" },
    expressions: { type: [Schema.Types.Mixed] },
    objetsConcernes: {
      type: [
        {
          _id: false,
          typeObjet: { type: String },
          refObjet: {
            type: Schema.Types.ObjectId,
          },
        },
      ],
    },
    typeMotCle: {
      type: String,
      required: true,
      enum: [
        "code_1993",
        "code_17917",
        "code_2648"
      ],
    },
    position: {
      type: String,
      required: true,
      enum: [
        "code_17919",
        "code_17920",
        "code_17921"
      ],
    }


  },
  { timestamps: true }
);

//  autoPopulate hook

motclesSchema.pre("aggregate", function (next) {
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
motclesSchema.pre(/find.*/, function (next) {
  try {
    this.populate([]);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
//refactor bloc for distantRequest
/*new*/ /*new20*/ //refactor bloc for distantRequest
async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? []
          : [
            sendRPCRequest(
              doc,
              EXPRESSION_ADMIN_RPC,
              ["expressions"],
              "VIEW_ITEMS",
              {
                queryOptions: {
                  select: "-motscle -objetsAssocies -objetsConcernes",
                },
              }
            ),
          ]
      ).then((result) => {
        if (doc instanceof Array) {
        } else {
          if (doc["expressions"] && doc["expressions"].length)
            doc["expressions"] = doc["expressions"].map(
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
motclesSchema.post("save", async function (doc, next) {
  try {
    if (this.postArticle) {
      await PostArticle.updateOne(
        { _id: this.postArticle.toString() },
        { $addToSet: { motscles: this._id } }
      );
    }
    if (this.section) {
      await Section.updateOne(
        { _id: this.section.toString() },
        { $addToSet: { motsCles: this._id } }
      );
    }

    //comment ADMIN_QUEUE

    //#region new save bloc
    if (doc.expressions.length)
      publishUpdate("update_items", doc.expressions, EXPRESSION_ADMIN_QUEUE, {
        operation: "$set",
        body: { motscle: doc._id },
      });

    if (doc.objetsConcernes.length) {
      let typeObjet = GroupBy(doc.objetsConcernes, "typeObjet");
      for (let item of Object.keys(typeObjet)) {
        if (item) {
          let body;
          let key;
          if (item.toLowerCase() == "actioncitoyenne_actioncitoyenne") {
            key = ACTIONCITOYENNE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { motCles: doc._id } };
          } else if (item.toLowerCase() == "operationtroc_operationtroc") {
            key = OPERATIONTROC_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { motsCles: doc._id } };
          } else if (item.toLowerCase() == "annonce_annonceprofessionnelle") {
            key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { motCle: doc._id } };
          } else if (item.toLowerCase() == "annonce_annonce") {
            key = ANNONCE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { motsCles: doc._id } };
          } else if (
            item.toLowerCase() == "documentdossier_documentdossierappel"
          ) {
            key = DOCUMENTDOSSIER_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { motCLe: doc._id } };
          } else if (item.toLowerCase() == "modelebilan_modelbilan") {
            key = MODELEBILAN_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { motsCles: doc._id } };
          } else if (item.toLowerCase() == "postlegal_legalpost") {
            key = POSTLEGAL_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { motsCles: doc._id } };
          }
          if (body)
            publishUpdate(
              "update_items",
              typeObjet[item].map((i) => i.refObjet),
              key,
              body
            );
        }
      }
    } //#enregion new save bloc
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
motclesSchema.post("insertMany", async function (doc, next) {
  try {
    let postArticle = GroupBy(doc, "postArticle");
    for (let item of Object.keys(postArticle)) {
      if (item)
        await PostArticle.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              motscles: { $each: postArticle[item].map((d) => d._id) },
            },
          }
        );
    }

    let section = GroupBy(doc, "section");
    for (let item of Object.keys(section)) {
      if (item)
        await Section.updateOne(
          { _id: item.toString() },
          {
            $addToSet: { motsCles: { $each: section[item].map((d) => d._id) } },
          }
        );
    }

    //comment ADMIN_QUEUE

    //#region new insert many bloc

    let typeObjet = /*updateGroupByinsertMany with dot*/ GroupBy(
      doc,
      "objetsConcernes.typeObjet"
    );
    for (let item of Object.keys(typeObjet)) {
      if (item) {
        let references = GroupBy(typeObjet[item], "refObjet");
        for (let itemRef of Object.keys(references)) {
          if (itemRef) {
            let body;
            let key;
            if (item.toLowerCase() == "actioncitoyenne_actioncitoyenne") {
              key = ACTIONCITOYENNE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  motCles: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "operationtroc_operationtroc") {
              key = OPERATIONTROC_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  motsCles: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "annonce_annonceprofessionnelle") {
              key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  motCle: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "annonce_annonce") {
              key = ANNONCE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  motsCles: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (
              item.toLowerCase() == "documentdossier_documentdossierappel"
            ) {
              key = DOCUMENTDOSSIER_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  motCLe: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "modelebilan_modelbilan") {
              key = MODELEBILAN_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  motsCles: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            }

            //#region new insertMany bloc
            else if (item.toLowerCase() == "postlegal_legalpost") {
              console.log({ references: references[itemRef] });
              key = POSTLEGAL_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { motsCles: { $each: references[itemRef].map((d) => d._id) } },
              };
            }
            //#endregion new insertMany bloc
            if (body) publishUpdate("update_items", itemRef, key, body);
          }
        }
      }
    }
    //#enregion new insert many bloc

    next();
  } catch (error) {
    next(error);
  }
});
let prevState = null;
let itemToCheck = {};

motclesSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await motcles.findOne(this.getQuery()).lean();
    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["expressions"] = doc.expressions;
      itemToCheck["objetsConcernes"] = doc.objetsConcernes;
      //#endregion new pre find and update bloc
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const postArticleId = this._update?.["$set"]?.postArticle;
      if (doc?.postArticle != postArticleId && doc?.postArticle != undefined)
        await PostArticle.updateOne(
          { _id: doc.postArticle.toString() },
          { $pull: { motscles: doc._id } }
        );
      const sectionId = this._update?.["$set"]?.section;
      if (doc?.section != sectionId && doc?.section != undefined)
        await Section.updateOne(
          { _id: doc.section.toString() },
          { $pull: { motsCles: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
motclesSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    //#region new post find and update bloc
    let itemToPull,
      itemToPush = [];
    if (itemToCheck["objetsConcernes"].length || doc.objetsConcernes.length) {
      itemToPull = getDiffArray(
        itemToCheck["objetsConcernes"],
        doc.objetsConcernes,
        "refObjet"
      );
      itemToPush = getDiffArray(
        doc.objetsConcernes,
        itemToCheck["objetsConcernes"],
        "refObjet"
      );
      if (itemToPull.length) {
        itemToPull = GroupBy(itemToPull, "typeObjet");
        for (let item of Object.keys(itemToPull)) {
          if (item) {
            let body;
            let key;
            if (item.toLowerCase() == "actioncitoyenne_actioncitoyenne") {
              key = ACTIONCITOYENNE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { motCles: doc._id } };
            } else if (item.toLowerCase() == "operationtroc_operationtroc") {
              key = OPERATIONTROC_ADMIN_QUEUE;
              body = { operation: "$pull", body: { motsCles: doc._id } };
            } else if (item.toLowerCase() == "annonce_annonceprofessionnelle") {
              key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { motCle: doc._id } };
            } else if (item.toLowerCase() == "annonce_annonce") {
              key = ANNONCE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { motsCles: doc._id } };
            } else if (
              item.toLowerCase() == "documentdossier_documentdossierappel"
            ) {
              key = DOCUMENTDOSSIER_ADMIN_QUEUE;
              body = { operation: "$pull", body: { motCLe: doc._id } };
            } else if (item.toLowerCase() == "modelebilan_modelbilan") {
              key = MODELEBILAN_ADMIN_QUEUE;
              body = { operation: "$pull", body: { motsCles: doc._id } };
            } else if (item.toLowerCase() == "postlegal_legalpost") {
              key = POSTLEGAL_ADMIN_QUEUE;
              body = { operation: "$pull", body: { motsCles: doc._id } };
            }
            if (body)
              publishUpdate(
                "update_items",
                itemToPull[item].map((i) => i.refObjet),
                key,
                body
              );
          }
        }
      }
      if (itemToPush.length) {
        itemToPush = GroupBy(itemToPush, "typeObjet");
        for (let item of Object.keys(itemToPush)) {
          if (item) {
            let body;
            let key;
            if (item.toLowerCase() == "actioncitoyenne_actioncitoyenne") {
              key = ACTIONCITOYENNE_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { motCles: doc._id } };
            } else if (item.toLowerCase() == "operationtroc_operationtroc") {
              key = OPERATIONTROC_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { motsCles: doc._id } };
            } else if (item.toLowerCase() == "annonce_annonceprofessionnelle") {
              key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { motCle: doc._id } };
            } else if (item.toLowerCase() == "annonce_annonce") {
              key = ANNONCE_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { motsCles: doc._id } };
            } else if (
              item.toLowerCase() == "documentdossier_documentdossierappel"
            ) {
              key = DOCUMENTDOSSIER_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { motCLe: doc._id } };
            } else if (item.toLowerCase() == "modelebilan_modelbilan") {
              key = MODELEBILAN_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { motsCles: doc._id } };
            } else if (item.toLowerCase() == "postlegal_legalpost") {
              key = POSTLEGAL_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { motsCles: doc._id } };
            }
            if (body)
              publishUpdate(
                "update_items",
                itemToPush[item].map((i) => i.refObjet),
                key,
                body
              );
          }
        }
      }
    }

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["expressions"], newData: doc.expressions },
      EXPRESSION_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { motscle: doc._id },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.postArticle)
      await PostArticle.updateOne(
        { _id: doc.postArticle?._id?.toString() || doc.postArticle },
        { $addToSet: { motscles: doc._id } }
      );
    if (doc.section)
      await Section.updateOne(
        { _id: doc.section?._id?.toString() || doc.section },
        { $addToSet: { motsCles: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
motclesSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      //#region new addToSet bloc

      if (this._update?.["$addToSet"]?.objetsConcernes && docs.modifiedCount) {
        let body;
        let key;
        if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "actioncitoyenne_actioncitoyenne"
        ) {
          key = ACTIONCITOYENNE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { motCles: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "operationtroc_operationtroc"
        ) {
          key = OPERATIONTROC_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { motsCles: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "annonce_annonceprofessionnelle"
        ) {
          key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { motCle: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "annonce_annonce"
        ) {
          key = ANNONCE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { motsCles: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "documentdossier_documentdossierappel"
        ) {
          key = DOCUMENTDOSSIER_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { motCLe: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "modelebilan_modelbilan"
        ) {
          key = MODELEBILAN_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { motsCles: { $each: this.getQuery()?._id?.["$in"] } },
          };
        }

        //#region new addToSet bloc
        else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "postlegal_legalpost"
        ) {
          key = POSTLEGAL_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { motsCles: { $each: this.getQuery()?._id?.["$in"] } },
          };
        }
        //#endregion new addToSet bloc
        if (body)
          publishUpdate(
            "update_items",
            this._update?.["$addToSet"].objetsConcernes.refObjet,
            key,
            body
          );
      }
      //#endregion new addToSet bloc
    } else {
      let doc = await motcles.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.expressions)))],
          EXPRESSION_ADMIN_QUEUE,
          { operation: "$set", body: { motscle: null } }
        );

        let typeObjet = /*updateGroupByupdateMany with dot*/ GroupBy(
          doc,
          "objetsConcernes.typeObjet"
        );
        for (let item of Object.keys(typeObjet)) {
          if (item) {
            let references = GroupBy(typeObjet[item], "refObjet");
            for (let itemRef of Object.keys(references)) {
              if (itemRef) {
                let body;
                let key;
                if (item.toLowerCase() == "actioncitoyenne_actioncitoyenne") {
                  key = ACTIONCITOYENNE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      motCles: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "operationtroc_operationtroc"
                ) {
                  key = OPERATIONTROC_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      motsCles: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "annonce_annonceprofessionnelle"
                ) {
                  key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      motCle: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "annonce_annonce") {
                  key = ANNONCE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      motsCles: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "documentdossier_documentdossierappel"
                ) {
                  key = DOCUMENTDOSSIER_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      motCLe: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "modelebilan_modelbilan") {
                  key = MODELEBILAN_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      motsCles: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                }

                //#region new archive bloc
                else if (item.toLowerCase() == "postlegal_legalpost") {
                  key = POSTLEGAL_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: { motsCles: { $in: references[itemRef].map((d) => d._id) } },
                  };
                }
                //#endregion new archive bloc
                if (body) publishUpdate("update_items", itemRef, key, body);
              }
            }
          }
        }

        //#endregion new archive bloc

        //comment ADMIN_QUEUE
        let files = [];

        doc.map((d) => {
          if (d.image) files.push(d.image);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        doc.map((d) => { });
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        doc.map((d) => { });
      }

      if (this._update?.["$pull"]?.objetsConcernes) {
        let body;
        let key;
        if (this._update?.["$pull"].objetsConcernes.typeObjet) {
          switch (
          this._update?.["$pull"].objetsConcernes.typeObjet.toLowerCase()
          ) {
            case "annonce_annonceprofessionnelle":
              key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
              body = {
                motCle: this.getQuery()._id,
              };
              break;
            case "documentdossier_documentdossierappel":
              key = DOCUMENTDOSSIER_ADMIN_QUEUE;
              body = {
                motCLe: this.getQuery()._id,
              };
              break;
            case "postlegal_legalpost":
              key = POSTLEGAL_ADMIN_QUEUE;
              body = {
                motsCles: this.getQuery()._id,
              };
              break;
            case "annonce_annonce":
              key = ANNONCE_ADMIN_QUEUE;
              body = {
                motsCles: this.getQuery()._id,
              };
              break;
            case "operationtroc_operationtroc":
              key = OPERATIONTROC_ADMIN_QUEUE;
              body = { motsCles: this.getQuery()._id };
              break;
          }
        }
        if (body)
          publishUpdate(
            "update_items",
            this._update?.["$pull"].objetsConcernes.refObjet,
            key,
            {
              operation: "$pull",
              body,
            }
          );
      }

      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
motclesSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await motcles.find(this.getQuery()).lean();
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
            await PublishMessage(MOTCLES_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            // doc.map((d)=>{
            if (doc.image) files.push(doc.image);
            //})

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(MOTCLES_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(MOTCLES_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            let files = [];
            //doc.map((d)=>{
            if (doc.image) files.push(doc.image);
            //})
            copyFiles(files);
            //#region new publish bloc
            if (doc.expressions.length)
              publishUpdate(
                "publish_data",
                doc.expressions,
                EXPRESSION_ADMIN_QUEUE
              );
            //#endregion new publish bloc
          }
          return;
        case "postUpdateMany":
          await PublishMessage(MOTCLES_CLIENT_QUEUE, {
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
    console.error("motcles communicateWithClient error==>", error);
  }
}
//add other hooks here
const motcles = mongoose.model("motcles", motclesSchema);
module.exports = motcles;
const PostArticle = require("../models/postArticle.model");
const Section = require("../models/section.model");

//

const { PublishMessage } = require("../helpers/communications");

const {
  getDataByPath,
  publishUpdate,
  getDiffArray,
  sendRPCRequest,
  copyFiles,
  removeFiles,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");
const {
  POSTLEGAL_ADMIN_QUEUE,
  EXPRESSION_ADMIN_RPC,
  EXPRESSION_ADMIN_QUEUE,
  ACTIONCITOYENNE_ADMIN_QUEUE,
  OPERATIONTROC_ADMIN_QUEUE,
  ANNONCE_ADMIN_QUEUE,
  DOCUMENTDOSSIER_ADMIN_QUEUE,
  MODELEBILAN_ADMIN_QUEUE,
  MOTCLES_CLIENT_QUEUE,
  ANNONCEPROFESSIONNELLE_ADMIN_QUEUE,
} = require("../config");
