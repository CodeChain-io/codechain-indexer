import * as fs from "fs";
import * as _ from "lodash";
import * as path from "path";
import * as Sequelize from "sequelize";
import { IndexerConfig } from "../config";
import { AccountAttribtue, AccountInstance } from "./account";
import { ActionAttribute, ActionInstance } from "./action";
import { AssetDecomposeInputInstance } from "./assetdecomposeinput";
import {
    AssetMintOutputAttribute,
    AssetMintOutputInstance
} from "./assetmintoutput";
import { AssetSchemeAttribute, AssetSchemeInstance } from "./assetscheme";
import { AssetTransferBurnInstance } from "./assettransferburn";
import { AssetTransferInputInstance } from "./assettransferinput";
import {
    AssetTransferOutputAttribute,
    AssetTransferOutputInstance
} from "./assettransferoutput";
import { BlockAttribute, BlockInstance } from "./block";
import { ParcelAttribute, ParcelInstance } from "./parcel";
import {
    SnapshotRequestAttribute,
    SnapshotRequestInstance
} from "./snapshotrequest";
import {
    AssetTransferInputAttribute,
    TransactionAttribute,
    TransactionInstance
} from "./transaction";
import { UTXOAttribute, UTXOInstance } from "./utxo";
import { UTXOSnapshotAttribute, UTXOSnapshotInstance } from "./utxosnapshot";

const basename = path.basename(__filename);
process.env.NODE_ENV = process.env.NODE_ENV || "dev";
const { pg, sequelize: options } = require("config") as IndexerConfig;

const sequelize = new Sequelize(pg.database!, pg.user!, pg.password!, options);

const models: any = {};

fs.readdirSync(__dirname)
    .filter(file => {
        const extension = _.includes(["dev", "test"], process.env.NODE_ENV)
            ? ".ts"
            : ".js";
        return (
            file.indexOf(".") !== 0 &&
            file !== basename &&
            file.slice(-3) === extension
        );
    })
    .forEach(file => {
        const model = sequelize.import(path.join(__dirname, file));
        models[(model as any).name] = model;
    });

Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = sequelize;

interface DB {
    sequelize: Sequelize.Sequelize;
    Sequelize: Sequelize.SequelizeStatic;
    Block: Sequelize.Model<BlockInstance, BlockAttribute>;
    Parcel: Sequelize.Model<ParcelInstance, ParcelAttribute>;
    Action: Sequelize.Model<ActionInstance, ActionAttribute>;
    Transaction: Sequelize.Model<TransactionInstance, TransactionAttribute>;
    AssetScheme: Sequelize.Model<AssetSchemeInstance, AssetSchemeAttribute>;
    Account: Sequelize.Model<AccountInstance, AccountAttribtue>;
    UTXO: Sequelize.Model<UTXOInstance, UTXOAttribute>;
    AssetMintOutput: Sequelize.Model<
        AssetMintOutputInstance,
        AssetMintOutputAttribute
    >;
    AssetTransferInput: Sequelize.Model<
        AssetTransferInputInstance,
        AssetTransferInputAttribute
    >;
    AssetTransferOutput: Sequelize.Model<
        AssetTransferOutputInstance,
        AssetTransferOutputAttribute
    >;
    AssetTransferBurn: Sequelize.Model<
        AssetTransferBurnInstance,
        AssetTransferInputAttribute
    >;
    AssetDecomposeInput: Sequelize.Model<
        AssetDecomposeInputInstance,
        AssetTransferInputAttribute
    >;
    SnapshotRequest: Sequelize.Model<
        SnapshotRequestInstance,
        SnapshotRequestAttribute
    >;
    UTXOSnapshot: Sequelize.Model<UTXOSnapshotInstance, UTXOSnapshotAttribute>;
}

export default models as DB;
