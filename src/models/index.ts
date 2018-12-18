import * as fs from "fs";
import * as _ from "lodash";
import * as path from "path";
import * as Sequelize from "sequelize";
import { IndexerConfig } from "../config";

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "local";
const { pg, sequelize: options } = require("config") as IndexerConfig;

const sequelize = new Sequelize(pg.database!, pg.user!, pg.password!, options);

const models: any = {};

fs.readdirSync(__dirname)
    .filter(file => {
        const extension = _.includes(["local", "test"], env) ? ".ts" : ".js";
        return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === extension;
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
}

export default models as DB;
