import models from "../src/models";

(async () => {
    const hashes = await models.Transaction.findAll({
        attributes: ["hash"],
        where: {
            isPending: true,
            blockNumber: null
        },
        limit: 10,
        order: [["pendingTimestamp", "ASC"]]
    }).then(instances => instances.map(instance => instance.get().hash));

    console.time("destroy");
    const deleted = await models.Transaction.destroy({
        where: {
            isPending: true,
            blockNumber: {
                [models.Sequelize.Op.eq]: null
            },
            hash: {
                [models.Sequelize.Op.in]: hashes
            }
        }
    });
    console.timeEnd("destroy");

    console.log(`Deleted ${deleted} rows`);

    await models.sequelize.close();
})();
