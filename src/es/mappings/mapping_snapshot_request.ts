export const getSnapshotRequestMapping = () => {
    return {
        properties: {
            blockNumber: {
                type: "long"
            },
            assetType: {
                type: "keyword"
            }
        }
    };
};
