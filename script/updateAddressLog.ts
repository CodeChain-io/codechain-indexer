import models from "../src/models";

(async () => {
    let updated = 0;
    let pending = 0;

    await models.AddressLog.findAll({
        where: {
            isPending: true
        }
    }).then(logs =>
        Promise.all(
            logs.map(async log => {
                const { transactionHash } = log.get();
                const tx = await models.Transaction.findByPk(transactionHash);
                if (tx == null) {
                    console.error("never");
                    return;
                }
                const { isPending } = tx.get();
                if (isPending === false) {
                    const { blockNumber, transactionIndex } = tx.get();
                    await log.update({
                        blockNumber,
                        transactionIndex,
                        success: true,
                        isPending
                    });
                    updated++;
                } else {
                    pending++;
                }
            })
        )
    );

    console.log(`updated ${updated} rows`);
    console.log(`# of pending ${pending}`);

    await models.sequelize.close();
})();
