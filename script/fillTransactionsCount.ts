import models from "../src/models";

async function main() {
    const numbers = await models.Block.findAll({
        attributes: ["number"],
        where: {
            transactionsCount: {
                [models.Sequelize.Op.eq]: null
            }
        }
    }).then(blocks => blocks.map(b => b.get({ plain: true }).number));

    const result = ((await models.Transaction.count({
        attributes: ["blockNumber"],
        where: {
            blockNumber: {
                [models.Sequelize.Op.in]: numbers
            }
        },
        group: "blockNumber"
    })) as unknown) as { blockNumber: number; count: string }[];

    let updated = 0;
    for (const { blockNumber, count } of result) {
        await models.Block.findOne({
            where: {
                number: blockNumber
            }
        }).then(instance => {
            if (instance == null) {
                throw Error(`Block ${blockNumber} not found`);
            }
            updated++;
            return instance.update({
                transactionsCount: parseInt(count, 10)
            });
        });
    }

    const [updated0] = await models.Block.update(
        {
            transactionsCount: 0
        },
        {
            where: {
                transactionsCount: {
                    [models.Sequelize.Op.eq]: null
                }
            }
        }
    );

    console.log(`Updated ${updated} + ${updated0} rows`);
}

main()
    .catch(console.error)
    .finally(() => models.sequelize.close());
