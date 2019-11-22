"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("AggsUTXOs", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT
            },
            address: {
                allowNull: false,
                type: Sequelize.STRING
            },
            assetType: {
                allowNull: false,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "AssetSchemes",
                    key: "assetType"
                }
            },
            totalAssetQuantity: {
                allowNull: false,
                type: Sequelize.BIGINT,
                defaultValue: 0
            },
            utxoQuantity: {
                allowNull: false,
                type: Sequelize.BIGINT,
                defaultValue: 0
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex("AggsUTXOs", {
            fields: ["address", "assetType"],
            unique: true
        });

        await queryInterface.addIndex("AggsUTXOs", {
            fields: ["assetType", "address"],
            unique: true
        });

        await queryInterface.sequelize.query(`
        CREATE FUNCTION utxos_trigger_function() RETURNS trigger
        LANGUAGE plpgsql
            as
            $$
                BEGIN
                    IF (TG_OP = 'INSERT') THEN
                        IF NEW."usedBlockNumber" IS NULL THEN
                            INSERT INTO "AggsUTXOs"("assetType", address, "totalAssetQuantity", "utxoQuantity", "createdAt", "updatedAt") VALUES(NEW."assetType", NEW.address, NEW.quantity, 1, NOW(), NOW())
                            ON CONFLICT ("assetType", "address") DO UPDATE SET "totalAssetQuantity"="AggsUTXOs"."totalAssetQuantity"+NEW."quantity", "utxoQuantity"="AggsUTXOs"."utxoQuantity"+1;
                        END IF;
                        return NEW;
                    ELSEIF (TG_OP = 'UPDATE') THEN
                        IF OLD."usedBlockNumber" IS NULL THEN
                            UPDATE "AggsUTXOs" SET "totalAssetQuantity"="totalAssetQuantity"-OLD.quantity, "utxoQuantity"="utxoQuantity"-1, "updatedAt"=NOW() WHERE "AggsUTXOs".address=OLD.address AND "AggsUTXOs"."assetType"=OLD."assetType";
                        END IF;
                        IF NEW."usedBlockNumber" IS NULL THEN
                            INSERT INTO "AggsUTXOs"("assetType", address, "totalAssetQuantity", "utxoQuantity", "createdAt", "updatedAt") VALUES(NEW."assetType", NEW.address, NEW.quantity, 1, NOW(), NOW())
                            ON CONFLICT ("assetType", "address") DO UPDATE SET "totalAssetQuantity"="AggsUTXOs"."totalAssetQuantity"+NEW.quantity, "utxoQuantity"="AggsUTXOs"."utxoQuantity"+1;
                        END IF;
                        RETURN NEW;
                    ELSEIF (TG_OP = 'DELETE') THEN
                        IF OLD."usedBlockNumber" IS NULL THEN
                            UPDATE "AggsUTXOs" SET "totalAssetQuantity"="totalAssetQuantity"-OLD.quantity, "utxoQuantity"="utxoQuantity"-1, "updatedAt"=NOW() WHERE "AggsUTXOs".address=OLD.address AND "AggsUTXOs"."assetType"=OLD."assetType";
                        END IF;
                        return OLD;
                    END IF;
                END;
            $$;`);
        await queryInterface.sequelize.query(`
        CREATE TRIGGER utxos_trigger
        AFTER INSERT OR UPDATE OR DELETE
           ON "UTXOs"
           FOR EACH ROW
               EXECUTE PROCEDURE utxos_trigger_function()
        `);

        await queryInterface.sequelize.query(`
            INSERT INTO "AggsUTXOs"("assetType", "address", "totalAssetQuantity", "utxoQuantity", "createdAt", "updatedAt")
                SELECT "assetType", "address", SUM("quantity") as "totalAssetQuantity", COUNT(*) as "utxoQuantity", NOW(), NOW()
                FROM "UTXOs" WHERE "usedBlockNumber" IS NULL GROUP BY "assetType", "address"
        `);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("AggsUTXOs");
        await queryInterface.sequelize.query(
            `DROP TRIGGER "utxos_trigger" ON "UTXOs"`
        );
        await queryInterface.sequelize.query(
            "DROP FUNCTION utxos_trigger_function()"
        );
    }
};
