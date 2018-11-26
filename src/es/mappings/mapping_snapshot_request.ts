export const getSnapshotRequestMapping = () => {
    return {
        properties: {
            timestamp: {
                type: "long"
            },
            assetType: {
                type: "keyword"
            },
            status: {
                type: "keyword"
            }
        }
    };
};
