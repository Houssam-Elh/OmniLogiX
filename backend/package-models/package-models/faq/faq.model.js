const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let faqSchema = new Schema(
  {
    etatDePublication: {
      type: String,
      required: true,
      enum: ["code_541", "code_3516", "code_3417"],
    },
    etatObjet: { type: String, default: "code-1" },
    reference: { type: String, required: true, unique: true },
    classeFaq: { type: Schema.Types.Mixed, required: true },
    translations: {
      type: [
        {
          language: { type: String },
          designation: { type: String, required: true },
          description: { type: String },
          nomResponsable: { type: String, required: true },
        },
      ],
    },
    refResponsable: { type: Schema.Types.Mixed },
    emailResponsable: { type: String, required: true },
    imageRepresentative: { type: String },
    dateOuverture: { type: Date, required: true },
    dateCloture: { type: Date },
    nbrQuestion: { type: Number },
    nbrParticipants: { type: Number },
    nbrVue: { type: Number },
    etatFaq: { type: String, required: true, enum: ["code_4268", "code_1407"] },
    questions: [{ type: Schema.Types.ObjectId, ref: "questionsFAQ" }],
    objetsAssocies: [{ type: Schema.Types.ObjectId }],
    etatObject: { type: [ObjectId] },
    objetsConcernes: {
      type: [
        {
          typeObjet: { type: String },
          refObjet: { type: Schema.Types.ObjectId },
        },
      ],
    },

    //#region new attribut declaration
    etats: [{ type: Schema.Types.ObjectId }],
    //#endregion
  },
  { timestamps: true }
);

//  autoPopulate hook

const populateField = [
  { path: "questions", match: { etatObjet: "code-1" }, populate: [] },
];
faqSchema.pre("aggregate", function (next) {
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
faqSchema.pre(/find.*/, function (next) {
  try {
    this.populate(populateField);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
let prevState = null;
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
                ["classeFaq"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                MEMBRE_ADMIN_RPC,
                ["refResponsable"],
                "VIEW_ITEMS",
                {}
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                ["classeFaq"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                MEMBRE_ADMIN_RPC,
                ["refResponsable"],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                ETATOBJET_ADMIN_RPC,
                ["etats"],
                "VIEW_ITEMS",
                { queryOptions: { select: "-refObject" } }
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
            if (d["classeFaq"])
              d["classeFaq"] =
                result[0].find(
                  (item) => item._id == (d["classeFaq"]._id || d["classeFaq"])
                ) || d["classeFaq"];
            if (d["refResponsable"])
              d["refResponsable"] =
                result[1].find(
                  (item) =>
                    item._id == (d["refResponsable"]._id || d["refResponsable"])
                ) || d["refResponsable"];
          });
        } else {
          if (doc["classeFaq"])
            doc["classeFaq"] =
              result[0].find(
                (item) => item._id == (doc["classeFaq"]._id || doc["classeFaq"])
              ) || doc["classeFaq"];
          if (doc["refResponsable"])
            doc["refResponsable"] =
              result[1].find(
                (item) =>
                  item._id ==
                  (doc["refResponsable"]._id || doc["refResponsable"])
              ) || doc["refResponsable"];
          if (doc["etats"] && doc["etats"].length)
            doc["etats"] = doc["etats"].map(
              (d) =>
                (d = result[2].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["objetsAssocies"] && doc["objetsAssocies"].length)
            doc["objetsAssocies"] = doc["objetsAssocies"].map(
              (d) =>
                (d = result[3].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
faqSchema.post(/find.*|save/, async function (doc, next) {
  try {
    if (doc) {
      await distantRequest(doc);
      next();
    }
  } catch (err) {
    next(err);
  }
});

faqSchema.post("save", async function (doc, next) {
  try {
    if (doc.objetsConcernes.length == 1) {
      if (doc.objetsConcernes[0].typeObjet.toLowerCase().includes("demarche")) {
        /*comment publish `${doc.objetsConcernes[0].typeObjet.toUpperCase()}_ADMIN_KEY`*/
      } else if (
        doc.objetsConcernes[0].typeObjet
          .toLowerCase()
          .includes("packabonnement")
      ) {
        /*comment publish `${doc.objetsConcernes[0].typeObjet.toUpperCase()}_ADMIN_KEY`*/
      } else {
        /*comment publish `${doc.objetsConcernes[0].typeObjet.toUpperCase()}_ADMIN_KEY`*/
      }
    }
    //comment ADMIN_QUEUE

    //#region new save bloc
    if (doc.etats.length)
      publishUpdate("update_items", doc.etats, ETATOBJET_ADMIN_QUEUE, {
        operation: "$set",
        body: { refObject: doc._id, typeObject: "FAQ_FAQ" },
      });
    if (doc.objetsAssocies.length)
      publishUpdate(
        "update_items",
        doc.objetsAssocies,
        OBJETASSOCIEE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: { refObjet: doc._id, typeObjetConcerne: "FAQ_FAQ" },
        }
      );

    if (doc.objetsConcernes.length) {
      let data = GroupBy(doc.objetsConcernes, "typeObjet");
      for (let item of Object.keys(data)) {
        if (item) {
          let body;
          let key;
          if (item.toLowerCase() == "demarche_demarcheprocedure") {
            key = DEMARCHE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { faq: doc._id } };
          } else if (item.toLowerCase() == "agendaevent_event") {
            key = AGENDAEVENT_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { faq: doc._id } };
          } else if (item.toLowerCase() == "actioncitoyenne_actioncitoyenne") {
            key = ACTIONCITOYENNE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { faq: doc._id } };
          } else if (item.toLowerCase() == "operationtroc_operationtroc") {
            key = OPERATIONTROC_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { faqAnnonce: doc._id } };
          } else if (item.toLowerCase() == "packabonnement_abonnement") {
            key = PACKABONNEMENT_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { annonceFAQ: doc._id } };
          } else if (item.toLowerCase() == "portail_espacepublicitaire") {
            key = PORTAIL_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { faqPub: doc._id } };
          } else if (item.toLowerCase() == "annonce_annonceprofessionnelle") {
            key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { annoneFAQ: doc._id } };
          } else if (item.toLowerCase() == "lots_annonceprofessionnelle") {
            key = LOTS_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { annoneFAQ: doc._id } };
          } else if (item.toLowerCase() == "annonce_annonce") {
            key = ANNONCE_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { faqAnnonce: doc._id } };
          } else if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
            key = ACTEURSPRO_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { faq: doc._id },
            };
          } else if (item.toLowerCase() == "objectto_objectto") {
            key = OBJECTTO_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { faq: doc._id },
            };
          } else if (item.toLowerCase() == "produitservice_produitsetvice") {
            key = PRODUITSERVICE_ADMIN_QUEUE;
            body = {
              operation: "$addToSet",
              body: { faq: doc._id },
            };
          }
          if (body)
            publishUpdate(
              "update_items",
              data[item].map((i) => i.refObjet),
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
faqSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    this.populate(doc, populateField);

    //comment ADMIN_QUEUE

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
            if (item.toLowerCase() == "demarche_demarcheprocedure") {
              key = DEMARCHE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { faq: { $each: references[itemRef].map((d) => d._id) } },
              };
            } else if (item.toLowerCase() == "agendaevent_event") {
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { faq: { $each: references[itemRef].map((d) => d._id) } },
              };
            } else if (
              item.toLowerCase() == "actioncitoyenne_actioncitoyenne"
            ) {
              key = ACTIONCITOYENNE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: { faq: { $each: references[itemRef].map((d) => d._id) } },
              };
            } else if (item.toLowerCase() == "operationtroc_operationtroc") {
              key = OPERATIONTROC_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  faqAnnonce: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "packabonnement_abonnement") {
              key = PACKABONNEMENT_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  annonceFAQ: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "portail_espacepublicitaire") {
              key = PORTAIL_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  faqPub: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "annonce_annonceprofessionnelle") {
              key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  annoneFAQ: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "lots_annonceprofessionnelle") {
              key = LOTS_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  annoneFAQ: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "annonce_annonce") {
              key = ANNONCE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  faqAnnonce: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  faq: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "objectto_objectto") {
              key = OBJECTTO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  faq: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "produitservice_produitsetvice") {
              key = PRODUITSERVICE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  faq: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            }

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
let itemToCheck = {};

faqSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await faq.findOne(this.getQuery()).lean();

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["etats"] = doc.etats;
      itemToCheck["objetsAssocies"] = doc.objetsAssocies;
      itemToCheck["objetsConcernes"] = doc.objetsConcernes;
      //#endregion new pre find and update bloc
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
faqSchema.post("findOneAndUpdate", async function (doc, next) {
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
            if (item.toLowerCase() == "demarche_demarcheprocedure") {
              key = DEMARCHE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { faq: doc._id } };
            } else if (item.toLowerCase() == "agendaevent_event") {
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = { operation: "$pull", body: { faq: doc._id } };
            } else if (
              item.toLowerCase() == "actioncitoyenne_actioncitoyenne"
            ) {
              key = ACTIONCITOYENNE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { faq: doc._id } };
            } else if (item.toLowerCase() == "operationtroc_operationtroc") {
              key = OPERATIONTROC_ADMIN_QUEUE;
              body = { operation: "$pull", body: { faqAnnonce: doc._id } };
            } else if (item.toLowerCase() == "packabonnement_abonnement") {
              key = PACKABONNEMENT_ADMIN_QUEUE;
              body = { operation: "$pull", body: { annonceFAQ: doc._id } };
            } else if (item.toLowerCase() == "portail_espacepublicitaire") {
              key = PORTAIL_ADMIN_QUEUE;
              body = { operation: "$pull", body: { faqPub: doc._id } };
            } else if (item.toLowerCase() == "annonce_annonceprofessionnelle") {
              key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { annoneFAQ: doc._id } };
            } else if (item.toLowerCase() == "lots_annonceprofessionnelle") {
              key = LOTS_ADMIN_QUEUE;
              body = { operation: "$pull", body: { annoneFAQ: doc._id } };
            } else if (item.toLowerCase() == "annonce_annonce") {
              key = ANNONCE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { faqAnnonce: doc._id } };
            } else if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$pull", body: { faq: doc._id } };
            } else if (item.toLowerCase() == "objectto_objectto") {
              key = OBJECTTO_ADMIN_QUEUE;
              body = {
                operation: "$pull",
                body: {
                  faq: doc._id,
                },
              };
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
            if (item.toLowerCase() == "demarche_demarcheprocedure") {
              key = DEMARCHE_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { faq: doc._id } };
            } else if (item.toLowerCase() == "agendaevent_event") {
              key = AGENDAEVENT_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { faq: doc._id } };
            } else if (
              item.toLowerCase() == "actioncitoyenne_actioncitoyenne"
            ) {
              key = ACTIONCITOYENNE_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { faq: doc._id } };
            } else if (item.toLowerCase() == "operationtroc_operationtroc") {
              key = OPERATIONTROC_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { faqAnnonce: doc._id } };
            } else if (item.toLowerCase() == "packabonnement_abonnement") {
              key = PACKABONNEMENT_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { annonceFAQ: doc._id } };
            } else if (item.toLowerCase() == "portail_espacepublicitaire") {
              key = PORTAIL_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { faqPub: doc._id } };
            } else if (item.toLowerCase() == "annonce_annonceprofessionnelle") {
              key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { annoneFAQ: doc._id } };
            } else if (item.toLowerCase() == "lots_annonceprofessionnelle") {
              key = LOTS_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { annoneFAQ: doc._id } };
            } else if (item.toLowerCase() == "annonce_annonce") {
              key = ANNONCE_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { faqAnnonce: doc._id } };
            } else if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$pull", body: { faq: doc._id } };
            } else if (item.toLowerCase() == "objectto_objectto") {
              key = OBJECTTO_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  faq: doc._id,
                },
              };
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
      { oldData: itemToCheck["etats"], newData: doc.etats },
      ETATOBJET_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { refObject: doc._id, typeObject: "FAQ_FAQ" },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["objetsAssocies"], newData: doc.objetsAssocies },
      OBJETASSOCIEE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjet: null, typeObjetConcerne: null },
        bodyPush: { refObjet: doc._id, typeObjetConcerne: "FAQ_FAQ" },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    next();
  } catch (error) {
    next(error);
  }
});
faqSchema.post("updateMany", async function (docs, next) {
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
          "demarche_demarcheprocedure"
        ) {
          key = DEMARCHE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { faq: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "agendaevent_event"
        ) {
          key = AGENDAEVENT_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { faq: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "actioncitoyenne_actioncitoyenne"
        ) {
          key = ACTIONCITOYENNE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { faq: { $each: this.getQuery()?._id?.["$in"] } },
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
            body: { faqAnnonce: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "portail_espacepublicitaire"
        ) {
          key = PORTAIL_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { faqPub: { $each: this.getQuery()?._id?.["$in"] } },
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
            body: { annoneFAQ: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() ==
          "lots_annonceprofessionnelle"
        ) {
          key = LOTS_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { annoneFAQ: { $each: this.getQuery()?._id?.["$in"] } },
          };
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "annonce_annonce"
        ) {
          key = ANNONCE_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { faqAnnonce: { $each: this.getQuery()?._id?.["$in"] } },
          };
          console.log({ key, body });
        } else if (
          this._update?.[
            "$addToSet"
          ]?.objetsConcernes.typeObjet.toLowerCase() == "objectto_objectto"
        ) {
          key = OBJECTTO_ADMIN_QUEUE;
          body = {
            operation: "$addToSet",
            body: { faq: { $each: this.getQuery()?._id?.["$in"] } },
          };
          console.log({ key, body });
        }

        console.log("body", body);
        if (body)
          publishUpdate(
            "update_items",
            this._update?.["$addToSet"].objetsConcernes.refObjet,
            key,
            body
          );
      }
      //#endregion new addToSet bloc
      else if (
        this._update?.["$addToSet"]?.objetsConcernes.typeObjet.toLowerCase() ==
        "acteurspro_acteurprofessionel"
      ) {
        key = ACTEURSPRO_ADMIN_QUEUE;
        body = {
          operation: "$addToSet",
          body: { faq: { $each: this.getQuery()?._id?.["$in"] } },
        };
      } else if (
        this._update?.["$addToSet"]?.objetsConcernes.typeObjet.toLowerCase() ==
        "objectto_objectto"
      ) {
        key = OBJECTTO_ADMIN_QUEUE;
        body = {
          operation: "$addToSet",
          body: {
            faq: { $each: this.getQuery()?._id?.["$in"] },
          },
        };
      }
      if (
        this._update?.["$addToSet"].objetsConcernes.typeObjet
          .toLowerCase()
          .includes("demarche")
      ) {
        /*comment publish `${this._update?.[
            "$addToSet"
          ].objetsConcernes.typeObjet.toUpperCase()}_ADMIN_KEY`*/
      } //bloc refactor updateMany addToSet m0
      else if (
        this._update?.["$addToSet"]?.objetsConcernes.typeObjet
          .toLowerCase()
          .includes("packabonnement") &&
        docs.modifiedCount
      )
        publishUpdate(
          "update_items",
          this._update?.["$addToSet"].objetsConcernes.refObjet,
          `${this._update?.[
            "$addToSet"
          ].objetsConcernes.typeObjet.toUpperCase()}_ADMIN_KEY`,
          {
            operation: "$addToSet",
            body: { annonceFAQ: { $each: this.getQuery()._id["$in"] } },
          }
        );
      else {
        /*comment publish `${this._update?.[
            "$addToSet"
          ].objetsConcernes.typeObjet.toUpperCase()}_ADMIN_KEY`*/
      }
    } else {
      let doc = await faq.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.etats)))],
          ETATOBJET_ADMIN_QUEUE,
          { operation: "$set", body: { etatObjet: "code-2" } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.objetsAssocies)))],
          OBJETASSOCIEE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
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
                if (item.toLowerCase() == "demarche_demarcheprocedure") {
                  key = DEMARCHE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      faq: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                }
                if (item.toLowerCase() == "acteurspro_acteurprofessionel") {
                  key = ACTEURSPRO_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      faq: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "agendaevent_event") {
                  key = AGENDAEVENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      faq: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "actioncitoyenne_actioncitoyenne"
                ) {
                  key = ACTIONCITOYENNE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      faq: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "operationtroc_operationtroc"
                ) {
                  key = OPERATIONTROC_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      faqAnnonce: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "packabonnement_abonnement") {
                  key = PACKABONNEMENT_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      annonceFAQ: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "portail_espacepublicitaire") {
                  key = PORTAIL_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      faqPub: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "annonce_annonceprofessionnelle"
                ) {
                  key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      annoneFAQ: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "lots_annonceprofessionnelle"
                ) {
                  key = LOTS_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      annoneFAQ: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "annonce_annonce") {
                  key = ANNONCE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      faqAnnonce: {
                        $in: references[itemRef].map((d) => d._id),
                      },
                    },
                  };
                } else if (item.toLowerCase() == "objectto_objectto") {
                  key = OBJECTTO_ADMIN_QUEUE;
                  body = {
                    operation: "$addToSet",
                    body: {
                      faq: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                }
                if (body) publishUpdate("update_items", itemRef, key, body);
              }
            }
          }
        }

        //#endregion new archive bloc

        // //comment ADMIN_QUEUE
        // //comment ADMIN_QUEUE
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

        let questions = [];
        doc.map((d) => {
          questions.push(...d.questions.map((v) => v._id || v));
        });
        if (questions.length) {
          promises.push(
            QuestionsFAQ.updateMany(
              { _id: { $in: questions } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let questions = [];

        doc.map((d) => {
          questions.push(...d.questions.map((v) => v._id || v));
        });
        if (questions.length) {
          promises.push(
            QuestionsFAQ.updateMany(
              { _id: { $in: questions } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
      } else if (this._update?.["$pull"]?.["objetsConcernes"]) {
        /*comment publish `${this._update?.["$pull"]["objetsConcernes"][
            "typeObjetConcerne"
          ].toUpperCase()}_ADMIN_KEY`*/
      }

      if (this._update?.["$pull"]) {
        if (this._update?.["$pull"].objetsConcernes) {
          let body;
          let key;
          if (this._update?.["$pull"].objetsConcernes.typeObjet) {
            switch (this._update?.["$pull"].objetsConcernes.typeObjet) {
              case "ANNONCE_ANNONCEPROFESSIONNELLE":
                key = ANNONCEPROFESSIONNELLE_ADMIN_QUEUE;
                body = { annoneFAQ: this.getQuery()._id };
                break;
              case "ANNONCE_ANNONCE":
                key = ANNONCE_ADMIN_QUEUE;
                body = { faqAnnonce: this.getQuery()._id };
                break;
              case "LOTS_ANNONCEPROFESSIONNELLE":
                key = LOTS_ADMIN_QUEUE;
                body = { annoneFAQ: this.getQuery()._id };
                break;
              case "AGENDAEVENT_EVENT":
                key = AGENDAEVENT_ADMIN_QUEUE;
                body = { faq: this.getQuery()._id };
                break;
              case "ACTEURSPRO_ACTEURPROFESSIONEL":
                key = ACTEURSPRO_ADMIN_QUEUE;
                body = { faq: this.getQuery()._id };
                break;
              case "OPERATIONTROC_OPERATIONTROC":
                key = OPERATIONTROC_ADMIN_QUEUE;
                body = { faqAnnonce: this.getQuery()._id };
                break;
              case "OBJECTTO_OBJECTTO":
                key = OBJECTTO_ADMIN_QUEUE;
                body = { faq: this.getQuery()._id };
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
      }

      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
faqSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await faq.find(this.getQuery()).lean();
    const promises = [];
    let questions = [];
    doc.map((d) => {
      questions.push(...d.questions.map((v) => v._id || v));
    });
    if (questions.length) {
      promises.push(
        QuestionsFAQ.deleteMany({ _id: { $in: questions } }).exec()
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
            await PublishMessage(FAQ_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            if (doc.imageRepresentative) files.push(doc.imageRepresentative);

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          console.log("doc", doc);

          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(FAQ_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(FAQ_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            let files = [];
            if (doc.imageRepresentative) files.push(doc.imageRepresentative);
            copyFiles(files);
            if (doc?.questions?.length) {
              PublishQuestionsFAQ(doc.questions);
            }
            //#region new publish bloc
            if (doc.etats.length)
              publishUpdate("publish_data", doc.etats, ETATOBJET_ADMIN_QUEUE);
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
          await PublishMessage(FAQ_CLIENT_QUEUE, {
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
    console.error("faq communicateWithClient error==>", error);
  }
}

//add other hooks here
const faq = mongoose.model("faq", faqSchema);
module.exports = faq;
const QuestionsFAQ = require("../models/questionsFAQ.model");

const {
  PublishData: PublishQuestionsFAQ,
} = require("./repositories/questionsFAQ.repositorie");

const { PublishMessage } = require("../helpers/communications");
const {
  getDataByPath,
  sendRPCRequest,
  publishUpdate,
  getDiffArray,
  copyFiles,
  removeFiles,
  flatDeep,
  GroupBy,
} = require("../helpers/helpers");

const {
  TAXONOMIE_ADMIN_RPC,
  MEMBRE_ADMIN_RPC,
  ETATOBJET_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  ETATOBJET_ADMIN_QUEUE,
  OBJETASSOCIEE_ADMIN_QUEUE,
  DEMARCHE_ADMIN_QUEUE,
  AGENDAEVENT_ADMIN_QUEUE,
  ACTIONCITOYENNE_ADMIN_QUEUE,
  OPERATIONTROC_ADMIN_QUEUE,
  PACKABONNEMENT_ADMIN_QUEUE,
  PORTAIL_ADMIN_QUEUE,
  ANNONCE_ADMIN_QUEUE,
  LOTS_ADMIN_QUEUE,
  FAQ_CLIENT_QUEUE,
  ANNONCEPROFESSIONNELLE_ADMIN_QUEUE,
  ACTEURSPRO_ADMIN_QUEUE,
  OBJECTTO_ADMIN_QUEUE,
  PRODUITSERVICE_ADMIN_QUEUE,
} = require("../config");
