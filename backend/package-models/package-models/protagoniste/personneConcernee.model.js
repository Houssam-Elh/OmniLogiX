const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let personneConcerneeSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    taxonomieCategoriePersonne: { type: Schema.Types.Mixed, required: false },
    identifiantInterne: { type: String, required: true, unique: true },
    salutation: {
      type: String,
      required: true,
      enum: ["code_2591", "code_2592", "code_2590"],
    },
    translations: {
      type: [
        {
          language: { type: String },
          nomPersonne: { type: String, required: true },
          prenomPersonne: { type: String, required: true },
          deuxiemePrenom: { type: String },
        },
      ],
    },
    dateNaissance: { type: Date },
    fonctionPersonne: { type: Schema.Types.Mixed },
    photo: { type: String },
    codeInternationaleTel: { type: String, required: true },
    nTelephonePersonnel: { type: String, required: true },
    nTelephoneDomicile: { type: String },
    nTelephoneWatssap: { type: String },
    email: { type: String, required: true },
    etatValidation: {
      type: Boolean,
      // enum: ["code_1167", "code_3516", "code_546"],
      required: true,
    },
    relationOrganisationPersonne: {
      type: Schema.Types.ObjectId,
      ref: "relationPersonneOrganisation",
    },
    motivation: [
      { type: Schema.Types.ObjectId, ref: "motivationProtagoniste" },
    ],
    protagonistePotentie: [
      { type: Schema.Types.ObjectId, ref: "protagonistePotontiel" },
    ],
    instanceCaracteristique: [{ type: Schema.Types.ObjectId }],
    coordonneesLieu: [{ type: Schema.Types.ObjectId }],
    rubriqueCv: { type: Schema.Types.ObjectId },
    etats: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

personneConcerneeSchema.pre("aggregate", function (next) {
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
personneConcerneeSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      {
        path: "taxonomieCategoriePersonne",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "fonctionPersonne",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "motivation", match: { etatObjet: "code-1" }, populate: [] },
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
                ["taxonomieCategoriePersonne", "fonctionPersonne"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                COORDONNEEGEO_ADMIN_RPC,
                ["coordonneesLieu"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-horaire -zones -objetsConcernes" } }
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["taxonomieCategoriePersonne", "fonctionPersonne"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                INSTANCECARACTERISTIQUE_ADMIN_RPC,
                ["instanceCaracteristique"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObjetConcerne" } }
              ),
              sendRPCRequest(
                doc,
                COORDONNEEGEO_ADMIN_RPC,
                ["coordonneesLieu"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-horaire -zones -objetsConcernes" } }
              ),
              sendRPCRequest(
                doc,
                RUBRIQUECV_ADMIN_RPC,
                ["rubriqueCv"],
                "VIEW_ITEM",
                {
                  queryOptions: {
                    select:
                      "-copiesGeneres -distinctions -objetsAssociees -refObjetConcerne",
                  },
                }
              ),
              sendRPCRequest(
                doc,
                ETATOBJET_ADMIN_RPC,
                ["etats"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObject" } }
              ),
            ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["taxonomieCategoriePersonne"])
              d["taxonomieCategoriePersonne"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["taxonomieCategoriePersonne"]._id ||
                      d["taxonomieCategoriePersonne"])
                ) || d["taxonomieCategoriePersonne"];
            if (d["fonctionPersonne"])
              d["fonctionPersonne"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["fonctionPersonne"]._id || d["fonctionPersonne"])
                ) || d["fonctionPersonne"];

            if (d["coordonneesLieu"] && d["coordonneesLieu"].length)
              d["coordonneesLieu"] = d["coordonneesLieu"].map(
                (d) =>
                  (d = result[1].find((item) => item._id == (d._id || d)) || d)
              );
          });
        } else {
          if (doc["taxonomieCategoriePersonne"])
            doc["taxonomieCategoriePersonne"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["taxonomieCategoriePersonne"]._id ||
                    doc["taxonomieCategoriePersonne"])
              ) || doc["taxonomieCategoriePersonne"];
          if (doc["fonctionPersonne"])
            doc["fonctionPersonne"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["fonctionPersonne"]._id || doc["fonctionPersonne"])
              ) || doc["fonctionPersonne"];
          if (
            doc["instanceCaracteristique"] &&
            doc["instanceCaracteristique"].length
          )
            doc["instanceCaracteristique"] = doc["instanceCaracteristique"].map(
              (d) =>
                (d = result[1].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["coordonneesLieu"] && doc["coordonneesLieu"].length)
            doc["coordonneesLieu"] = doc["coordonneesLieu"].map(
              (d) =>
                (d = result[2].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["rubriqueCv"] && result[3])
            doc["rubriqueCv"] = result[3] || doc["rubriqueCv"];
          if (doc["etats"] && doc["etats"].length)
            doc["etats"] = doc["etats"].map(
              (d) =>
                (d = result[4].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    console.log("🚀 ~ distantRequest ~ error:", error);
    throw new Error(error);
  }
}
personneConcerneeSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

personneConcerneeSchema.post("save", async function (doc, next) {
  try {
    if (this.relationOrganisationPersonne) {
      await RelationPersonneOrganisation.updateOne(
        { _id: this.relationOrganisationPersonne.toString() },
        { $addToSet: { personneConcerne: this._id } }
      );
    }

    if (doc.instanceCaracteristique.length)
      publishUpdate(
        "update_items",
        doc.instanceCaracteristique,
        INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PERSONNECONCERNEE_PROTAGONISTE",
          },
        }
      );
    if (doc.coordonneesLieu.length)
      publishUpdate(
        "update_items",
        doc.coordonneesLieu,
        COORDONNEEGEO_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjetConcerne: doc._id,
              typeObjetConcerne: "PERSONNECONCERNEE_PROTAGONISTE",
            },
          },
        }
      );
    if (doc.rubriqueCv)
      publishUpdate("update_items", [doc.rubriqueCv], RUBRIQUECV_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "PERSONNECONCERNEE_PROTAGONISTE",
        },
      });
    if (doc.etats.length)
      publishUpdate("update_items", doc.etats, ETATOBJET_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObject: doc._id,
          typeObject: "PERSONNECONCERNEE_PROTAGONISTE",
        },
      });

    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
personneConcerneeSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    let relationOrganisationPersonne = GroupBy(
      doc,
      "relationOrganisationPersonne"
    );
    for (let item of Object.keys(relationOrganisationPersonne)) {
      if (item)
        await RelationPersonneOrganisation.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              personneConcerne: {
                $each: relationOrganisationPersonne[item].map((d) => d._id),
              },
            },
          }
        );
    }

    let coordonneesLieu = GroupBy(doc, "coordonneesLieu");
    for (let item of Object.keys(coordonneesLieu)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(coordonneesLieu[item].map((d) => d.coordonneesLieu))
            ),
          ],
          COORDONNEEGEO_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: coordonneesLieu[item].map(
                  (i) =>
                    (i = {
                      refObjetConcerne: i._id,
                      typeObjetConcerne: "PERSONNECONCERNEE_PROTAGONISTE",
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

personneConcerneeSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await personneConcernee.findOne(this.getQuery()).lean();

    if (doc) {
      itemToCheck["instanceCaracteristique"] = doc.instanceCaracteristique;
      itemToCheck["coordonneesLieu"] = doc.coordonneesLieu;
      itemToCheck["rubriqueCv"] = doc.rubriqueCv;
      itemToCheck["etats"] = doc.etats;
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );

      const relationOrganisationPersonneId =
        this._update?.["$set"]?.relationOrganisationPersonne;
      if (
        relationOrganisationPersonneId &&
        doc?.relationOrganisationPersonne != relationOrganisationPersonneId &&
        doc?.relationOrganisationPersonne != undefined
      )
        await RelationPersonneOrganisation.updateOne(
          { _id: doc.relationOrganisationPersonne.toString() },
          { $pull: { personneConcerne: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
personneConcerneeSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["instanceCaracteristique"],
        newData: doc.instanceCaracteristique,
      },
      INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "PERSONNECONCERNEE_PROTAGONISTE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["coordonneesLieu"], newData: doc.coordonneesLieu },
      COORDONNEEGEO_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjetConcerne: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "PERSONNECONCERNEE_PROTAGONISTE",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: [itemToCheck["rubriqueCv"]], newData: [doc.rubriqueCv] },
      RUBRIQUECV_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcerne: "PERSONNECONCERNEE_PROTAGONISTE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["etats"], newData: doc.etats },
      ETATOBJET_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: {
          refObject: doc._id,
          typeObject: "PERSONNECONCERNEE_PROTAGONISTE",
        },
      }
    );
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.relationOrganisationPersonne)
      await RelationPersonneOrganisation.updateOne(
        {
          _id:
            doc.relationOrganisationPersonne?._id?.toString() ||
            doc.relationOrganisationPersonne,
        },
        { $addToSet: { personneConcerne: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
personneConcerneeSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await personneConcernee.find(this.getQuery()).lean();
      const promises = [];
      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.instanceCaracteristique)))],
          INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.coordonneesLieu)))],
          COORDONNEEGEO_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: {
              objetsConcernes: { refObjetConcerne: this.getQuery()._id },
            },
          }
        );
        publishUpdate(
          "update_items",
          doc.map((d) => d.rubriqueCv),
          RUBRIQUECV_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.etats)))],
          ETATOBJET_ADMIN_QUEUE,
          { operation: "$set", body: { etatObjet: "code-2" } }
        );

        let files = [];

        doc.map((d) => {
          if (d.photo) files.push(d.photo);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let motivation = [];
        let protagonistePotentie = [];
        doc.map((d) => {
          motivation.push(...d.motivation.map((v) => v._id || v));
          protagonistePotentie.push(
            ...d.protagonistePotentie.map((v) => v._id || v)
          );
        });
        if (motivation.length) {
          promises.push(
            MotivationProtagoniste.updateMany(
              { _id: { $in: motivation } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (protagonistePotentie.length) {
          promises.push(
            ProtagonistePotontiel.updateMany(
              { _id: { $in: protagonistePotentie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let motivation = [];
        let protagonistePotentie = [];

        doc.map((d) => {
          motivation.push(...d.motivation.map((v) => v._id || v));
          protagonistePotentie.push(
            ...d.protagonistePotentie.map((v) => v._id || v)
          );
        });
        if (motivation.length) {
          promises.push(
            MotivationProtagoniste.updateMany(
              { _id: { $in: motivation } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (protagonistePotentie.length) {
          promises.push(
            ProtagonistePotontiel.updateMany(
              { _id: { $in: protagonistePotentie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
      }

      if (this._update?.["$pull"]) {
        if (
          this._update?.["$pull"].coordonneesLieu &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].coordonneesLieu,
            COORDONNEEGEO_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: {
                objetsConcernes: { refObjetConcerne: this.getQuery()._id },
              },
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
personneConcerneeSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await personneConcernee.find(this.getQuery()).lean();
    const promises = [];
    let motivation = [];
    let protagonistePotentie = [];
    doc.map((d) => {
      motivation.push(...d.motivation.map((v) => v._id || v));
      protagonistePotentie.push(
        ...d.protagonistePotentie.map((v) => v._id || v)
      );
    });
    if (motivation.length) {
      promises.push(
        MotivationProtagoniste.deleteMany({ _id: { $in: motivation } }).exec()
      );
    }
    if (protagonistePotentie.length) {
      promises.push(
        ProtagonistePotontiel.deleteMany({
          _id: { $in: protagonistePotentie },
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
            await PublishMessage(PERSONNECONCERNEE_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            // doc.map((d)=>{
            if (doc.photo) files.push(doc.photo);
            //})

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(PERSONNECONCERNEE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(PERSONNECONCERNEE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
            let files = [];
            //doc.map((d)=>{
            if (doc.photo) files.push(doc.photo);
            //})
            copyFiles(files);
            if (doc?.motivation?.length) {
              PublishMotivationProtagoniste(doc.motivation);
            }
            if (doc?.protagonistePotentie?.length) {
              PublishProtagonistePotontiel(doc.protagonistePotentie);
            }
          }
          if (doc.instanceCaracteristique.length)
            publishUpdate(
              "publish_data",
              doc.instanceCaracteristique,
              INSTANCECARACTERISTIQUE_ADMIN_QUEUE
            );
          if (doc.coordonneesLieu.length)
            publishUpdate(
              "publish_data",
              doc.coordonneesLieu,
              COORDONNEEGEO_ADMIN_QUEUE
            );
          if (doc.rubriqueCv)
            publishUpdate(
              "publish_data",
              [doc.rubriqueCv],
              RUBRIQUECV_ADMIN_QUEUE
            );
          if (doc.etats.length)
            publishUpdate("publish_data", doc.etats, ETATOBJET_ADMIN_QUEUE);

          return;
        case "postUpdateMany":
          await PublishMessage(PERSONNECONCERNEE_CLIENT_QUEUE, {
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
    console.error("personneConcernee communicateWithClient error==>", error);
  }
}
//add other hooks here
const personneConcernee = mongoose.model(
  "personneConcernee",
  personneConcerneeSchema
);
module.exports = personneConcernee;
const MotivationProtagoniste = require("../models/motivationProtagoniste.model");
const ProtagonistePotontiel = require("../models/protagonistePotontiel.model");
const RelationPersonneOrganisation = require("../models/relationPersonneOrganisation.model");

const {
  PublishData: PublishMotivationProtagoniste,
} = require("./repositories/motivationProtagoniste.repositorie");
const {
  PublishData: PublishProtagonistePotontiel,
} = require("./repositories/protagonistePotontiel.repositorie");

const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  copyFiles,
  removeFiles,
  GroupBy,
  flatDeep,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  INSTANCECARACTERISTIQUE_ADMIN_RPC,
  COORDONNEEGEO_ADMIN_RPC,
  RUBRIQUECV_ADMIN_RPC,
  ETATOBJET_ADMIN_RPC,
  INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
  COORDONNEEGEO_ADMIN_QUEUE,
  RUBRIQUECV_ADMIN_QUEUE,
  ETATOBJET_ADMIN_QUEUE,
} = require("../config");

const { PERSONNECONCERNEE_CLIENT_QUEUE } = require("../config");
