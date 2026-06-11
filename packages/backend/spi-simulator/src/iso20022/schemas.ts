export interface GroupHeader {
  msgId: string
  creDtTm: string
  nbOfTxs: string
  ttlIntrBkSttlmAmt: string
  intrBkSttlmDt: string
  sttlmInf: {
    sttlmMtd: string
  }
}

export interface CreditTransferTransaction {
  pmtId: {
    endToEndId: string
    txId?: string
  }
  instgAgt: {
    finInstnId: {
      clrSysMmbId: {
        mmbId: string
      }
    }
  }
  dbtr: {
    nm?: string
  }
  dbtrAcct?: {
    id: {
      iban?: string
      othr?: {
        id: string
      }
    }
  }
  dbtrAgt: {
    finInstnId: {
      clrSysMmbId: {
        mmbId: string
      }
    }
  }
  cdtrAgt: {
    finInstnId: {
      clrSysMmbId: {
        mmbId: string
      }
    }
  }
  cdtr: {
    nm?: string
  }
  cdtrAcct?: {
    id: {
      iban?: string
      othr?: {
        id: string
      }
    }
  }
  intrBkSttlmAmt: string
  chrgBr: string
  cdtTrfTxInf?: CreditTransferTransaction
}

export interface Pacs008Document {
  FIToFICstmrCdtTrf: {
    grpHdr: GroupHeader
    cdtTrfTxInf: CreditTransferTransaction | CreditTransferTransaction[]
  }
}

export interface OriginalGroupInformation {
  orgnlMsgId: string
  orgnlMsgNmId: string
  orgnlCreDtTm: string
}

export interface OriginalTransactionReference {
  intrBkSttlmAmt: string
  sttlmInf: {
    sttlmMtd: string
  }
  cdtrAgt: {
    finInstnId: {
      clrSysMmbId: {
        mmbId: string
      }
    }
  }
  dbtrAgt: {
    finInstnId: {
      clrSysMmbId: {
        mmbId: string
      }
    }
  }
  cdtr: {
    nm?: string
  }
  dbtr: {
    nm?: string
  }
  cdtTrfTxInf?: CreditTransferTransaction
}

export interface TransactionInformation {
  orgnlInstrId?: string
  orgnlEndToEndId: string
  orgnlTxId?: string
  txSts: string
  stsRsnInf?: {
    rsn: {
      cd: string
    }
    addtlInf?: string
  }
  orgnlGrpInf?: OriginalGroupInformation
  orgnlTxRef?: OriginalTransactionReference
}

export interface Pacs002Document {
  FIToFIPmtStsRpt: {
    grpHdr: GroupHeader
    txInfAndSts: TransactionInformation | TransactionInformation[]
  }
}

export interface ResolutionOfInvestigation {
  orgnlGrpInf: OriginalGroupInformation
  orgnlPmtInfAndSts: {
    orgnlEndToEndId: string
    orgnlTxId?: string
    txSts: string
    stsRsnInf?: {
      rsn: {
        cd: string
      }
      addtlInf?: string
    }
  }
}

export interface PaymentReturn {
  pmtId: {
    endToEndId: string
    txId?: string
  }
  intrBkSttlmAmt: string
  chrgBr: string
  instgAgt: {
    finInstnId: {
      clrSysMmbId: {
        mmbId: string
      }
    }
  }
  dbtrAgt: {
    finInstnId: {
      clrSysMmbId: {
        mmbId: string
      }
    }
  }
  cdtrAgt: {
    finInstnId: {
      clrSysMmbId: {
        mmbId: string
      }
    }
  }
  dbtr: {
    nm?: string
  }
  cdtr: {
    nm?: string
  }
  rtrInf: {
    rsn: {
      cd: string
    }
    addtlInf?: string
  }
  orgnlGrpInf: OriginalGroupInformation
  orgnlPmtInfAndSts: {
    orgnlEndToEndId: string
    orgnlTxId?: string
    txSts: string
  }
}

export interface Pacs004Document {
  FIToFIPmtRtr: {
    grpHdr: GroupHeader
    txInf: PaymentReturn | PaymentReturn[]
  }
}
