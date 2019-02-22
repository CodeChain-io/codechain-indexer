interface Exception {
    code: number;
    message: string;
    data?: any;
}

export const AlreadyExist: Exception = {
    code: 102,
    message: "AlreadyExist"
};

export const DBError: Exception = {
    code: 103,
    message: "DBError"
};

export const InvalidTransaction: Exception = {
    code: 104,
    message: "InvalidTransaction"
};

export const InvalidBlockNumber: Exception = {
    code: 107,
    message: "InvalidBlockNumber"
};

export const InvalidUTXO: Exception = {
    code: 108,
    message: "InvalidUTXO"
};

export const InvalidLogType: Exception = {
    code: 109,
    message: "InvalidLogType"
};

export const InvalidDateParam: Exception = {
    code: 111,
    message: "InvalidDateParam"
};
