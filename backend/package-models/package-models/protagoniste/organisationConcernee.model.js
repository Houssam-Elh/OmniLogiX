const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let organisationConcerneeSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    refMembre: { type: Schema.Types.Mixed },
    translations: {
      type: [
        {
          language: { type: String, required: true },
          nomOrganisation: { type: String, required: true },
          descriptionOrganisation: { type: String, required: true },
        },
      ],
    },
    secteurAcitivite: { type: Schema.Types.Mixed, required: true },
    logoOrganisation: { type: String, required: true },
    etatOrganisation: {
      type: Boolean,
      required: true,
      // enum: ["code_3574", "code_223", "code_224"],
    },
    taxonomieOrganisation: { type: Schema.Types.Mixed, required: true },
    telephone: { type: String, required: true },
    email: { type: String, required: true },
    instanseCaracteristique: [{ type: Schema.Types.ObjectId }],
    motivations: [
      { type: Schema.Types.ObjectId, ref: "motivationProtagoniste" },
    ],
    protagonisteProtentiels: [
      { type: Schema.Types.ObjectId, ref: "protagonistePotontiel" },
    ],
    annuaireActeursPro: { type: Schema.Types.ObjectId },
    coordonneesLieu: [{ type: Schema.Types.ObjectId }],
    relationsPersonneOrganisation: [
      { type: Schema.Types.ObjectId, ref: "relationPersonneOrganisation" },
    ],
    etats: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

//  autoPopulate hook

organisationConcerneeSchema.pre("aggregate", function (next) {
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
organisationConcerneeSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      { path: "refMembre", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "secteurAcitivite",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "taxonomieOrganisation",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "motivations", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "relationsPersonneOrganisation",
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
              MEMBRE_ADMIN_RPC,
              ["refMembre"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["secteurAcitivite", "taxonomieOrganisation"],
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
              MEMBRE_ADMIN_RPC,
              ["refMembre"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["secteurAcitivite", "taxonomieOrganisation"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              INSTANCECARACTERISTIQUE_ADMIN_RPC,
              ["instanseCaracteristique"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObjetConcerne" } }
            ),
            sendRPCRequest(
              doc,
              ACTEURSPRO_ADMIN_RPC,
              ["annuaireActeursPro"],
              "VIEW_ITEM",
              {
                queryOptions: {
                  select:
                    "-coordonneesGeo -evenement -distinctions -organigrammeStructure -mMEDIA -histoire -socialMedia -promotions -annotations -traceFournisseur -parrainePar -actionnaires -conseilAdministratif -abonnees -rdv -contrat -inbox -selection -informationComplementaire -representationMarque -candidatureSpontane -objetsAssocies -notifications -recherches -offres -favories -caracteristiques -identitesAdministratifs -actionsSocialesSolidaires -temoignage -referencesProfessionnelles -objetsConcernes",
                },
              }
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
              ETATOBJET_ADMIN_RPC,
              ["etats"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObject" } }
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
            if (d["secteurAcitivite"])
              d["secteurAcitivite"] =
                result[1].find(
                  (item) =>
                    item._id ==
                    (d["secteurAcitivite"]._id || d["secteurAcitivite"])
                ) || d["secteurAcitivite"];
            if (d["taxonomieOrganisation"])
              d["taxonomieOrganisation"] =
                result[1].find(
                  (item) =>
                    item._id ==
                    (d["taxonomieOrganisation"]._id ||
                      d["taxonomieOrganisation"])
                ) || d["taxonomieOrganisation"];

            if (d["coordonneesLieu"] && d["coordonneesLieu"].length)
              d["coordonneesLieu"] = d["coordonneesLieu"].map(
                (d) =>
                  (d = result[2].find((item) => item._id == (d._id || d)) || d)
              );
          });
        } else {
          if (doc["refMembre"])
            doc["refMembre"] =
              result[0].find(
                (item) => item._id == (doc["refMembre"]._id || doc["refMembre"])
              ) || doc["refMembre"];
          if (doc["secteurAcitivite"])
            doc["secteurAcitivite"] =
              result[1].find(
                (item) =>
                  item._id ==
                  (doc["secteurAcitivite"]._id || doc["secteurAcitivite"])
              ) || doc["secteurAcitivite"];
          if (doc["taxonomieOrganisation"])
            doc["taxonomieOrganisation"] =
              result[1].find(
                (item) =>
                  item._id ==
                  (doc["taxonomieOrganisation"]._id ||
                    doc["taxonomieOrganisation"])
              ) || doc["taxonomieOrganisation"];
          if (
            doc["instanseCaracteristique"] &&
            doc["instanseCaracteristique"].length
          )
            doc["instanseCaracteristique"] = doc["instanseCaracteristique"].map(
              (d) =>
                (d = result[2].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["annuaireActeursPro"] && result[3])
            doc["annuaireActeursPro"] = result[3] || doc["annuaireActeursPro"];
          if (doc["coordonneesLieu"] && doc["coordonneesLieu"].length)
            doc["coordonneesLieu"] = doc["coordonneesLieu"].map(
              (d) =>
                (d = result[4].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["etats"] && doc["etats"].length)
            doc["etats"] = doc["etats"].map(
              (d) =>
                (d = result[5].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
organisationConcerneeSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);
    next();
  } catch (err) {
    next(err);
  }
});

organisationConcerneeSchema.post("save", async function (doc, next) {
  try {
    if (doc.instanseCaracteristique.length)
      publishUpdate(
        "update_items",
        doc.instanseCaracteristique,
        INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "ORGANISATIONCONCERNEE_PROTAGONISTE",
          },
        }
      );
    if (doc.annuaireActeursPro)
      publishUpdate(
        "update_items",
        doc.annuaireActeursPro,
        ACTEURSPRO_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "ORGANISATIONCONCERNEE_PROTAGONISTE",
            },
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
              typeObjetConcerne: "ORGANISATIONCONCERNEE_PROTAGONISTE",
            },
          },
        }
      );
    if (doc.etats.length)
      publishUpdate("update_items", doc.etats, ETATOBJET_ADMIN_QUEUE, {
        operation: "$set",
        body: {
          refObject: doc._id,
          typeObject: "ORGANISATIONCONCERNEE_PROTAGONISTE",
        },
      });

    next();
  } catch (error) {
    next(error);
  }
});
//new added hook
//rewrite insertMany
organisationConcerneeSchema.post("insertMany", async function (doc, next) {
  try {
    this.populate(doc, populateField);
    await distantRequest(doc);

    //#region new insert many bloc
    let annuaireActeursPro = GroupBy(doc, "annuaireActeursPro");
    for (let item of Object.keys(annuaireActeursPro)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                annuaireActeursPro[item].map((d) => d.annuaireActeursPro)
              )
            ),
          ],
          ACTEURSPRO_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: annuaireActeursPro[item].map(
                  (i) =>
                  (i = {
                    refObjet: i._id,
                    typeObjet: "ORGANISATIONCONCERNEE_PROTAGONISTE",
                  })
                ),
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
                    typeObjetConcerne: "ORGANISATIONCONCERNEE_PROTAGONISTE",
                  })
                ),
              },
            },
          }
        );
    }

    //#enregion new insert many bloc

    next();
  } catch (error) {
    next(error);
  }
});

let prevState = null;
let itemToCheck = {};

organisationConcerneeSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await organisationConcernee.findOne(this.getQuery()).lean();

    if (doc) {
      itemToCheck["instanseCaracteristique"] = doc.instanseCaracteristique;
      itemToCheck["annuaireActeursPro"] = doc.annuaireActeursPro;
      itemToCheck["coordonneesLieu"] = doc.coordonneesLieu;
      itemToCheck["etats"] = doc.etats;
      prevState = doc?.etatDePublication;
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
organisationConcerneeSchema.post(
  "findOneAndUpdate",
  async function (doc, next) {
    try {
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["instanseCaracteristique"],
          newData: doc.instanseCaracteristique,
        },
        INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { refObjetConcerne: null, typeObjetConcerne: null },
          bodyPush: {
            refObjetConcerne: doc._id,
            typeObjetConcerne: "ORGANISATIONCONCERNEE_PROTAGONISTE",
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["annuaireActeursPro"],
          newData: doc.annuaireActeursPro,
        },
        ACTEURSPRO_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { objetsConcernes: { refObjet: doc._id } },
          bodyPush: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "ORGANISATIONCONCERNEE_PROTAGONISTE",
            },
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        {
          oldData: itemToCheck["coordonneesLieu"],
          newData: doc.coordonneesLieu,
        },
        COORDONNEEGEO_ADMIN_QUEUE,
        {
          operation: "$pull",
          bodyPull: { objetsConcernes: { refObjetConcerne: doc._id } },
          bodyPush: {
            objetsConcernes: {
              refObjetConcerne: doc._id,
              typeObjetConcerne: "ORGANISATIONCONCERNEE_PROTAGONISTE",
            },
          },
        }
      );
      publishUpdate(
        "pullAndPush",
        { oldData: itemToCheck["etats"], newData: doc.etats },
        ETATOBJET_ADMIN_QUEUE,
        {
          operation: "$set",
          bodyPull: { refObject: null, typeObject: null },
          bodyPush: {
            refObject: doc._id,
            typeObject: "ORGANISATIONCONCERNEE_PROTAGONISTE",
          },
        }
      );
      communicateWithClient("postFindOneAndUpdate", doc, prevState);

      next();
    } catch (error) {
      next(error);
    }
  }
);
organisationConcerneeSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await organisationConcernee.find(this.getQuery()).lean();
      const promises = [];
      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.instanseCaracteristique)))],
          INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.annuaireActeursPro)))],
          ACTEURSPRO_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
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
          [...new Set(flatDeep(doc.map((d) => d.etats)))],
          ETATOBJET_ADMIN_QUEUE,
          { operation: "$set", body: { etatObjet: "code-2" } }
        );

        let files = [];

        doc.map((d) => {
          if (d.logoOrganisation) files.push(d.logoOrganisation);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let motivations = [];
        let protagonisteProtentiels = [];
        let relationsPersonneOrganisation = [];
        doc.map((d) => {
          motivations.push(...d.motivations.map((v) => v._id || v));
          protagonisteProtentiels.push(
            ...d.protagonisteProtentiels.map((v) => v._id || v)
          );
          relationsPersonneOrganisation.push(
            ...d.relationsPersonneOrganisation.map((v) => v._id || v)
          );
        });
        if (motivations.length) {
          promises.push(
            MotivationProtagoniste.updateMany(
              { _id: { $in: motivations } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (protagonisteProtentiels.length) {
          promises.push(
            ProtagonistePotontiel.updateMany(
              { _id: { $in: protagonisteProtentiels } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (relationsPersonneOrganisation.length) {
          promises.push(
            RelationPersonneOrganisation.updateMany(
              { _id: { $in: relationsPersonneOrganisation } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let motivations = [];
        let protagonisteProtentiels = [];
        let relationsPersonneOrganisation = [];

        doc.map((d) => {
          motivations.push(...d.motivations.map((v) => v._id || v));
          protagonisteProtentiels.push(
            ...d.protagonisteProtentiels.map((v) => v._id || v)
          );
          relationsPersonneOrganisation.push(
            ...d.relationsPersonneOrganisation.map((v) => v._id || v)
          );
        });
        if (motivations.length) {
          promises.push(
            MotivationProtagoniste.updateMany(
              { _id: { $in: motivations } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (protagonisteProtentiels.length) {
          promises.push(
            ProtagonistePotontiel.updateMany(
              { _id: { $in: protagonisteProtentiels } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (relationsPersonneOrganisation.length) {
          promises.push(
            RelationPersonneOrganisation.updateMany(
              { _id: { $in: relationsPersonneOrganisation } },
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
organisationConcerneeSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await organisationConcernee.find(this.getQuery()).lean();
    const promises = [];
    let motivations = [];
    let protagonisteProtentiels = [];
    let relationsPersonneOrganisation = [];
    doc.map((d) => {
      motivations.push(...d.motivations.map((v) => v._id || v));
      protagonisteProtentiels.push(
        ...d.protagonisteProtentiels.map((v) => v._id || v)
      );
      relationsPersonneOrganisation.push(
        ...d.relationsPersonneOrganisation.map((v) => v._id || v)
      );
    });
    if (motivations.length) {
      promises.push(
        MotivationProtagoniste.deleteMany({ _id: { $in: motivations } }).exec()
      );
    }
    if (protagonisteProtentiels.length) {
      promises.push(
        ProtagonistePotontiel.deleteMany({
          _id: { $in: protagonisteProtentiels },
        }).exec()
      );
    }
    if (relationsPersonneOrganisation.length) {
      promises.push(
        RelationPersonneOrganisation.deleteMany({
          _id: { $in: relationsPersonneOrganisation },
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
            await PublishMessage(ORGANISATIONCONCERNEE_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            // doc.map((d)=>{
            if (doc.logoOrganisation) files.push(doc.logoOrganisation);
            //})

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(ORGANISATIONCONCERNEE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(ORGANISATIONCONCERNEE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
            let files = [];
            //doc.map((d)=>{
            if (doc.logoOrganisation) files.push(doc.logoOrganisation);
            //})
            copyFiles(files);
            if (doc?.motivations?.length) {
              PublishMotivationProtagoniste(doc.motivations);
            }
            if (doc?.protagonisteProtentiels?.length) {
              PublishProtagonistePotontiel(doc.protagonisteProtentiels);
            }
            if (doc?.relationsPersonneOrganisation?.length) {
              PublishRelationPersonneOrganisation(
                doc.relationsPersonneOrganisation
              );
            }
          }
          if (doc.instanseCaracteristique.length)
            publishUpdate(
              "publish_data",
              doc.instanseCaracteristique,
              INSTANCECARACTERISTIQUE_ADMIN_QUEUE
            );
          if (doc.coordonneesLieu.length)
            publishUpdate(
              "publish_data",
              doc.coordonneesLieu,
              COORDONNEEGEO_ADMIN_QUEUE
            );
          if (doc.etats.length)
            publishUpdate("publish_data", doc.etats, ETATOBJET_ADMIN_QUEUE);

          return;
        case "postUpdateMany":
          await PublishMessage(ORGANISATIONCONCERNEE_CLIENT_QUEUE, {
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
    console.error(
      "organisationConcernee communicateWithClient error==>",
      error
    );
  }
}
//add other hooks here
const organisationConcernee = mongoose.model(
  "organisationConcernee",
  organisationConcerneeSchema
);
module.exports = organisationConcernee;
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
  PublishData: PublishRelationPersonneOrganisation,
} = require("./repositories/relationPersonneOrganisation.repositorie");


const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  copyFiles,
  removeFiles,
  flatDeep,
} = require("../helpers/helpers");

const {
  MEMBRE_ADMIN_RPC,
  TAXONOMIE_ADMIN_RPC,
  INSTANCECARACTERISTIQUE_ADMIN_RPC,
  ACTEURSPRO_ADMIN_RPC,
  COORDONNEEGEO_ADMIN_RPC,
  ETATOBJET_ADMIN_RPC,
  INSTANCECARACTERISTIQUE_ADMIN_QUEUE,
  ACTEURSPRO_ADMIN_QUEUE,
  COORDONNEEGEO_ADMIN_QUEUE,
  ETATOBJET_ADMIN_QUEUE,
} = require("../config");

const { ORGANISATIONCONCERNEE_CLIENT_QUEUE } = require("../config");
const { GroupBy } = require("../helpers/helpers");
