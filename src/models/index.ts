import * as fs from "fs";
import * as _ from "lodash";
import * as path from "path";
import * as Sequelize from "sequelize";
import { IndexerConfig } from "../config";
import { AccountAttribtue, AccountInstance } from "./account";
import { AssetImageAttribute, AssetImageInstance } from "./assetimage";
import { AssetSchemeAttribute, AssetSchemeInstance } from "./assetscheme";
import { AssetTransferBurnInstance } from "./assettransferburn";
import {
    AssetTransferInputAttribute,
    AssetTransferInputInstance
} from "./assettransferinput";
import {
    AssetTransferOutputAttribute,
    AssetTransferOutputInstance
} from "./assettransferoutput";
import { BlockAttribute, BlockInstance } from "./block";
import {
    ChangeAssetSchemeAttribute,
    ChangeAssetSchemeInstance
} from "./changeAssetScheme";
import { ComposeAssetAttribute, ComposeAssetInstance } from "./composeAsset";
import { CreateShardAttribute, CreateShardInstance } from "./createShard";
import { CustomAttribute, CustomInstance } from "./custom";
import {
    DecomposeAssetAttribute,
    DecomposeAssetInstance
} from "./decomposeAsset";
import {
    IncreaseAssetSupplyAttribute,
    IncreaseAssetSupplyInstance
} from "./increaseAssetSupply";
import { LogAttribute, LogInstance } from "./log";
import { MintAssetAttribute, MintAssetInstance } from "./mintAsset";
import { OrderAttribute, OrderInstance } from "./order";
import {
    OrderOnTransferAttribute,
    OrderOnTransferInstance
} from "./orderontransfer";
import { PayAttribute, PayInstance } from "./pay";
import { RemoveAttribute, RemoveInstance } from "./remove";
import { SetRegularKeyAttribute, SetRegularKeyInstance } from "./setRegularKey";
import {
    SetShardOwnersAttribute,
    SetShardOwnersInstance
} from "./setShardOwners";
import { SetShardUsersAttribute, SetShardUsersInstance } from "./setShardUsers";
import { StoreAttribute, StoreInstance } from "./store";
import { TransactionAttribute, TransactionInstance } from "./transaction";
import { TransferAssetAttribute, TransferAssetInstance } from "./transferAsset";
import { UnwrapCCCAttribute, UnwrapCCCInstance } from "./unwrapCCC";
import { UTXOAttribute, UTXOInstance } from "./utxo";
import { WrapCCCAttribute, WrapCCCInstance } from "./wrapCCC";

const basename = path.basename(__filename);
process.env.NODE_ENV = process.env.NODE_ENV || "dev";
const { pg, sequelize: options } = require("config") as IndexerConfig;

const sequelize = new Sequelize(pg.database!, pg.user!, pg.password!, options);

const models: any = {};

fs.readdirSync(__dirname)
    .filter(file => {
        const extension = _.includes(
            ["dev", "test", "test-int"],
            process.env.NODE_ENV
        )
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
    Transaction: Sequelize.Model<TransactionInstance, TransactionAttribute>;
    MintAsset: Sequelize.Model<MintAssetInstance, MintAssetAttribute>;
    TransferAsset: Sequelize.Model<
        TransferAssetInstance,
        TransferAssetAttribute
    >;
    ComposeAsset: Sequelize.Model<ComposeAssetInstance, ComposeAssetAttribute>;
    DecomposeAsset: Sequelize.Model<
        DecomposeAssetInstance,
        DecomposeAssetAttribute
    >;
    ChangeAssetScheme: Sequelize.Model<
        ChangeAssetSchemeInstance,
        ChangeAssetSchemeAttribute
    >;
    IncreaseAssetSupply: Sequelize.Model<
        IncreaseAssetSupplyInstance,
        IncreaseAssetSupplyAttribute
    >;
    WrapCCC: Sequelize.Model<WrapCCCInstance, WrapCCCAttribute>;
    UnwrapCCC: Sequelize.Model<UnwrapCCCInstance, UnwrapCCCAttribute>;
    Pay: Sequelize.Model<PayInstance, PayAttribute>;
    SetRegularKey: Sequelize.Model<
        SetRegularKeyInstance,
        SetRegularKeyAttribute
    >;
    CreateShard: Sequelize.Model<CreateShardInstance, CreateShardAttribute>;
    SetShardOwners: Sequelize.Model<
        SetShardOwnersInstance,
        SetShardOwnersAttribute
    >;
    SetShardUsers: Sequelize.Model<
        SetShardUsersInstance,
        SetShardUsersAttribute
    >;
    Store: Sequelize.Model<StoreInstance, StoreAttribute>;
    Remove: Sequelize.Model<RemoveInstance, RemoveAttribute>;
    Custom: Sequelize.Model<CustomInstance, CustomAttribute>;
    AssetScheme: Sequelize.Model<AssetSchemeInstance, AssetSchemeAttribute>;
    Account: Sequelize.Model<AccountInstance, AccountAttribtue>;
    Order: Sequelize.Model<OrderInstance, OrderAttribute>;
    OrderOnTransfer: Sequelize.Model<
        OrderOnTransferInstance,
        OrderOnTransferAttribute
    >;
    UTXO: Sequelize.Model<UTXOInstance, UTXOAttribute>;
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
    AssetImage: Sequelize.Model<AssetImageInstance, AssetImageAttribute>;
    Log: Sequelize.Model<LogInstance, LogAttribute>;
}

export default models as DB;
