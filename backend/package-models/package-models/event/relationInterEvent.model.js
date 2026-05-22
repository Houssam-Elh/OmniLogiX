const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
let relationInterEventSchema = new Schema(
  {
    etatObjet: { type: String, default: "code-1" },
    typeRelation: {
      type: String,
      required: true,
      enum: ["code_8522", "code_8530"],
    },
    agendaEventParent: { type: Schema.Types.ObjectId, ref: "agendaEvent" },
    agendaEventAssocie: [{ type: Schema.Types.ObjectId, ref: "agendaEvent" }],
  },
  { timestamps: true }
);

//  autoPopulate hook

relationInterEventSchema.pre("aggregate", function (next) {
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
relationInterEventSchema.pre(/find.*/, function (next) {
  try {
    this.populate([
      {
        path: "agendaEventAssocie",
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

relationInterEventSchema.post("save", async function (doc, next) {
  try {
    if (this.agendaEventParent) {
      await AgendaEvent.updateOne(
        { _id: this.agendaEventParent.toString() },
        { $addToSet: { relationInterEventAssocie: this._id } }
      );
    }
    if (this.agendaEventAssocie && this.agendaEventAssocie.length) {
      await AgendaEvent.updateMany(
        { _id: this.agendaEventAssocie.map((m) => m._id) },
        { $set: { relationInterEventParent: this._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});
//rewrite insertMany
relationInterEventSchema.post("insertMany", async function (doc, next) {
  try {
    let agendaEventParent = GroupBy(doc, "agendaEventParent");
    for (let item of Object.keys(agendaEventParent)) {
      if (item)
        await AgendaEvent.updateOne(
          { _id: item.toString() },
          {
            $addToSet: {
              relationInterEventAssocie: {
                $each: agendaEventParent[item].map((d) => d._id),
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
relationInterEventSchema.pre("findOneAndUpdate", async function (next) {
  try {
    let doc = await relationInterEvent.findOne(this.getQuery()).lean();
    if (doc) {
      prevState = doc?.etatDePublication;
      communicateWithClient(
        "preFindOneAndUpdate",
        doc,
        prevState,
        this._update["$set"].etatDePublication
      );
      const agendaEventParentId = this._update?.["$set"]?.agendaEventParent;
      if (
        doc?.agendaEventParent != agendaEventParentId &&
        doc?.agendaEventParent != undefined
      )
        await AgendaEvent.updateOne(
          { _id: doc.agendaEventParent.toString() },
          { $pull: { relationInterEventAssocie: doc._id } }
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
relationInterEventSchema.post("findOneAndUpdate", async function (doc, next) {
  try {
    communicateWithClient("postFindOneAndUpdate", doc, prevState);

    if (doc.agendaEventParent)
      await AgendaEvent.updateOne(
        {
          _id: doc.agendaEventParent?._id?.toString() || doc.agendaEventParent,
        },
        { $addToSet: { relationInterEventAssocie: doc._id } }
      );
    next();
  } catch (error) {
    next(error);
  }
});
relationInterEventSchema.post("updateMany", async function (docs, next) {
  try {
    if (this._update?.["$addToSet"] && this.getQuery()?._id?.["$in"]?.length) {
    } else {
      let doc = await relationInterEvent.find(this.getQuery()).lean();
      const promises = [];
      if (this._update?.["$set"]?.etatObjet?.includes("code-2")) {
        communicateWithClient("postUpdateMany", this.getQuery());

        let agendaEventAssocie = [];
        doc.map((d) => {
          agendaEventAssocie.push(
            ...d.agendaEventAssocie.map((v) => v._id || v)
          );
        });
        if (agendaEventAssocie.length) {
          promises.push(
            AgendaEvent.updateMany(
              { _id: { $in: agendaEventAssocie } },
              { $set: { etatObjet: "code-2" } }
            ).exec()
          );
        }
      } else if (
        Object.keys(this._update?.["$set"]).length == 1 &&
        this._update?.["$set"]?.etatObjet?.includes("code-1")
      ) {
        let agendaEventAssocie = [];

        doc.map((d) => {
          agendaEventAssocie.push(
            ...d.agendaEventAssocie.map((v) => v._id || v)
          );
        });
        if (agendaEventAssocie.length) {
          promises.push(
            AgendaEvent.updateMany(
              { _id: { $in: agendaEventAssocie } },
              { $set: { etatObjet: "code-1" } }
            ).exec()
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
relationInterEventSchema.post("deleteMany", async function (docs, next) {
  try {
    let doc = await relationInterEvent.find(this.getQuery()).lean();
    const promises = [];
    let agendaEventAssocie = [];
    doc.map((d) => {
      agendaEventAssocie.push(...d.agendaEventAssocie.map((v) => v._id || v));
    });
    if (agendaEventAssocie.length) {
      promises.push(
        AgendaEvent.deleteMany({ _id: { $in: agendaEventAssocie } }).exec()
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
            await PublishMessage(RELATIONINTEREVENT_CLIENT_QUEUE, {
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
            await PublishMessage(RELATIONINTEREVENT_CLIENT_QUEUE, {
              operation: "UPDATE_ITEM",
              data: { req: { params: { id: doc._id }, body: doc } },
            });
          } else if (doc?.etatDePublication == "code_3417") {
            await PublishMessage(RELATIONINTEREVENT_CLIENT_QUEUE, {
              operation: "ADD_ITEM",
              data: { req: { body: doc } },
            });
          }
          if (doc && doc.etatDePublication == "code_3417") {
            if (doc?.agendaEventAssocie?.length) {
              PublishAgendaEvent(doc.agendaEventAssocie);
            }
          }
          return;
        case "postUpdateMany":
          await PublishMessage(RELATIONINTEREVENT_CLIENT_QUEUE, {
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
    console.error("relationInterEvent communicateWithClient error==>", error);
  }
}
//add other hooks here
const relationInterEvent = mongoose.model(
  "relationInterEvent",
  relationInterEventSchema
);
module.exports = relationInterEvent;
const AgendaEvent = require("../models/agendaEvent.model");

const { GroupBy } = require("../helpers/helpers");

const { PublishMessage } = require("../helpers/communications");
const { RELATIONINTEREVENT_CLIENT_QUEUE } = require("../config");
const {
  PublishData: PublishAgendaEvent,
} = require("./repositories/agendaEvent.repositorie");
