const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let codageProduitSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    typecodage: {
      type: String,
      required: true,
      enum: ["code_3353", "code_8417"],
    },
    imageAssocie: { type: String },
    codeOuFrequenceAssocie: { type: String },
    produitAssocie: { type: Schema.Types.ObjectId, ref: "produitService" },
    instanceActeurAssocie: [{ type: Schema.Types.ObjectId }],
    indicationDuStockAssocie: { type: ObjectId },
  },
  { timestamps: true }
);

//  autoPopulate hook

codageProduitSchema.pre("aggregate", function (next) {
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
codageProduitSchema.pre(/find.*/, function (next) {
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
              INSTANCEACTEURASSOCIE_ADMIN_RPC,
              ["instanceActeurAssocie"],
              "VIEW_ITEMS",
              { queryOptions: { select: "-referenceObjetConcerne" } }
            ),
          ]
      ).then((result) => {
        if (doc instanceof Array) {
          doc.map((d) => { });
        } else {
          if (
            doc["instanceActeurAssocie"] &&
            doc["instanceActeurAssocie"].length
          )
            doc["instanceActeurAssocie"] = doc["instanceActeurAssocie"].map(
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
codageProduitSchema.post(/find.*|save/, async function (doc) {
  try {
    await distantRequest(doc);
  } catch (error) {
    console.error(
      "error while getting distant data for model codageProduit==>",
      error
    );
  }
});

codageProduitSchema.post("save", async function (doc, next) {
  try {
    if (this.produitAssocie) {
      await ProduitService.updateOne(
        { _id: this.produitAssocie.toString() },
        { $addToSet: { codageProduitAssocie: this._id } }
      );
    }

    if (doc.instanceActeurAssocie.length)
      publishUpdate(
        "update_items",
        doc.instanceActeurAssocie,
        INSTANCEACTEURASSOCIE_ADMIN_QUEUE,
        {
          operation: "$set",
          body: {
            referenceObjetConcerne: doc._id,
            typeObjetConcerne: "CODAGEPRODUIT_PRODUITSETVICE",
          },
        }
      );

    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
codageProduitSchema.post("insertMany", async function (doc, next) {
  try {
    let produitAssocie = GroupBy(doc, "produitAssocie");
    for (let item of Object.keys(produitAssocie)) {
      if (item)
        await ProduitService.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              codageProduitAssocie: {
                $each: produitAssocie[item].map((d) => d._id),
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

codageProduitSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await codageProduit.findOne(this.getQuery()).lean();

    if (doc) {
      itemToCheck["instanceActeurAssocie"] = doc.instanceActeurAssocie;
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );

      const produitAssocieId = this._update?.["$set"]?.produitAssocie;
      if (
        produitAssocieId &&
        doc?.produitAssocie != produitAssocieId &&
        doc?.produitAssocie != undefined
      )
        await ProduitService.updateOne(
          { _id: doc.produitAssocie.toString() },
          { $pull: { codageProduitAssocie: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
codageProduitSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    publishUpdate(
      "pullAndPush",
      {
        oldData: itemToCheck["instanceActeurAssocie"],
        newData: doc.instanceActeurAssocie,
      },
      INSTANCEACTEURASSOCIE_ADMIN_QUEUE,
      {
        operation: "$set",
        bodyPull: { referenceObjetConcerne: null, typeObjetConcerne: null },
        bodyPush: {
          referenceObjetConcerne: doc._id,
          typeObjetConcerne: "CODAGEPRODUIT_PRODUITSETVICE",
        },
      }
    );
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.produitAssocie)
      await ProduitService.updateOne(
        { _id: doc.produitAssocie?._id?.toString() || doc.produitAssocie },
        { $addToSet: { codageProduitAssocie: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
codageProduitSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await codageProduit.find(this.getQuery()).lean();
      const promises = [];
      if (
        this._update?.["$set"]?.etatObjet?.includes("code-2") &&
        docs.modifiedCount /*new modifCount*/
      ) {
        publishUpdate(
          "update_items",
          [...new Set(flatDeep(doc.map((d) => d.instanceActeurAssocie)))],
          INSTANCEACTEURASSOCIE_ADMIN_QUEUE,
          {
            operation: "$set",
            body: { etatObjet: "code-2" },
          }
        );

        let files = [];

        doc.map((d) => {
          if (d.imageAssocie) files.push(d.imageAssocie);
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

      if (promises.length) await Promise.all(promises);
    }
    next();
  } catch (error) {
    next(error);
  }
});
codageProduitSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await codageProduit.find(this.getQuery()).lean();
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
            await PublishMessage(CODAGEPRODUIT_CLIENT_QUEUE, {
              operation: "REMOVE_ITEMS",
              data: { condition: { _id: { $in: [doc._id] } } },
            });
            let files = [];
            // doc.map((d)=>{
            if (doc.imageAssocie) files.push(doc.imageAssocie);
            //})

            removeFiles(files);
          }
          return;
        case "postFindOneAndUpdate":
          if (
            prevState == doc.etatDePublication &&
            doc.etatDePublication == "code_3417"
          ) {
            await PublishMessage(CODAGEPRODUIT_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(CODAGEPRODUIT_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
            let files = [];
            //doc.map((d)=>{
            if (doc.imageAssocie) files.push(doc.imageAssocie);
            //})
            copyFiles(files);
          }
          if (doc.instanceActeurAssocie.length)
            publishUpdate(
              "publish_data",
              doc.instanceActeurAssocie,
              INSTANCEACTEURASSOCIE_ADMIN_QUEUE
            );

          return;
        case "postUpdateMany":
          await PublishMessage(CODAGEPRODUIT_CLIENT_QUEUE, {
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
    console.error("codageProduit communicateWithClient error==>", error);
  }
}
//add other hooks here
const codageProduit = mongoose.model("codageProduit", codageProduitSchema);
module.exports = codageProduit;
const ProduitService = require("../models/produitService.model");


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
  INSTANCEACTEURASSOCIE_ADMIN_RPC,
  INSTANCEACTEURASSOCIE_ADMIN_QUEUE,
} = require("../config");

const { CODAGEPRODUIT_CLIENT_QUEUE } = require("../config");
