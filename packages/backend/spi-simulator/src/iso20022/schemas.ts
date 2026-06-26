export interface GroupHeader {
  MsgId: string
  CreDtTm: string
  NbOfTxs: string
  TtlIntrBkSttlmAmt: string
  IntrBkSttlmDt: string
  SttlmInf: {
    SttlmMtd: string
  }
}

export interface CreditTransferTransaction {
  PmtId: {
    EndToEndId: string
    TxId?: string
  }
  InstgAgt: {
    FinInstnId: {
      ClrSysMmbId: {
        MmbId: string
      }
    }
  }
  Dbtr: {
    Nm?: string
  }
  DbtrAcct?: {
    Id: {
      Iban?: string
      Othr?: {
        Id: string
      }
    }
  }
  DbtrAgt: {
    FinInstnId: {
      ClrSysMmbId: {
        MmbId: string
      }
    }
  }
  CdtrAgt: {
    FinInstnId: {
      ClrSysMmbId: {
        MmbId: string
      }
    }
  }
  Cdtr: {
    Nm?: string
  }
  CdtrAcct?: {
    Id: {
      Iban?: string
      Othr?: {
        Id: string
      }
    }
  }
  IntrBkSttlmAmt: string
  ChrgBr: string
  CdtTrfTxInf?: CreditTransferTransaction
}

export interface Pacs008Document {
  FIToFICstmrCdtTrf: {
    GrpHdr: GroupHeader
    CdtTrfTxInf: CreditTransferTransaction | CreditTransferTransaction[]
  }
}

export interface OriginalGroupInformation {
  OrgnlMsgId: string
  OrgnlMsgNmId: string
  OrgnlCreDtTm: string
}

export interface OriginalTransactionReference {
  IntrBkSttlmAmt: string
  SttlmInf: {
    SttlmMtd: string
  }
  CdtrAgt: {
    FinInstnId: {
      ClrSysMmbId: {
        MmbId: string
      }
    }
  }
  DbtrAgt: {
    FinInstnId: {
      ClrSysMmbId: {
        MmbId: string
      }
    }
  }
  Cdtr: {
    Nm?: string
  }
  Dbtr: {
    Nm?: string
  }
  CdtTrfTxInf?: CreditTransferTransaction
}

export interface TransactionInformation {
  OrgnlInstrId?: string
  OrgnlEndToEndId: string
  OrgnlTxId?: string
  TxSts: string
  StsRsnInf?: {
    Rsn: {
      Cd: string
    }
    AddtlInf?: string
  }
  OrgnlGrpInf?: OriginalGroupInformation
  OrgnlTxRef?: OriginalTransactionReference
}

export interface Pacs002Document {
  FIToFIPmtStsRpt: {
    GrpHdr: GroupHeader
    TxInfAndSts: TransactionInformation | TransactionInformation[]
  }
}

export interface ResolutionOfInvestigation {
  OrgnlGrpInf: OriginalGroupInformation
  OrgnlPmtInfAndSts: {
    OrgnlEndToEndId: string
    OrgnlTxId?: string
    TxSts: string
    StsRsnInf?: {
      Rsn: {
        Cd: string
      }
      AddtlInf?: string
    }
  }
}

export interface PaymentReturn {
  PmtId: {
    EndToEndId: string
    TxId?: string
  }
  IntrBkSttlmAmt: string
  ChrgBr: string
  InstgAgt: {
    FinInstnId: {
      ClrSysMmbId: {
        MmbId: string
      }
    }
  }
  DbtrAgt: {
    FinInstnId: {
      ClrSysMmbId: {
        MmbId: string
      }
    }
  }
  CdtrAgt: {
    FinInstnId: {
      ClrSysMmbId: {
        MmbId: string
      }
    }
  }
  Dbtr: {
    Nm?: string
  }
  Cdtr: {
    Nm?: string
  }
  RtrInf: {
    Rsn: {
      Cd: string
    }
    AddtlInf?: string
  }
  OrgnlGrpInf: OriginalGroupInformation
  OrgnlPmtInfAndSts: {
    OrgnlEndToEndId: string
    OrgnlTxId?: string
    TxSts: string
  }
}

export interface Pacs004Document {
  FIToFIPmtRtr: {
    GrpHdr: GroupHeader
    TxInf: PaymentReturn | PaymentReturn[]
  }
}
