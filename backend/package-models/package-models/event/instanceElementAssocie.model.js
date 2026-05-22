const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let instanceElementAssocieSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    phaseEvenement: {
      type: String,
      required: true,
      enum: ["code_8531", "code_8532", "code_8533"],
    },
    translations: {
      type: [
        {
          language: { type: String },
          designation: { type: String, required: true },
          description: { type: String },
        },
      ],
    },
    agendaEvent: { type: Schema.Types.ObjectId, ref: "agendaEvent" },
    lieuConcerne: [{ type: Schema.Types.ObjectId }],
    objetAssocie: [{ type: Schema.Types.ObjectId }],
    referenceDocumentsAppuisPreuve: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

instanceElementAssocieSchema.pre("aggregate", function (next) {
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
instanceElementAssocieSchema.pre(/find.*/, function (next) {
  try {
    this.populate([]);
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
              LIEUCONCERNE_ADMIN_RPC,
              ["lieuConcerne"],
              "VIEW_ITEMS",
              {
                queryOptions: {
                  select:
                    "-rapportBilan -projet -opportinutes -objetsAssocies -instructions -echangesCommunications -referentielsTarifaireAutres -instancesCaracteristiques -objetsConcemes -moment -coordonneesLieu -repertoiresInstitutionsOrganisations -etatsObjets -elementsBudgets -indicateursSuiviRealisation -reglesPotentielsActivation -criteresConditions -incidents -risquesPotentiels",
                },
              }
            ),
            sendRPCRequest(
              doc,
              OBJETASSOCIEE_ADMIN_RPC,
              ["objetAssocie"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObjet" } }
            ),
            sendRPCRequest(
              doc,
              DOCUMENTREFERENCE_ADMIN_RPC,
              ["referenceDocumentsAppuisPreuve"],
              "VIEW_ITEMS",
              {
                queryOptions: {
                  select:
                    "-statistiquesDirectes -contenuMMedia -etats -objetsConcernes -objetsAssocies -moments",
                },
              }
            ),
          ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => { });
        } else {
          if (doc["lieuConcerne"] && doc["lieuConcerne"].length)
            doc["lieuConcerne"] = doc["lieuConcerne"].map(
              (d) =>
                (d = result[0].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["objetAssocie"] && doc["objetAssocie"].length)
            doc["objetAssocie"] = doc["objetAssocie"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["referenceDocumentsAppuisPreuve"] &&
            doc["referenceDocumentsAppuisPreuve"].length
          )
            doc["referenceDocumentsAppuisPreuve"] = doc[
              "referenceDocumentsAppuisPreuve"
            ].map(
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
instanceElementAssocieSchema.post(/find.*|save/, async function (doc) {
  try {
    await distantRequest(doc);
  } catch (error) {
    console.error(
      "error while getting distant data for model instanceElementAssocie==>",
      error
    );
  }
});

instanceElementAssocieSchema.post("save", async function (doc, next) {
  try {
    if (this.agendaEvent) {
      await AgendaEvent.updateOne(
        { _id: this.agendaEvent.toString() },
        { $addToSet: { instanceElementAssocie: this._id } }
      );
    }

    if (doc.lieuConcerne.length)
      publishUpdate(
        "update_items",
        doc.lieuConcerne,
        LIEUCONCERNE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "INSTANCEELEMENTASSOCIE_EVENT",
            },
          },
        }
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
            typeObjetConcerne: "INSTANCEELEMENTASSOCIE_EVENT",
          },
        }
      );
    if (doc.referenceDocumentsAppuisPreuve.length)
      publishUpdate(
        "update_items",
        doc.referenceDocumentsAppuisPreuve,
        DOCUMENTREFERENCE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "INSTANCEELEMENTASSOCIE_EVENT",
            },
          },
        }
      );

    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
instanceElementAssocieSchema.post("insertMany", async function (doc, next) {
  try {
    let agendaEvent = GroupBy(doc, "agendaEvent");
    for (let item of Object.keys(agendaEvent)) {
      if (item)
        await AgendaEvent.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              instanceElementAssocie: {
                $each: agendaEvent[item].map((d) => d._id),
              },
            },
          }
        );
    }

    let lieuConcerne = GroupBy(doc, "lieuConcerne");
    for (let item of Object.keys(lieuConcerne)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(lieuConcerne[item].map((d) => d.lieuConcerne)))],
          LIEUCONCERNE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: lieuConcerne[item].map(
                  (i) =>
                  (i = {
                    refObjet: i._id,
                    typeObjet: "INSTANCEELEMENTASSOCIE_EVENT",
                  })
                ),
              },
            },
          }
        );
    }
    let referenceDocumentsAppuisPreuve = GroupBy(
      doc,
      "referenceDocumentsAppuisPreuve"
    );
    for (let item of Object.keys(referenceDocumentsAppuisPreuve)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                referenceDocumentsAppuisPreuve[item].map(
                  (d) => d.referenceDocumentsAppuisPreuve
                )
              )
            ),
          ],
          DOCUMENTREFERENCE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: referenceDocumentsAppuisPreuve[item].map(
                  (i) =>
                  (i = {
                    refObjet: i._id,
                    typeObjet: "INSTANCEELEMENTASSOCIE_EVENT",
                  })
                ),
              },
            },
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

instanceElementAssocieSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await instanceElementAssocie.findOne(this.getQuery()).lean();

    if (doc) {
      itemToCheck["lieuConcerne"] = doc.lieuConcerne;
      itemToCheck["objetAssocie"] = doc.objetAssocie;
      itemToCheck["referenceDocumentsAppuisPreuve"] =
        doc.referenceDocumentsAppuisPreuve;
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const agendaEventId = this._update?.["$set"]?.agendaEvent;
      if (doc?.agendaEvent != agendaEventId && doc?.agendaEvent != undefined)
        await AgendaEvent.updateOne(
          { _id: doc.agendaEvent.toString() },
          { $pull: { instanceElementAssocie: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
instanceElementAssocieSchema.post(
  "findOneAndUpdate",
  async function (doc, next) {
    try {
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["lieuConcerne"], newData: doc.lieuConcerne },
        LIEUCONCERNE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { objetsConcernes: { refObjet: doc._id } },
          bodyPush: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "INSTANCEELEMENTASSOCIE_EVENT",
            },
          },
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
            typeObjetConcerne: "INSTANCEELEMENTASSOCIE_EVENT",
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["referenceDocumentsAppuisPreuve"],
          newData: doc.referenceDocumentsAppuisPreuve,
        },
        DOCUMENTREFERENCE_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { objetsConcernes: { refObjet: doc._id } },
          bodyPush: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "INSTANCEELEMENTASSOCIE_EVENT",
            },
          },
        }
      );
      if (doc.agendaEvent)
        await AgendaEvent.updateOne(
          { _id: doc.agendaEvent?._id?.toString() || doc.agendaEvent },
          { $addToSet: { instanceElementAssocie: doc._id } }
        );
      next();
    } catch (error) {
      next(error);
    }
  }
);
instanceElementAssocieSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await instanceElementAssocie.find(this.getQuery()).lean();
      const promises = [];
      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.lieuConcerne)))],
          LIEUCONCERNE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
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
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(doc.map((d) => d.referenceDocumentsAppuisPreuve))
            ),
          ],
          DOCUMENTREFERENCE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );

        communicateWithClient("postUpdateMany", this.getQuery());

        doc.map((d) => { });
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        doc.map((d) => { });
      }

      if (this._update?.["$pull"]) {
        if (
          this._update?.["$pull"].lieuConcerne &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].lieuConcerne,
            LIEUCONCERNE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"].referenceDocumentsAppuisPreuve &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].referenceDocumentsAppuisPreuve,
            DOCUMENTREFERENCE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
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
instanceElementAssocieSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await instanceElementAssocie.find(this.getQuery()).lean();
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
            await PublishMessage(INSTANCEELEMENTASSOCIE_CLIENT_QUEUE, {
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
            await PublishMessage(INSTANCEELEMENTASSOCIE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(INSTANCEELEMENTASSOCIE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc.lieuConcerne.length)
            publishUpdate(
              "publish_data",
              doc.lieuConcerne,
              LIEUCONCERNE_ADMIN_QUEUE
            );
          if (doc.objetAssocie.length)
            publishUpdate(
              "publish_data",
              doc.objetAssocie,
              OBJETASSOCIEE_ADMIN_QUEUE
            );
          if (doc.referenceDocumentsAppuisPreuve.length)
            publishUpdate(
              "publish_data",
              doc.referenceDocumentsAppuisPreuve,
              DOCUMENTREFERENCE_ADMIN_QUEUE
            );

          return;
        case "postUpdateMany":
          await PublishMessage(INSTANCEELEMENTASSOCIE_CLIENT_QUEUE, {
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
    console.error(
      "instanceElementAssocie communicateWithClient error==>",
      error
    );
  }
}
//add other hooks here
const instanceElementAssocie = mongoose.model(
  "instanceElementAssocie",
  instanceElementAssocieSchema
);
module.exports = instanceElementAssocie;
const AgendaEvent = require("../models/agendaEvent.model");


const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");

const {
  LIEUCONCERNE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  DOCUMENTREFERENCE_ADMIN_RPC,
  LIEUCONCERNE_ADMIN_QUEUE,
  OBJETASSOCIEE_ADMIN_QUEUE,
  DOCUMENTREFERENCE_ADMIN_QUEUE,
} = require("../config");

const { INSTANCEELEMENTASSOCIE_CLIENT_QUEUE } = require("../config");
