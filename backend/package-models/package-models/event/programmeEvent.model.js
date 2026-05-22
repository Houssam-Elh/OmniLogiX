const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let programmeEventSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    categorieProgramme: { type: Schema.Types.Mixed, required: true },
    translations: {
      type: [
        {
          language: { type: String },
          designation: { type: String, required: true },
          description: { type: String, required: true },
        },
      ],
    },
    dateHeureDebut: { type: Date, required: true },
    dateHeureFin: { type: Date, required: true },
    accesibilite: { type: Boolean },
    programmeEventParent: {
      type: Schema.Types.ObjectId,
      ref: "programmeEvent",
    },
    programmeEventChildren: [
      { type: Schema.Types.ObjectId, ref: "programmeEvent" },
    ],
    agendaEvent: { type: Schema.Types.ObjectId, ref: "agendaEvent" },
    lieuConcerne: [{ type: Schema.Types.ObjectId }],
    protagonistePotentiel: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

programmeEventSchema.pre("aggregate", function (next) {
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
programmeEventSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      {
        path: "categorieProgramme",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "programmeEventChildren",
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
          ? [
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["categorieProgramme"],
              "VIEW_ITEMS",
              {}
            ),
          ]
          : [
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["categorieProgramme"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              COORDONNEEGEO_ADMIN_RPC,
              ["lieuConcerne"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-horaire -zones -objetsConcernes" } }
            ),
            sendRPCRequest(
              doc,
              PROTAGONISTEPOTONTIEL_ADMIN_RPC,
              ["protagonistePotentiel"],
              "VIEW_ITEMS",
              {
                queryOptions: {
                  select:
                    "-documentsLegals -moment -etats -opportinutes -risques -criteresConditions -echangesCommunications -incidents -elementsBudgets -activites -objetsAssocies -caracteristiques -referentiels -instructions -reglesActivations -echangesEtCommunications -objetsConcernes",
                },
              }
            ),
          ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["categorieProgramme"])
              d["categorieProgramme"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["categorieProgramme"]._id || d["categorieProgramme"])
                ) || d["categorieProgramme"];
          });
        } else {
          if (doc["categorieProgramme"])
            doc["categorieProgramme"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["categorieProgramme"]._id || doc["categorieProgramme"])
              ) || doc["categorieProgramme"];
          if (doc["lieuConcerne"] && doc["lieuConcerne"].length)
            doc["lieuConcerne"] = doc["lieuConcerne"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["protagonistePotentiel"] &&
            doc["protagonistePotentiel"].length
          )
            doc["protagonistePotentiel"] = doc["protagonistePotentiel"].map(
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
programmeEventSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

programmeEventSchema.post("save", async function (doc, next) {
  try {
    if (this.agendaEvent) {
      await AgendaEvent.updateOne(
        { _id: this.agendaEvent.toString() },
        { $addToSet: { programmeEvent: this._id } }
      );
    }
    if (this.programmeEventParent) {
      await programmeEvent.updateOne(
        { _id: this.programmeEventParent.toString() },
        { $addToSet: { programmeEventChildren: this._id } }
      );
    } else if (this.programmeEventChildren?.length) {
      await programmeEvent.updateMany(
        { _id: { $in: this.programmeEventChildren.map((d) => d._id || d) } },
        { $set: { programmeEventParent: this._id } }
      );
    }

    if (doc.lieuConcerne.length)
      publishUpdate(
        "update_items",
        doc.lieuConcerne,
        COORDONNEEGEO_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROGRAMMEEVENT_EVENT",
            },
          },
        }
      );
    if (doc.protagonistePotentiel.length)
      publishUpdate(
        "update_items",
        doc.protagonistePotentiel,
        PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "PROGRAMMEEVENT_EVENT",
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
programmeEventSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    let agendaEvent = GroupBy(doc, "agendaEvent");
    for (let item of Object.keys(agendaEvent)) {
      if (item)
        await AgendaEvent.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              programmeEvent: { $each: agendaEvent[item].map((d) => d._id) },
            },
          }
        );
    }

    let programmeEventParent = GroupBy(doc, "programmeEventParent");
    for (let item of Object.keys(programmeEventParent)) {
      if (item)
        await programmeEvent.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              programmeEventChildren: {
                $each: programmeEventParent[item].map((d) => d._id),
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
          COORDONNEEGEO_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: lieuConcerne[item].map(
                  (i) =>
                    (i = { refObjet: i._id, typeObjet: "PROGRAMMEEVENT_EVENT" })
                ),
              },
            },
          }
        );
    }
    let protagonistePotentiel = GroupBy(doc, "protagonistePotentiel");
    for (let item of Object.keys(protagonistePotentiel)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                protagonistePotentiel[item].map((d) => d.protagonistePotentiel)
              )
            ),
          ],
          PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: protagonistePotentiel[item].map(
                  (i) =>
                    (i = { refObjet: i._id, typeObjet: "PROGRAMMEEVENT_EVENT" })
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

programmeEventSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await programmeEvent.findOne(this.getQuery()).lean();

    if (doc) {
      itemToCheck["lieuConcerne"] = doc.lieuConcerne;
      itemToCheck["protagonistePotentiel"] = doc.protagonistePotentiel;
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
          { $pull: { programmeEvent: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
programmeEventSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["lieuConcerne"], newData: doc.lieuConcerne },
      COORDONNEEGEO_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "PROGRAMMEEVENT_EVENT",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["protagonistePotentiel"],
        newData: doc.protagonistePotentiel,
      },
      PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "PROGRAMMEEVENT_EVENT",
          },
        },
      }
    );
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.agendaEvent)
      await AgendaEvent.updateOne(
        { _id: doc.agendaEvent?._id?.toString() || doc.agendaEvent },
        { $addToSet: { programmeEvent: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
programmeEventSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await programmeEvent.find(this.getQuery()).lean();
      const promises = [];
      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.lieuConcerne)))],
          COORDONNEEGEO_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.protagonistePotentiel)))],
          PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );

        communicateWithClient("postUpdateMany", this.getQuery());

        let programmeEventChildren = [];
        doc.map((d) => {
          programmeEventChildren.push(
            ...d.programmeEventChildren.map((v) => v._id || v)
          );
        });
        if (programmeEventChildren.length) {
          promises.push(
            programmeEvent
              .updateMany(
                { _id: { $in: programmeEventChildren } },
                { $set: { etatObjet: "code-2" } }
              )
              .exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let programmeEventChildren = [];

        doc.map((d) => {
          programmeEventChildren.push(
            ...d.programmeEventChildren.map((v) => v._id || v)
          );
        });
        if (programmeEventChildren.length) {
          promises.push(
            programmeEvent
              .updateMany(
                { _id: { $in: programmeEventChildren } },
                { $set: { etatObjet: "code-1" } }
              )
              .exec()
          );
        }
      }

      if (this._update?.["$pull"]) {
        if (
          this._update?.["$pull"].lieuConcerne &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].lieuConcerne,
            COORDONNEEGEO_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
        if (
          this._update?.["$pull"].protagonistePotentiel &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].protagonistePotentiel,
            PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
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
programmeEventSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await programmeEvent.find(this.getQuery()).lean();
    const promises = [];
    let programmeEventChildren = [];
    doc.map((d) => {
      programmeEventChildren.push(
        ...d.programmeEventChildren.map((v) => v._id || v)
      );
    });
    if (programmeEventChildren.length) {
      promises.push(
        programmeEvent
          .deleteMany({ _id: { $in: programmeEventChildren } })
          .exec()
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
            await PublishMessage(PROGRAMMEEVENT_CLIENT_QUEUE, {
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
            await PublishMessage(PROGRAMMEEVENT_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(PROGRAMMEEVENT_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });

            if (doc?.programmeEventParent?.length) {
              PublishProgrammeEvent(doc.programmeEventParent);
            }
          }
          if (doc.lieuConcerne.length)
            publishUpdate(
              "publish_data",
              doc.lieuConcerne,
              COORDONNEEGEO_ADMIN_QUEUE
            );
          if (doc.protagonistePotentiel.length)
            publishUpdate(
              "publish_data",
              doc.protagonistePotentiel,
              PROTAGONISTEPOTONTIEL_ADMIN_QUEUE
            );

          return;
        case "postUpdateMany":
          await PublishMessage(PROGRAMMEEVENT_CLIENT_QUEUE, {
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
    console.error("programmeEvent communicateWithClient error==>", error);
  }
}
//add other hooks here
const programmeEvent = mongoose.model("programmeEvent", programmeEventSchema);
module.exports = programmeEvent;
const AgendaEvent = require("../models/agendaEvent.model");


const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  PROTAGONISTEPOTONTIEL_ADMIN_RPC,
  COORDONNEEGEO_ADMIN_QUEUE,
  PROTAGONISTEPOTONTIEL_ADMIN_QUEUE,
  COORDONNEEGEO_ADMIN_RPC,
} = require("../config");

const { PROGRAMMEEVENT_CLIENT_QUEUE } = require("../config");
