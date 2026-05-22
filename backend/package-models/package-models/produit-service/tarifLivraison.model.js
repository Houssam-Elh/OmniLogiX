const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let tarifLivraisonSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    pays: { type: Schema.Types.Mixed, required: true },
    region: { type: Schema.Types.Mixed, required: true },
    province: { type: Schema.Types.Mixed, required: true },
    ville: { type: Schema.Types.Mixed, required: true },
    commune: { type: Schema.Types.Mixed, required: false },
    quartier: { type: Schema.Types.Mixed, required: false },
    normaleOuExpress: {
      type: String,
      enum: ["code_18162", "code_18163"],
    },
    class: { type: String },
    livreursConserne: {
      type: [
        {
          refLivreur: { type: Schema.Types.ObjectId },
          valeurMin: { type: Number },
          valeurMax: { type: Number },
          typeDeMarge: { type: String, enum: ["code_1265", "code_2157", null] },
          valeurDeMarge: { type: Number },
          coutDeLivraison: { type: Number },
          dureeMin: { type: String },
          dureeMax: { type: String },
          uniteDuree: { type: String },
        },
      ],
    },
    tarifMin: { type: Number },
    tarifMax: { type: Number },
    dureeMin: { type: String },
    dureeMax: { type: String },
    uniteDuree: { type: String },

    // coutDeLivraison: { type: Number },
    // typeDeMarge: { type: String, enum: ["code_1265", "code_2157", null] },
    // valeurDeMarge: { type: Number },
    refProduit: { type: Schema.Types.ObjectId },
    monnaie: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

//  autoPopulate hook

tarifLivraisonSchema.pre(/find.*/, async function (next) {
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
      // console.log(doc[0])
      await Promise.all(
        doc instanceof Array
          ? [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                [
                  "secteursActivitees",
                  "typeCoordGeo",
                  "pays",
                  "region",
                  "province",
                  "ville",
                  "commune",
                  "quartier",
                ],
                "VIEW_ITEMS",
                {}
              ),
            ]
          : [
              sendRPCRequest(
                doc,
                TAXONOMIE_ADMIN_RPC,
                [
                  "secteursActivitees",
                  "typeCoordGeo",
                  "pays",
                  "region",
                  "province",
                  "ville",
                  "commune",
                  "quartier",
                ],
                "VIEW_ITEMS",
                {}
              ),
              sendRPCRequest(
                doc,
                LIVREUR_ADMIN_RPC,
                ["livreursConserne.refLivreur"],
                "VIEW_ITEMS",
                { queryOptions: { select: "" } }
              ),
              sendRPCRequest(
                doc,
                MONNAIE_ADMIN_RPC,
                ["monnaie"],
                "VIEW_ITEM",
                {}
              ),
            ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => {
            if (d["pays"])
              d["pays"] =
                result[0].find(
                  (item) => item._id == (d["pays"]._id || d["pays"])
                ) || d["pays"];
            if (d["region"])
              d["region"] =
                result[0].find(
                  (item) => item._id == (d["region"]._id || d["region"])
                ) || d["region"];
            if (d["province"])
              d["province"] =
                result[0].find(
                  (item) => item._id == (d["province"]._id || d["province"])
                ) || d["province"];
            if (d["ville"])
              d["ville"] =
                result[0].find(
                  (item) => item._id == (d["ville"]._id || d["ville"])
                ) || d["ville"];
            if (d["commune"])
              d["commune"] =
                result[0].find(
                  (item) => item._id == (d["commune"]._id || d["commune"])
                ) || d["commune"];
            if (d["quartier"])
              d["quartier"] =
                result[0].find(
                  (item) => item._id == (d["quartier"]._id || d["quartier"])
                ) || d["quartier"];
          });
        } else {
          if (doc["pays"])
            doc["pays"] =
              result[0].find(
                (item) => item._id == (doc["pays"]._id || doc["pays"])
              ) || doc["pays"];
          if (doc["region"])
            doc["region"] =
              result[0].find(
                (item) => item._id == (doc["region"]._id || doc["region"])
              ) || doc["region"];
          if (doc["province"])
            doc["province"] =
              result[0].find(
                (item) => item._id == (doc["province"]._id || doc["province"])
              ) || doc["province"];
          if (doc["ville"])
            doc["ville"] =
              result[0].find(
                (item) => item._id == (doc["ville"]._id || doc["ville"])
              ) || doc["ville"];
          if (doc["commune"])
            doc["commune"] =
              result[0].find(
                (item) => item._id == (doc["commune"]._id || doc["commune"])
              ) || doc["commune"];
          if (doc["quartier"])
            doc["quartier"] =
              result[0].find(
                (item) => item._id == (doc["quartier"]._id || doc["quartier"])
              ) || doc["quartier"];

          // console.log('result[1]',result[1])
          // if (doc["livreursConserne"] && doc["livreursConserne"].length) {
          //   doc["livreursConserne"] = doc["livreursConserne"].map((d) => {
          //     // Find the corresponding item in result[1]
          //     console.log('BEFORE', d.refLivreur)
          //     d.refLivreur  = result[1].find(
          //       (item) =>
          //       item._id === (d.refLivreur?._id || d.refLivreur)||d.refLivreur
          //     );
          //    console.log('d.refLivreur ',d.refLivreur?._id )
          //     return d
          //   });

          // }

          if (doc["livreursConserne"] && doc["livreursConserne"].length) {
            doc["livreursConserne"] = doc["livreursConserne"].map((d) => {
              // Extract the ID (handles both object and string formats)
              const refId =
                d.refLivreur?._id?.toString() || d.refLivreur?.toString();

              // Find matching livreur in result[1]
              const matchedLivreur = result[1].find(
                (item) => item._id.toString() === refId
              );

              // Update refLivreur if found, otherwise keep original value
              d.refLivreur = matchedLivreur || d.refLivreur;
              console.log("d.refLivreur ", d.refLivreur?._id);
              return d;
            });
          }
          if (doc["monnaie"]) doc["monnaie"] = result[2] || doc["monnaie"];
        }
      });
    }
    // console.log('in distantRequest',doc)
  } catch (error) {
    console.log("🚀 ~ distantRequest ~ error:", error);
    throw new Error(error);
  }
}

tarifLivraisonSchema.pre("aggregate", function (next) {
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
});

tarifLivraisonSchema.post(/find.*|save/, async function (doc, next) {
  try {
    await distantRequest(doc);

    next();
  } catch (err) {
    next(err);
  }
});

tarifLivraisonSchema.post("save", async function (doc, next) {
  try {
    console.log("save =====>", doc);
    if (this.refProduit) {
      await produitService.updateOne(
        { _id: this.refProduit.toString() },
        { $addToSet: { tarifLivraison: this._id } }
      );
    }
    //#enregion new save bloc
    // if (doc.livreur.length)
    //   publishUpdate(
    //     "update_items",
    //     doc.livreursConserne,
    //     LIVREUR_ADMIN_RPC,
    //     {
    //       operation: "$set",
    //       body: {
    //         tarifLivraison: doc._id,
    //       },
    //     }
    //   );
    next();
  } catch (error) {
    console.log("error", error);
    next(error);
  }
});
//rewrite insertMany
tarifLivraisonSchema.post("insertMany", async function (doc, next) {
  try {
    await distantRequest(doc);
    let refProduit = GroupBy(doc, "refProduit");
    for (let item of Object.keys(refProduit)) {
      if (item)
        await ProduitService.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              produitAssocie: { $each: refProduit[item].map((d) => d._id) },
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

tarifLivraisonSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await tarifLivraison.findOne(this.getQuery()).lean();
    if (doc) {
      itemToCheck["livreur"] = doc.livreur;
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );

      const refProduitId = this._update?.["$set"]?.refProduit;
      if (
        refProduitId &&
        doc?.refProduit != refProduitId &&
        doc?.refProduit != undefined
      )
        await produitService.updateOne(
          { _id: doc.refProduit.toString() },
          { $pull: { produitAssocie: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
tarifLivraisonSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["livreur"],
        newData: doc.livreur,
      },
      LIVREUR_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { tarifLivraison: null },
        bodyPush: {
          tarifLivraison: doc._id,
        },
      }
    );

    communicateWithClient("postFindOneAndUpdate", doc, prevState);
    if (doc.refProduit)
      await produitService.updateOne(
        { _id: doc.refProduit?._id?.toString() || doc.refProduit },
        { $addToSet: { produitAssocie: doc._id } }
      );

    next();
  } catch (error) {
    next(error);
  }
});
tarifLivraisonSchema.post("updateMany", async function (doc, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
      let files = [];
      publishUpdate(
        "update_items",
        [...new Set(flatDeep(doc.map((d) => d.livreur)))],
        LIVREUR_ADMIN_QUEUE,
        {
          operation: "$set",
          body: { etatObjet: "code-2" },
        }
      );

      doc.map((d) => {
        if (d.imageProduit) files.push(d.imageProduit);
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

    next();
  } catch (error) {
    next(error);
  }
});
tarifLivraisonSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await tarifLivraison.find(this.getQuery()).lean();
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
            targetState != "code_3417" &&
            prevState == "code_3417"
          ) {
            await PublishMessage(TARIFLIVRAISON_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            if (doc.logo) files.push(doc.logo);

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(TARIFLIVRAISON_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(TARIFLIVRAISON_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }

          return;
        case "postUpdateMany":
          await PublishMessage(TARIFLIVRAISON_CLIENT_QUEUE, {
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
    console.error(" communicateWithClient error==>", error);
  }
}
//add other hooks here
const tarifLivraison = mongoose.model("tarifLivraison", tarifLivraisonSchema);
module.exports = tarifLivraison;

const { PublishMessage } = require("../helpers/communications");

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
  LIVREUR_ADMIN_RPC,
  LIVREUR_ADMIN_QUEUE,
  MONNAIE_ADMIN_RPC,
  TAXONOMIE_ADMIN_RPC,
} = require("../config");
const produitService = require("./produitService.model");
