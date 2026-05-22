const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let postArticleSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    codeArticle: { type: String, required: true, unique: true },
    typeAuteur: {
      type: [String],
      required: true,
      enum: ["code_2522", "code_2521"],
    },
    classificationArticle: { type: Schema.Types.ObjectId, required: true },
    translations: {
      type: [
        {
          language: { type: String },
          titreArticle: { type: String, required: true },
          sousTitreArticle: { type: String },
          resumeArticle: { type: String, required: true },
          contenuArticle: { type: String },
          etiquetteAffichage: { type: String },
        },
      ],
      required: true,
    },
    typeContenu: {
      type: String,
      required: true,
      enum: ["code_6959", "code_6960"],
    },
    photoArticle: { type: String },
    dateCreationArticle: { type: Date, required: true },
    datePublication: { type: Date },
    dateArret: { type: Date },
    causeArret: { type: String, enum: ["code_6961", "code_6962", null] },
    auteurArret: { type: Schema.Types.ObjectId },
    telechargeable: { type: Boolean, required: true },
    partageable: { type: Boolean, required: true },
    enregistrable: { type: Boolean, required: true },
    langueParDefaut: { type: Schema.Types.ObjectId, required: true },
    provenonceInterne: {
      type: String,
      required: true,
      enum: ["code_211", "code_212"],
    },
    payant: { type: Boolean, required: true },
    droitLibre: { type: Boolean, required: true },
    publicationAutorise: { type: Boolean, required: true, default: true },
    preuveAutorisation: { type: String },
    dateEnregistrement: { type: Date, required: true },
    dateValidation: { type: Date },
    etatDePublication: {
      type: String,
      required: true,
      enum: [
        "code_3209",
        "code_541",
        "code_3516",
        "code_3417",
        "code_225",
        "code_226",
        "code_6963",
      ],
    },
    sections: [{ type: Schema.Types.ObjectId, ref: "section" }],
    documentsgeneres: [{ type: Schema.Types.ObjectId, ref: "documentGenere" }],
    demandesArretPublication: [
      { type: Schema.Types.ObjectId, ref: "demandeArretPublication" },
    ],
    relationInterArticle: [
      { type: Schema.Types.ObjectId, ref: "relationInterArticle" },
    ],
    relationParent: {
      type: Schema.Types.ObjectId,
      ref: "relationInterArticle",
    },
    rubriques: [{ type: Schema.Types.ObjectId, ref: "rubrique" }],
    motscles: [{ type: Schema.Types.ObjectId, ref: "motcles" }],
    personneAuteur: [{ type: Schema.Types.ObjectId }],
    organisationAuteur: [{ type: Schema.Types.ObjectId }],
    etatObject: [{ type: Schema.Types.ObjectId }],
    statistiquesDirectes: [{ type: Schema.Types.ObjectId }],
    referenceEtDocumentsAppuis: { type: [ObjectId] },
    objetsAssoccies: [{ type: Schema.Types.ObjectId }],
    blog: [{ type: Schema.Types.ObjectId }],

    //#region new attribut declaration
    referenceDocumentAppuisPreuve: [{ type: Schema.Types.ObjectId }],
    objetsConcernes: {
      type: [
        {
          refObjet: { type: Schema.Types.ObjectId },
          typeObjet: { type: String },
          _id : false
        },
      ],
    },
    articleInformationnel : { type: Boolean , default: false }
    //#endregion
  },
  { timestamps: true }
);

//  autoPopulate hook

postArticleSchema.pre("aggregate", function (next) {
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
postArticleSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      {
        path: "classificationArticle",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "auteurArret", match: { etatObjet: "code-1" }, populate: [] },
      { path: "langueParDefaut", match: { etatObjet: "code-1" }, populate: [] },
      { path: "sections", match: { etatObjet: "code-1" }, populate: [] },
      {
        path: "documentsgeneres",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "demandesArretPublication",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      {
        path: "relationInterArticle",
        match: { etatObjet: "code-1" },
        populate: [],
      },
      { path: "motscles", match: { etatObjet: "code-1" }, populate: [] },
      { path: "rubriques", match: { etatObjet: "code-1" }, populate: [] },
    ]);
    next();
  } catch (error) {
    next(error);
  }
});

// hooks
async function distantRequest(doc) {
  try {
    if (doc) {
      await Promise.all(
        doc instanceof Array
          ? [
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["classificationArticle", "langueParDefaut"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              COMPTEUSER_ADMIN_RPC,
              ["auteurArret"],
              "VIEW_ITEMS",
              {}
            ),
          ]
          : [
            sendRPCRequest(
              doc,
              TAXONOMIE_ADMIN_RPC,
              ["classificationArticle", "langueParDefaut"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              COMPTEUSER_ADMIN_RPC,
              ["auteurArret"],
              "VIEW_ITEMS",
              {}
            ),
            sendRPCRequest(
              doc,
              ETATOBJET_ADMIN_RPC,
              ["etatObject"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObject" } }
            ),
            sendRPCRequest(
              doc,
              STATISTIQUESDIRECTES_ADMIN_RPC,
              ["statistiquesDirectes"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObjetConcerne" } }
            ),
            sendRPCRequest(
              doc,
              DOCUMENTREFERENCE_ADMIN_RPC,
              ["referenceDocumentAppuisPreuve"],
              "VIEW_ITEMS",
              {
                queryOptions: {
                  select:
                    "-statistiquesDirectes -contenuMMedia -etats -objetsConcernes -objetsAssocies -moments",
                },
              }
            ),
            sendRPCRequest(
              doc,
              OBJETASSOCIEE_ADMIN_RPC,
              ["objetsAssoccies"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-refObjet" } }
            ),
            sendRPCRequest(
              doc,
              AUTEUR_ADMIN_RPC,
              ["personneAuteur"],
              "VIEW_ITEMS",
              {
                queryOptions: {
                  select:
                    "-articles -objetsAssocies",
                },
              }
            ),
            sendRPCRequest(
              doc,
              ORGANISATION_ADMIN_RPC,
              ["organisationAuteur"],
              "VIEW_ITEMS",
              {
                queryOptions: {
                  select:
                    "-articles -cordonneeGeo -objetsAssocies",
                },
              }
            ),

          ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["classificationArticle"])
              d["classificationArticle"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["classificationArticle"]._id ||
                      d["classificationArticle"])
                ) || d["classificationArticle"];
            if (d["langueParDefaut"])
              d["langueParDefaut"] =
                result[0].find(
                  (item) =>
                    item._id ==
                    (d["langueParDefaut"]._id || d["langueParDefaut"])
                ) || d["langueParDefaut"];
            if (d["auteurArret"])
              d["auteurArret"] =
                result[1].find(
                  (item) =>
                    item._id == (d["auteurArret"]._id || d["auteurArret"])
                ) || d["auteurArret"];
          });
        } else {
          if (doc["classificationArticle"])
            doc["classificationArticle"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["classificationArticle"]._id ||
                    doc["classificationArticle"])
              ) || doc["classificationArticle"];
          if (doc["langueParDefaut"])
            doc["langueParDefaut"] =
              result[0].find(
                (item) =>
                  item._id ==
                  (doc["langueParDefaut"]._id || doc["langueParDefaut"])
              ) || doc["langueParDefaut"];
          if (doc["auteurArret"])
            doc["auteurArret"] =
              result[1].find(
                (item) =>
                  item._id == (doc["auteurArret"]._id || doc["auteurArret"])
              ) || doc["auteurArret"];
          if (doc["etatObject"] && doc["etatObject"].length)
            doc["etatObject"] = doc["etatObject"].map(
              (d) =>
                (d = result[2].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["statistiquesDirectes"] && doc["statistiquesDirectes"].length)
            doc["statistiquesDirectes"] = doc["statistiquesDirectes"].map(
              (d) =>
                (d = result[3].find((item) => item._id == (d._id || d)) || d)
            );
          if (
            doc["referenceDocumentAppuisPreuve"] &&
            doc["referenceDocumentAppuisPreuve"].length
          )
            doc["referenceDocumentAppuisPreuve"] = doc[
              "referenceDocumentAppuisPreuve"
            ].map(
              (d) =>
                (d = result[4].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["objetsAssoccies"] && doc["objetsAssoccies"].length)
            doc["objetsAssoccies"] = doc["objetsAssoccies"].map(
              (d) =>
                (d = result[5].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["personneAuteur"] && doc["personneAuteur"].length)
            doc["personneAuteur"] = doc["personneAuteur"].map(
              (d) =>
                (d = result[6].find((item) => item._id == (d._id || d)) || d)
            );
          if (doc["organisationAuteur"] && doc["organisationAuteur"].length)
            doc["organisationAuteur"] = doc["organisationAuteur"].map(
              (d) =>
                (d = result[7].find((item) => item._id == (d._id || d)) || d)
            );
        }
      });
    }
  } catch (error) {
    throw new Error(error);
  }
}
postArticleSchema.post(/find.*|save/, async function (doc, next) {
  try {
    let promises = [];
    let newEtatObjet;
    let idsPost = [];
    if (doc instanceof Array) {
      for (let item of doc) {
        if (
          item.etatObjet == "code-1" &&
          item.etatDePublication != "code_3209" &&
          item.dateArret &&
          new Date(item.dateArret) < new Date()
        ) {
          item.etatDePublication = "code_3209";

          idsPost.push(item._id);
          newEtatObjet = {
            typeObject: "postArticle",
            refObject: item._id,
            typeAuteur: "code_1244",
            refEndUserAuteur: null,
            dateChangementEtat: new Date(),
            labelEtat: "code_21",
            etatPrecedent: item.etatDePublication,
            etatActuel: "code_3209",
            actif: true,
          };
          promises.push(newEtatObjet);
        }
      }
    } else if (
      doc.etatObjet == "code-1" &&
      doc.etatDePublication != "code_3209" &&
      doc.dateArret &&
      new Date(doc.dateArret) < new Date()
    ) {
      console.log("ENTRED 2");
      idsPost.push(doc._id);

      doc.etatDePublication = "code_3209";
      newEtatObjet = {
        typeObject: "postArticle",
        refObject: doc._id,
        typeAuteur: "code_1244",
        refEndUserAuteur: null,
        dateChangementEtat: new Date(),
        labelEtat: "code_21",
        etatPrecedent: doc.etatDePublication,
        etatActuel: "code_3209",
        actif: true,
      };
      promises.push(newEtatObjet);
    }

    if (idsPost.length) {
      let req = {
        body: {
          ids: idsPost,
          data: { $set: { etatDePublication: "code_3209" } },
        },
      };
      await UpdateMany(req, "");
    }

    if (promises.length) {
      let newEtatObjects = await RPCRequest(ETATOBJET_ADMIN_RPC, {
        operation: "ADD_ITEMS",
        data: {
          req: {
            body: promises,
          },
        },
      });

      if (
        !(doc instanceof Array) &&
        newEtatObjects instanceof Array &&
        newEtatObjects.length
      ) {
        doc.etatObject = [...doc.etatObject, ...newEtatObjects];
      }
    }

    await distantRequest(doc);

    next();
  } catch (err) {
    next(err);
  }
});

postArticleSchema.post("save", async function (doc, next) {
  try {
    if (this.rubriques?.length) {
      await Rubrique.updateMany(
        { _id: { $in: this.rubriques } },
        { $addToSet: { postArticle: this._id } }
      );
    }
    if (this.relationParent) {
      await RelationInterArticle.updateOne(
        { _id: this.relationParent.toString() },
        { $addToSet: { articlesAssocies: this._id } }
      );
    }

    if (doc.personneAuteur && doc.personneAuteur.length) {
      publishUpdate("update_items", doc.personneAuteur, AUTEUR_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { articles: doc._id },
      });
    }

    if (doc.organisationAuteur && doc.organisationAuteur.length) {
      publishUpdate(
        "update_items",
        doc.organisationAuteur,
        ORGANISATION_ADMIN_QUEUE,
        { operation: "$addToSet", body: { articles: doc._id } }
      );
    }

    if (doc.blog && doc.blog.length) {
      publishUpdate("update_items", doc.blog, BLOG_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { postArticle: doc._id },
      });
    }

    if (doc.rubrique && doc.rubrique.length) {
      publishUpdate("update_items", doc.blog, RUBRIQUE_ADMIN_QUEUE, {
        operation: "$addToSet",
        body: { postArticle: doc._id },
      });
    }

    if (doc.etatObject.length)
      publishUpdate("update_items", doc.etatObject, ETATOBJET_ADMIN_QUEUE, {
        operation: "$set",
        body: { refObject: doc._id, typeObject: "POSTARTICLE_ARTICLE" },
      });
    if (doc.statistiquesDirectes.length)
      publishUpdate(
        "update_items",
        doc.statistiquesDirectes,
        STATISTIQUESDIRECTES_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            refObjetConcerne: doc._id,
            typeObjetConcene: "POSTARTICLE_ARTICLE",
          },
        }
      );
    if (doc.referenceDocumentAppuisPreuve.length)
      publishUpdate(
        "update_items",
        doc.referenceDocumentAppuisPreuve,
        DOCUMENTREFERENCE_ADMIN_QUEUE,
        {
          operation: "$addToSet",
          body: {
            objetsConcernes: {
              refObjet: doc._id,
              typeObjet: "POSTARTICLE_ARTICLE",
            },
          },
        }
      );
    if (doc.objetsAssoccies.length)
      publishUpdate(
        "update_items",
        doc.objetsAssoccies,
        OBJETASSOCIEE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: { refObjet: doc._id, typeObjetConcerne: "POSTARTICLE_ARTICLE" },
        }
      );

    if (doc.objetsConcernes.length) {
      let typeObjet = GroupBy(doc.objetsConcernes, "typeObjet");
      for (let item of Object.keys(typeObjet)) {
        if (item) {
          let body;
          let key;
          if (item.toLowerCase() == "elementdossier_dossier") {
            key = ELEMENTDOSSIER_ADMIN_QUEUE;
            body = { operation: "$set", body: { article: doc._id } };
          } else if (item.toLowerCase() == "elementdossier_dossier") {
            key = ELEMENTDOSSIER_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { article: doc._id } };
          } else if (item.toLowerCase() == "medaillon_dossier") {
            key = MEDAILLON_ADMIN_QUEUE;
            body = { operation: "$set", body: { article: doc._id } };
          } else if (item.toLowerCase() == "medaillon_dossier") {
            key = MEDAILLON_ADMIN_QUEUE;
            body = { operation: "$addToSet", body: { article: doc._id } };
          }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_motdirecteur") {
            key = ACTEURSPRO_ADMIN_QUEUE;
            body = { operation: "$set", body: { motDirecteur: doc._id } };
          }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_presentation") {
            key = ACTEURSPRO_ADMIN_QUEUE;
            body = { operation: "$set", body: { presentation: doc._id } };
          }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_histoire") {
            key = ACTEURSPRO_ADMIN_QUEUE;
            body = { operation: "$set", body: { notreHistoire: doc._id } };
          }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_devise") {
            key = ACTEURSPRO_ADMIN_QUEUE;
            body = { operation: "$set", body: { notreDevise: doc._id } };
          }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_positionnement") {
            key = ACTEURSPRO_ADMIN_QUEUE;
            body = { operation: "$set", body: { notrePositionnement: doc._id } };
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
    }
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
postArticleSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);

    let relationParent = GroupBy(doc, "relationParent");
    for (let item of Object.keys(relationParent)) {
      if (item)
        await RelationInterArticle.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              articlesAssocies: {
                $each: relationParent[item].map((d) => d._id),
              },
            },
          }
        );
    }
    //#region new insert many bloc
    let personneAuteur = GroupBy(doc, "personneAuteur");
    for (let item of Object.keys(personneAuteur)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(personneAuteur[item].map((d) => d.personneAuteur))
            ),
          ],
          AUTEUR_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              articles: { $each: personneAuteur[item].map((i) => i._id) },
            },
          }
        );
    }
    let organisationAuteur = GroupBy(doc, "organisationAuteur");
    for (let item of Object.keys(organisationAuteur)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                organisationAuteur[item].map((d) => d.organisationAuteur)
              )
            ),
          ],
          ORGANISATION_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              articles: { $each: organisationAuteur[item].map((i) => i._id) },
            },
          }
        );
    }
    let referenceDocumentAppuisPreuve = GroupBy(
      doc,
      "referenceDocumentAppuisPreuve"
    );
    for (let item of Object.keys(referenceDocumentAppuisPreuve)) {
      if (item)
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(
                referenceDocumentAppuisPreuve[item].map(
                  (d) => d.referenceDocumentAppuisPreuve
                )
              )
            ),
          ],
          DOCUMENTREFERENCE_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: {
              objetsConcernes: {
                $each: referenceDocumentAppuisPreuve[item].map(
                  (i) =>
                    (i = { refObjet: i._id, typeObjet: "POSTARTICLE_ARTICLE" })
                ),
              },
            },
          }
        );
    }
    let blog = GroupBy(doc, "blog");
    for (let item of Object.keys(blog)) {
      if (item)
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(blog[item].map((d) => d.blog)))],
          BLOG_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { postArticle: { $each: blog[item].map((i) => i._id) } },
          }
        );
    }

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
            if (item.toLowerCase() == "elementdossier_dossier") {
              key = ELEMENTDOSSIER_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  article: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "medaillon_dossier") {
              key = MEDAILLON_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  article: { $each: references[itemRef].map((d) => d._id) },
                },
              };
            } else if (item.toLowerCase() == "dossierpresse_dossierpresse") {
              key = DOSSIERPRESSE_ADMIN_QUEUE;
              body = {
                operation: "$addToSet",
                body: {
                  articles: { $each: references[itemRef].map((d) => d._id) },
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
let prevState = null;
let itemToCheck = {};
postArticleSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await postArticle.findOne(this.getQuery()).lean();

    if (doc) {
      //#region new pre find and update bloc
      itemToCheck["etatObject"] = doc.etatObject;
      itemToCheck["statistiquesDirectes"] = doc.statistiquesDirectes;
      itemToCheck["referenceDocumentAppuisPreuve"] =
        doc.referenceDocumentAppuisPreuve;
      itemToCheck["objetsAssoccies"] = doc.objetsAssoccies;
      itemToCheck["objetsConcernes"] = doc.objetsConcernes;
      //#endregion new pre find and update bloc
      prevState = doc?.etatDePublication;

      const rubriquesIds = this._update?.["$set"]?.rubriques;
      if (rubriquesIds && doc?.rubriques && doc?.rubriques != rubriquesIds) {
        let ids = doc?.rubriques
          .map((item) => item._id || item)
          .filter((item) => !rubriquesIds.includes(item));
        await Rubrique.updateMany(
          { _id: { $in: ids } },
          { $pull: { postArticle: doc._id } }
        );
      }
      const relationParentId = this._update?.["$set"]?.relationParent;
      if (
        doc?.relationParent != relationParentId &&
        doc?.relationParent != undefined
      )
        await RelationInterArticle.updateOne(
          { _id: doc.relationParent.toString() },
          { $pull: { articlesAssocies: doc._id } }
        );

      itemToCheck["organisationAuteur"] = doc.organisationAuteur;
      itemToCheck["personneAuteur"] = doc.personneAuteur;
      itemToCheck["blog"] = doc.blog;
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
postArticleSchema.post("findOneAndUpdate", async function (doc, next) {
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
      console.log("🚀 ~ itemToPull.length:", itemToPull.length)
      if (itemToPull.length) {
        itemToPull = GroupBy(itemToPull, "typeObjet");
        for (let item of Object.keys(itemToPull)) {
          if (item) {
            let body;
            let key;
            if (item.toLowerCase() == "elementdossier_dossier") {
              key = ELEMENTDOSSIER_ADMIN_QUEUE;
              body = { operation: "$pull", body: { article: doc._id } };
            } else if (item.toLowerCase() == "medaillon_dossier") {
              key = MEDAILLON_ADMIN_QUEUE;
              body = { operation: "$pull", body: { article: doc._id } };
            } else if (item.toLowerCase() == "dossierpresse_dossierpresse") {
              key = DOSSIERPRESSE_ADMIN_QUEUE;
              body = { operation: "$pull", body: { articles: doc._id } };
            }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_motdirecteur") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$set", body: { motDirecteur: null } };
            }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_presentation") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$set", body: { presentation: null } };
            }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_histoire") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$set", body: { notreHistoire: null } };
            }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_devise") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$set", body: { notreDevise: null } };
            }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_positionnement") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$set", body: { notrePositionnement: null } };
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
      console.log("🚀 ~ itemToPush.length:", itemToPush.length)
      if (itemToPush.length) {
        itemToPush = GroupBy(itemToPush, "typeObjet");
        for (let item of Object.keys(itemToPush)) {
          if (item) {
            let body;
            let key;
            if (item.toLowerCase() == "elementdossier_dossier") {
              key = ELEMENTDOSSIER_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { article: doc._id } };
            } else if (item.toLowerCase() == "medaillon_dossier") {
              key = MEDAILLON_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { article: doc._id } };
            } else if (item.toLowerCase() == "dossierpresse_dossierpresse") {
              key = DOSSIERPRESSE_ADMIN_QUEUE;
              body = { operation: "$addToSet", body: { articles: doc._id } };
            }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_motdirecteur") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$set", body: { motDirecteur: doc._id } };
            }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_presentation") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$set", body: { presentation: doc._id } };
            }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_histoire") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$set", body: { notreHistoire: doc._id } };
            }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_devise") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$set", body: { notreDevise: doc._id } };
            }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_positionnement") {
              key = ACTEURSPRO_ADMIN_QUEUE;
              body = { operation: "$set", body: { notrePositionnement: doc._id } };
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
      { oldData: itemToCheck["etatObject"], newData: doc.etatObject },
      ETATOBJET_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { etatObjet: "code-2" },
        bodyPush: { refObject: doc._id, typeObject: "POSTARTICLE_ARTICLE" },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["statistiquesDirectes"],
        newData: doc.statistiquesDirectes,
      },
      STATISTIQUESDIRECTES_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjetConcerne: null, typeObjetConcene: null },
        bodyPush: {
          refObjetConcerne: doc._id,
          typeObjetConcene: "POSTARTICLE_ARTICLE",
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["referenceDocumentAppuisPreuve"],
        newData: doc.referenceDocumentAppuisPreuve,
      },
      DOCUMENTREFERENCE_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { objetsConcernes: { refObjet: doc._id } },
        bodyPush: {
          objetsConcernes: {
            refObjet: doc._id,
            typeObjet: "POSTARTICLE_ARTICLE",
          },
        },
      }
    );
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["objetsAssoccies"], newData: doc.objetsAssoccies },
      OBJETASSOCIEE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { refObjet: null, typeObjetConcerne: null },
        bodyPush: {
          refObjet: doc._id,
          typeObjetConcerne: "POSTARTICLE_ARTICLE",
        },
      }
    );
    //#endregion new post find and update bloc
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.rubriques?.length)
      await Rubrique.updateMany(
        { _id: { $in: doc.rubriques.map((d) => d._id || d) } },
        { $addToSet: { postArticle: doc._id } }
      );
    if (doc.relationParent)
      await RelationInterArticle.updateOne(
        { _id: doc.relationParent?._id?.toString() || doc.relationParent },
        { $addToSet: { articlesAssocies: doc._id } }
      );
    //bloc refactor findAndUpdate
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["organisationAuteur"],
        newData: doc.organisationAuteur,
      },
      ORGANISATION_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { articles: null },
        bodyPush: { articles: doc._id },
      }
    );
    //bloc refactor findAndUpdate
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["personneAuteur"], newData: doc.personneAuteur },
      AUTEUR_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { articles: null },
        bodyPush: { articles: doc._id },
      }
    );
    //bloc refactor findAndUpdate
    publishUpdate(
      "pullAndPush",
      { oldData: itemToCheck["blog"], newData: doc.blog },
      BLOG_ADMIN_QUEUE,
      {
        operation: "$pull",
        bodyPull: { postArticle: null },
        bodyPush: { postArticle: doc._id },
      }
    );

    next();
  } catch (error) {
    next(error);
  }
});
postArticleSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      if (this._update?.["$addToSet"].rubriques) {
        await Rubrique.updateOne(
          { _id: this._update?.["$addToSet"]?.rubriques },
          { $addToSet: { postArticle: { $each: this.getQuery()._id["$in"] } } }
        );
      }

      //bloc refactor updateMany addToSet m0
      if (
        this._update?.["$addToSet"]?.blog &&
        docs.modifiedCount /*new modifCount*/
      )
        publishUpdate(
          "update_items",
          this._update?.["$addToSet"]?.blog,
          BLOG_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { postArticle: { $each: this.getQuery()._id["$in"] } },
          }
        );

      //bloc refactor updateMany addToSet m0
      if (
        this._update?.["$addToSet"]?.personneAuteur &&
        docs.modifiedCount /*new modifCount*/
      )
        publishUpdate(
          "update_items",
          this._update?.["$addToSet"]?.personneAuteur,
          AUTEUR_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { articles: { $each: this.getQuery()._id["$in"] } },
          }
        );

      //bloc refactor updateMany addToSet m0
      if (
        this._update?.["$addToSet"]?.organisationAuteur &&
        docs.modifiedCount /*new modifCount*/
      )
        publishUpdate(
          "update_items",
          this._update?.["$addToSet"]?.organisationAuteur,
          ORGANISATION_ADMIN_QUEUE,
          {
            operation: "$addToSet",
            body: { articles: { $each: this.getQuery()._id["$in"] } },
          }
        );
    } else {
      let doc = await postArticle.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        //#region new archive bloc
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.personneAuteur)))],
          AUTEUR_ADMIN_QUEUE,
          { operation: "$pull", body: { articles: this.getQuery()._id } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.organisationAuteur)))],
          ORGANISATION_ADMIN_QUEUE,
          { operation: "$pull", body: { articles: this.getQuery()._id } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.etatObject)))],
          ETATOBJET_ADMIN_QUEUE,
          { operation: "$set", body: { etatObjet: "code-2" } }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.statistiquesDirectes)))],
          STATISTIQUESDIRECTES_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [
            ...new Set(
              flatDeep(doc.map((d) => d.referenceDocumentAppuisPreuve))
            ),
          ],
          DOCUMENTREFERENCE_ADMIN_QUEUE,
          {
            operation: "$pull",
            body: { objetsConcernes: { refObjet: this.getQuery()._id } },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.objetsAssoccies)))],
          OBJETASSOCIEE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.blog)))],
          BLOG_ADMIN_QUEUE,
          { operation: "$pull", body: { postArticle: this.getQuery()._id } }
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
                if (item.toLowerCase() == "elementdossier_dossier") {
                  key = ELEMENTDOSSIER_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      article: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (item.toLowerCase() == "medaillon_dossier") {
                  key = MEDAILLON_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      article: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                } else if (
                  item.toLowerCase() == "dossierpresse_dossierpresse"
                ) {
                  key = DOSSIERPRESSE_ADMIN_QUEUE;
                  body = {
                    operation: "$pull",
                    body: {
                      articles: { $in: references[itemRef].map((d) => d._id) },
                    },
                  };
                }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_motdirecteur") {
                  key = ACTEURSPRO_ADMIN_QUEUE;
                  body = { operation: "$set", body: { motDirecteur: null } };
                }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_presentation") {
                  key = ACTEURSPRO_ADMIN_QUEUE;
                  body = { operation: "$set", body: { presentation: null } };
                }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_histoire") {
                  key = ACTEURSPRO_ADMIN_QUEUE;
                  body = { operation: "$set", body: { notreHistoire: null } };
                }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_devise") {
                  key = ACTEURSPRO_ADMIN_QUEUE;
                  body = { operation: "$set", body: { notreDevise: null } };
                }else if (item.toLowerCase() == "acteurspro_acteurprofessionel_positionnement") {
                  key = ACTEURSPRO_ADMIN_QUEUE;
                  body = { operation: "$set", body: { notrePositionnement: null } };
                }
                if (body) publishUpdate("update_items", itemRef, key, body);
              }
            }
          }
        }

        //#endregion new archive bloc

        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        //comment ADMIN_QUEUE
        let files = [];

        doc.map((d) => {
          if (d.photoArticle) files.push(d.photoArticle);
          if (d.preuveAutorisation) files.push(d.preuveAutorisation);
        });
        communicateWithClient(
          "postUpdateMany",
          this.getQuery(),
          null,
          null,
          files
        );

        let sections = [];
        let documentsgeneres = [];
        let demandesArretPublication = [];
        let relationInterArticle = [];
        let motscles = [];
        doc.map((d) => {
          sections.push(...d.sections.map((v) => v._id || v));
          documentsgeneres.push(...d.documentsgeneres.map((v) => v._id || v));
          demandesArretPublication.push(
            ...d.demandesArretPublication.map((v) => v._id || v)
          );
          relationInterArticle.push(
            ...d.relationInterArticle.map((v) => v._id || v)
          );
          motscles.push(...d.motscles.map((v) => v._id || v));
        });
        if (sections.length) {
          promises.push(
            Section.updateMany(
              { _id: { $in: sections } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (documentsgeneres.length) {
          promises.push(
            DocumentGenere.updateMany(
              { _id: { $in: documentsgeneres } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (demandesArretPublication.length) {
          promises.push(
            DemandeArretPublication.updateMany(
              { _id: { $in: demandesArretPublication } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (relationInterArticle.length) {
          promises.push(
            RelationInterArticle.updateMany(
              { _id: { $in: relationInterArticle } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
        if (motscles.length) {
          promises.push(
            Motcles.updateMany(
              { _id: { $in: motscles } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let sections = [];
        let documentsgeneres = [];
        let demandesArretPublication = [];
        let relationInterArticle = [];
        let rubriques = [];
        let motscles = [];

        doc.map((d) => {
          sections.push(...d.sections.map((v) => v._id || v));
          documentsgeneres.push(...d.documentsgeneres.map((v) => v._id || v));
          demandesArretPublication.push(
            ...d.demandesArretPublication.map((v) => v._id || v)
          );
          relationInterArticle.push(
            ...d.relationInterArticle.map((v) => v._id || v)
          );
          rubriques.push(...d.rubriques.map((v) => v._id || v));
          motscles.push(...d.motscles.map((v) => v._id || v));
        });
        if (sections.length) {
          promises.push(
            Section.updateMany(
              { _id: { $in: sections } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (documentsgeneres.length) {
          promises.push(
            DocumentGenere.updateMany(
              { _id: { $in: documentsgeneres } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (demandesArretPublication.length) {
          promises.push(
            DemandeArretPublication.updateMany(
              { _id: { $in: demandesArretPublication } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (relationInterArticle.length) {
          promises.push(
            RelationInterArticle.updateMany(
              { _id: { $in: relationInterArticle } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (rubriques.length) {
          promises.push(
            Rubrique.updateMany(
              { _id: { $in: rubriques } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
        if (motscles.length) {
          promises.push(
            Motcles.updateMany(
              { _id: { $in: motscles } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
          );
        }
      }

      //#region new pull bloc
      if (this._update?.["$pull"]) {
        if (
          this._update?.["$pull"]?.personneAuteur &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].personneAuteur,
            AUTEUR_ADMIN_QUEUE,
            { operation: "$pull", body: { articles: this.getQuery()._id } }
          );
        if (
          this._update?.["$pull"]?.organisationAuteur &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].organisationAuteur,
            ORGANISATION_ADMIN_QUEUE,
            { operation: "$pull", body: { articles: this.getQuery()._id } }
          );
        if (
          this._update?.["$pull"]?.referenceDocumentAppuisPreuve &&
          docs.modifiedCount /*new modifCount*/
        )
          publishUpdate(
            "update_items",
            this._update?.["$pull"].referenceDocumentAppuisPreuve,
            DOCUMENTREFERENCE_ADMIN_QUEUE,
            {
              operation: "$pull",
              body: { objetsConcernes: { refObjet: this.getQuery()._id } },
            }
          );
      }
      //#endregion new pull bloc
      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
postArticleSchema.pre("deleteMany", async function (next) {
  try {
    let doc = await postArticle.find(this.getQuery()).lean();
    const promises = [];
    let sections = [];
    let documentsgeneres = [];
    let demandesArretPublication = [];
    let relationInterArticle = [];
    let motscles = [];
    doc.map((d) => {
      sections.push(...d.sections.map((v) => v._id || v));
      documentsgeneres.push(...d.documentsgeneres.map((v) => v._id || v));
      demandesArretPublication.push(
        ...d.demandesArretPublication.map((v) => v._id || v)
      );
      relationInterArticle.push(
        ...d.relationInterArticle.map((v) => v._id || v)
      );
      motscles.push(...d.motscles.map((v) => v._id || v));
    });
    if (sections.length) {
      promises.push(Section.deleteMany({ _id: { $in: sections } }).exec());
    }
    if (documentsgeneres.length) {
      promises.push(
        DocumentGenere.deleteMany({ _id: { $in: documentsgeneres } }).exec()
      );
    }
    if (demandesArretPublication.length) {
      promises.push(
        DemandeArretPublication.deleteMany({
          _id: { $in: demandesArretPublication },
        }).exec()
      );
    }
    if (relationInterArticle.length) {
      promises.push(
        RelationInterArticle.deleteMany({
          _id: { $in: relationInterArticle },
        }).exec()
      );
    }
    if (motscles.length) {
      promises.push(Motcles.deleteMany({ _id: { $in: motscles } }).exec());
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
            await PublishMessage(POSTARTICLE_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            // doc.map((d)=>{
            if (doc.photoArticle) files.push(doc.photoArticle);
            if (doc.preuveAutorisation) files.push(doc.preuveAutorisation);
            //})

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(POSTARTICLE_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(POSTARTICLE_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            let files = [];
            //doc.map((d)=>{
            if (doc.photoArticle) files.push(doc.photoArticle);
            if (doc.preuveAutorisation) files.push(doc.preuveAutorisation);
            //})
            copyFiles(files);
            if (doc?.sections?.length) {
              PublishSection(doc.sections);
            }
            if (doc?.documentsgeneres?.length) {
              PublishDocumentGenere(doc.documentsgeneres);
            }
            if (doc?.demandesArretPublication?.length) {
              PublishDemandeArretPublication(doc.demandesArretPublication);
            }
            if (doc?.relationInterArticle?.length) {
              PublishRelationInterArticle(doc.relationInterArticle);
            }
            if (doc?.rubriques?.length) {
              PublishRubrique(doc.rubriques);
            }
            if (doc?.motscles?.length) {
              PublishMotcles(doc.motscles);
            }
            //#region new publish bloc
            if (doc.personneAuteur.length)
              publishUpdate(
                "publish_data",
                doc.personneAuteur,
                AUTEUR_ADMIN_QUEUE
              );
            if (doc.organisationAuteur.length)
              publishUpdate(
                "publish_data",
                doc.organisationAuteur,
                ORGANISATION_ADMIN_QUEUE
              );
            if (doc.etatObject.length)
              publishUpdate(
                "publish_data",
                doc.etatObject,
                ETATOBJET_ADMIN_QUEUE
              );
            if (doc.statistiquesDirectes.length)
              publishUpdate(
                "publish_data",
                doc.statistiquesDirectes,
                STATISTIQUESDIRECTES_ADMIN_QUEUE
              );
            if (doc.referenceDocumentAppuisPreuve.length)
              publishUpdate(
                "publish_data",
                doc.referenceDocumentAppuisPreuve,
                DOCUMENTREFERENCE_ADMIN_QUEUE
              );
            if (doc.objetsAssoccies.length)
              publishUpdate(
                "publish_data",
                doc.objetsAssoccies,
                OBJETASSOCIEE_ADMIN_QUEUE
              );
            //#endregion new publish bloc
          }
          return;
        case "postUpdateMany":
          await PublishMessage(POSTARTICLE_CLIENT_QUEUE, {
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
    console.error("postArticle communicateWithClient error==>", error);
  }
}
//add other hooks here
const postArticle = mongoose.model("postArticle", postArticleSchema);
module.exports = postArticle;
const Section = require("../models/section.model");
const DocumentGenere = require("../models/documentGenere.model");
const DemandeArretPublication = require("../models/demandeArretPublication.model");
const RelationInterArticle = require("../models/relationInterArticle.model");
const Rubrique = require("../models/rubrique.model");
const Motcles = require("../models/motcles.model");

const {
  PublishData: PublishSection,
} = require("./repositories/section.repositorie");
const {
  PublishData: PublishDocumentGenere,
} = require("./repositories/documentGenere.repositorie");
const {
  PublishData: PublishDemandeArretPublication,
} = require("./repositories/demandeArretPublication.repositorie");
const {
  PublishData: PublishRelationInterArticle,
} = require("./repositories/relationInterArticle.repositorie");
const {
  PublishData: PublishRubrique,
} = require("./repositories/rubrique.repositorie");
const {
  PublishData: PublishMotcles,
} = require("./repositories/motcles.repositorie");

const { UpdateMany } = require("./repositories/postArticle.repositorie");

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
  COMPTEUSER_ADMIN_RPC,
  ETATOBJET_ADMIN_RPC,
  STATISTIQUESDIRECTES_ADMIN_RPC,
  DOCUMENTREFERENCE_ADMIN_RPC,
  OBJETASSOCIEE_ADMIN_RPC,
  AUTEUR_ADMIN_RPC,
  AUTEUR_ADMIN_QUEUE,
  ORGANISATION_ADMIN_RPC,
  ORGANISATION_ADMIN_QUEUE,
  ETATOBJET_ADMIN_QUEUE,
  STATISTIQUESDIRECTES_ADMIN_QUEUE,
  DOCUMENTREFERENCE_ADMIN_QUEUE,
  OBJETASSOCIEE_ADMIN_QUEUE,
  BLOG_ADMIN_RPC,
  BLOG_ADMIN_QUEUE,
  ELEMENTDOSSIER_ADMIN_QUEUE,
  MEDAILLON_ADMIN_QUEUE,
  DOSSIERPRESSE_ADMIN_QUEUE,
  POSTARTICLE_CLIENT_QUEUE,
  ACTEURSPRO_ADMIN_QUEUE,
} = require("../config");

const { RUBRIQUE_ADMIN_QUEUE } = require("../config");
