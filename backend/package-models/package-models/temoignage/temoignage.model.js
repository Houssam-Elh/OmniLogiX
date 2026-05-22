const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let temoignageSchema = new Schema(
  {
    classTemoignage: { type: Schema.Types.Mixed, required: true },
    translations: {
      type: [
        {
          language: { type: String },
          nom: { type: String, required: true },
          prenom: { type: String, required: true },

          temoignage: { type: String, required: true },
          entreprise: { type: String },
        },
      ],
    },
    fonction: { type: Schema.Types.Mixed, required: true },
    date: { type: Date, required: true },
    email: { type: String },
    photo: { type: String },
    logo: { type: String },
    lienAssocie: { type: String },
    typeObjetConcerne: { type: String },
    objetConcerne: {
      type: Schema.Types.ObjectId,
    },
    objetsAssocies: { type: [ObjectId] },
    etatObjet: { type: String, default: "code-1", enum: ["code-1", "code-2"] },
    etatDePublication: {
      type: String,
      enum: ["code_541", "code_4548", "code_3453", "code_328"],
      required: true,
    },

    //#region new attribut declaration
    objetAssocie: [{ type: Schema.Types.ObjectId }],
    //#endregion
  },
  { timestamps: true }
);

//  autoPopulate hook

temoignageSchema.pre("aggregate", function (next) {
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
temoignageSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      { path: "classTemoignage", match: { etatObjet: "code-1" }, populate: [] },
      { path: "fonction", match: { etatObjet: "code-1" }, populate: [] },
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
                ["classTemoignage", "fonction"],
                "VIEW_ITEMS",
                {}
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["classTemoignage", "fonction"],
                "VIEW_ITEMS",
                {}
              ),
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
          doc.map((d) => {
            if (d["classTemoignage"])
              d["classTemoignage"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["classTemoignage"]._id || d["classTemoignage"])
                ) || d["classTemoignage"];
            if (d["fonction"])
              d["fonction"] =
                result[0].find(
                  (item) => item._id == (d["fonction"]._id || d["fonction"])
                ) || d["fonction"];
          });
        } else {
          if (doc["classTemoignage"])
            doc["classTemoignage"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["classTemoignage"]._id || doc["classTemoignage"])
              ) || doc["classTemoignage"];
          if (doc["fonction"])
            doc["fonction"] =
              result[0].find(
                (item) => item._id == (doc["fonction"]._id || doc["fonction"])
              ) || doc["fonction"];
          if (doc["objetAssocie"] && doc["objetAssocie"].length)
            doc["objetAssocie"] = doc["objetAssocie"].map(
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
temoignageSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

//rewrite insertMany
temoignageSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);
    //bloc refactor insertMany
    let objetConcerne = GroupBy(doc, "objetConcerne");
    for (let item of Object.keys(objetConcerne)) {
      if (item)
        console.log(
          "objetConcerne[item].map((d) => d.objetConcerne",
          objetConcerne[item].map((d) => d.objetConcerne)
        );
      publishUpdate(
        "update_items",
        [...new Set(flatDeep(objetConcerne[item].map((d) => d.objetConcerne)))],
        `${doc[0]["typeObjetConcerne"].toUpperCase()}_PLACE2INVEST_ADMIN_KEY`,
        {
          operation: "$addToSet",
          body: {
            temoignage: { $each: objetConcerne[item].map((i) => i._id) },
          },
        }
      );
    }

    //comment ADMIN_QUEUE

    //comment ADMIN_QUEUE

    //comment ADMIN_QUEUE

    //#region new insert many bloc

    let typeObjetConcene = /*updateGroupBy*/ GroupBy(doc, "typeObjetConcerne");
    for (let item of Object.keys(typeObjetConcene)) {
      if (item) {
        let references = GroupBy(typeObjetConcene[item], "objetConcerne");
        for (let itemRef of Object.keys(references)) {
          if (itemRef) {
            let body;
            let key;
            if (item.toLowerCase() == "preuve_reclamation") {
              key = PREUVE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  temoignages: {
                    $each: typeObjetConcene[item].map((d) => d._id),
                  },
                },
              };
            } else if (item.toLowerCase() == "ongosc_ongonc") {
              key = ONGOSC_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  temoignages: {
                    $each: typeObjetConcene[item].map((d) => d._id),
                  },
                },
              };
            }else if (item.toLowerCase() == "objectto_objectto") {
              key = OBJECTTO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  temoignage: {
                    $each: typeObjetConcene[item].map((d) => d._id),
                  },
                },
              };
            }
            if (body)
              publishUpdate(
                "update_items",
                typeObjetConcene[item].map((i) => i.objetConcerne),
                key,
                body
              );
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
let objetConcerne = [];
temoignageSchema.post("save", async function (doc, next) {
  try {
    // if (doc["refObjet"]) {
    //   //comment ADMIN_QUEUE
    // }

    //#region new save bloc
    if (
      doc.typeObjetConcerne == "ACTEURSPRO_ACTEURPROFESSIONEL" &&
      doc.objetConcerne
    ) {
      publishUpdate("update_items", doc.objetConcerne, ACTEURSPRO_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { temoignage: doc._id },
      });
    }
    if (doc.objetConcerne)
      publishUpdate(
        "update_items",
        [doc.objetConcerne],
        PARRAINEPAR_ADMIN_QUEUE,
        { operation: "$set", body: { refTemoignage: doc._id } }
      );
    if (doc.objetAssocie.length)
      publishUpdate(
        "update_items",
        doc.objetAssocie,
        OBJETASSOCIEE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjet: doc._id,
            typeObjetConcerne: "TEMOIGNAGE_TEMOIGNAGES",
          },
        }
      );
    if (doc.typeObjetConcerne == "PREUVE_RECLAMATION" && doc.objetConcerne)
      publishUpdate("update_items", doc.objetConcerne, PREUVE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { temoignages: doc._id },
      });
    if (doc.typeObjetConcerne == "ONGOSC_ONGONC" && doc.objetConcerne)
      publishUpdate("update_items", doc.objetConcerne, ONGOSC_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { temoignages: doc._id },
      });
    if (doc.typeObjetConcerne == "OBJECTTO_OBJECTTO" && doc.objetConcerne) {
      publishUpdate("update_items", doc.objetConcerne, OBJECTTO_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { temoignage: doc._id },
      });
    }

    //#enregion new save bloc
    next();
  } catch (error) {
    next(error);
  }
});

let prevState = null;
let itemToCheck = {};

temoignageSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await temoignage.findOne(this.getQuery()).lean();

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["objetConcerne"] = doc.objetConcerne;
      itemToCheck["objetAssocie"] = doc.objetAssocie;
      //#endregion new pre find and update bloc
      prevState = doc?.etatDePublication;
      objetConcerne = doc.objetConcerne;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
temoignageSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    //#region new post find and update bloc
    let itemToPull,
      itemToPush = [];

    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["objetConcerne"], newData: doc.objetConcerne },
      ACTEURSPRO_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { temoignage: doc._id },
        bodyPush: { temoignage: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: [itemToCheck["objetConcerne"]], newData: [doc.objetConcerne] },
      PARRAINEPAR_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { refTemoignage: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["objetAssocie"], newData: doc.objetAssocie },
      OBJETASSOCIEE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjet: null, typeObjetConcerne: null },
        bodyPush: {
          refObjet: doc._id,
          typeObjetConcerne: "TEMOIGNAGE_TEMOIGNAGES",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["objetConcerne"], newData: doc.objetConcerne },
      PREUVE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { temoignages: doc._id },
        bodyPush: { temoignages: doc._id },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["objetConcerne"], newData: doc.objetConcerne },
      ONGOSC_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { temoignages: doc._id },
        bodyPush: { temoignages: doc._id },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);
    next();
  } catch (error) {
    next(error);
  }
});
temoignageSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await temoignage.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc
        publishUpdate(
          "update_items",
          doc.map((d) => d.objetConcerne),
          PARRAINEPAR_ADMIN_QUEUE,
          { operation: "$set", body: { refTemoignage: null } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.objetAssocie)))],
          OBJETASSOCIEE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );

        let typeObjetConcerne = /*updateGroupByUpdateMany*/ GroupBy(
          doc,
          "typeObjetConcerne"
        );
        for (let item of Object.keys(typeObjetConcerne)) {
          if (item) {
            let references = GroupBy(typeObjetConcerne[item], "objetConcerne");
            for (let itemRef of Object.keys(references)) {
              if (itemRef) {
                let body;
                let key;
                if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
                  key = ACTEURSPRO_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      temoignage: {
                        $in: typeObjetConcerne[item].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "preuve_reclamation") {
                  key = PREUVE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      temoignages: {
                        $in: typeObjetConcerne[item].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "ongosc_ongonc") {
                  key = ONGOSC_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      temoignages: {
                        $in: typeObjetConcerne[item].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "objectto_objectto") {
                  key = OBJECTTO_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      temoignage: {
                        $in: typeObjetConcerne[item].map((d) => d._id),
                      },
                    },
                  };
                }

                if (body)
                  publishUpdate(
                    "update_items",
                    typeObjetConcerne[item].map((i) => i.objetConcerne),
                    key,
                    body
                  );
              }
            }
          }
        }
        //#endregion new archive bloc

        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        let files = [];

        doc.map((d) => {
          if (d.photo) files.push(d.photo);
          if (d.logo) files.push(d.logo);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        doc.map((d) => {});
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        doc.map((d) => {});
      }

      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
temoignageSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await temoignage.find(this.getQuery()).lean();
    const promises = [];

    doc.map((d) => {});

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
            targetState != "code_3453" &&
            prevState == "code_3453"
          ) {
            await PublishMessage(TEMOIGNAGE_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            // doc.map((d)=>{
            if (doc.photo) files.push(doc.photo);
            if (doc.logo) files.push(doc.logo);
            //})

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3453"
          ) {
            await PublishMessage(TEMOIGNAGE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3453") {
            await PublishMessage(TEMOIGNAGE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3453") {
            let files = [];
            //doc.map((d)=>{
            if (doc.photo) files.push(doc.photo);
            if (doc.logo) files.push(doc.logo);
            //})
            copyFiles(files);
            //#region new publish bloc
            if (doc.objetConcerne)
              publishUpdate(
                "publish_data",
                [doc.objetConcerne],
                PARRAINEPAR_ADMIN_QUEUE
              );
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
          await PublishMessage(TEMOIGNAGE_CLIENT_QUEUE, {
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
    console.error("temoignage communicateWithClient error==>", error);
  }
}
//add other hooks here
const temoignage = mongoose.model("temoignage", temoignageSchema);
module.exports = temoignage;

const { PublishMessage } = require("../helpers/communications");

const {
  publishUpdate,
  getDataByPath,
  sendRPCRequest,
  getDiffArray,
  copyFiles,
  removeFiles,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  ACTEURSPRO_ADMIN_QUEUE,
  PARRAINEPAR_ADMIN_QUEUE,
  OBJETASSOCIEE_ADMIN_QUEUE,
  PREUVE_ADMIN_QUEUE,
  ONGOSC_ADMIN_QUEUE,
  TEMOIGNAGE_CLIENT_QUEUE,
  OBJECTTO_ADMIN_QUEUE,
} = require("../config");
