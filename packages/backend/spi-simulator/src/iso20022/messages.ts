import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { Transaction } from '../models/transaction'
import {
  Pacs008Document,
  Pacs002Document,
  Pacs004Document,
} from './schemas'

const builder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
  suppressEmptyNode: true,
})

const xmlOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string) =>
    ['CdtTrfTxInf', 'TxInfAndSts', 'TxInf'].includes(name),
}

function buildGroupHeader(tx: Transaction, msgId: string): object {
  return {
    GrpHdr: {
      MsgId: msgId,
      CreDtTm: new Date().toISOString(),
      NbOfTxs: '1',
      TtlIntrBkSttlmAmt: tx.amount.toFixed(2),
      IntrBkSttlmDt: new Date().toISOString().slice(0, 10),
      SttlmInf: {
        SttlmMtd: 'CLRG',
      },
    },
  }
}

export function buildPacs008(tx: Transaction): string {
  const msgId = `PACS008${tx.endToEndId.slice(0, 20)}`

  const doc: Pacs008Document = {
    FIToFICstmrCdtTrf: {
      GrpHdr: {
        MsgId: msgId,
        CreDtTm: new Date().toISOString(),
        NbOfTxs: '1',
        TtlIntrBkSttlmAmt: tx.amount.toFixed(2),
        IntrBkSttlmDt: new Date().toISOString().slice(0, 10),
        SttlmInf: {
          SttlmMtd: 'CLRG',
        },
      },
      CdtTrfTxInf: [
        {
          PmtId: {
            EndToEndId: tx.endToEndId,
            TxId: tx.txId,
          },
          InstgAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: tx.debtorIspb,
              },
            },
          },
          Dbtr: {
            Nm: tx.debtorName || 'Debtor',
          },
          DbtrAcct: tx.debtorKey
            ? {
                Id: {
                  Othr: {
                    Id: tx.debtorKey,
                  },
                },
              }
            : undefined,
          DbtrAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: tx.debtorIspb,
              },
            },
          },
          CdtrAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: tx.creditorIspb,
              },
            },
          },
          Cdtr: {
            Nm: tx.creditorName || 'Creditor',
          },
          CdtrAcct: tx.creditorKey
            ? {
                Id: {
                  Othr: {
                    Id: tx.creditorKey,
                  },
                },
              }
            : undefined,
          IntrBkSttlmAmt: tx.amount.toFixed(2),
          ChrgBr: 'SLEV',
        },
      ],
    },
  }

  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    Document: {
      '@_xmlns': 'urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08',
      ...doc,
    },
  }

  return builder.build(xmlObj)
}

export function buildPacs002(
  tx: Transaction,
  status: string
): string {
  const msgId = `PACS002${tx.endToEndId.slice(0, 20)}`

  const doc: Pacs002Document = {
    FIToFIPmtStsRpt: {
      GrpHdr: {
        MsgId: msgId,
        CreDtTm: new Date().toISOString(),
        NbOfTxs: '1',
        TtlIntrBkSttlmAmt: tx.amount.toFixed(2),
        IntrBkSttlmDt: new Date().toISOString().slice(0, 10),
        SttlmInf: {
          SttlmMtd: 'CLRG',
        },
      },
      TxInfAndSts: [
        {
          OrgnlEndToEndId: tx.endToEndId,
          OrgnlTxId: tx.txId,
          TxSts: status,
          OrgnlGrpInf: {
            OrgnlMsgId: `PACS008${tx.endToEndId.slice(0, 20)}`,
            OrgnlMsgNmId: 'pacs.008.001.08',
            OrgnlCreDtTm: tx.createdAt,
          },
          OrgnlTxRef: {
            IntrBkSttlmAmt: tx.amount.toFixed(2),
            SttlmInf: {
              SttlmMtd: 'CLRG',
            },
            CdtrAgt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: tx.creditorIspb,
                },
              },
            },
            DbtrAgt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: tx.debtorIspb,
                },
              },
            },
            Cdtr: {
              Nm: tx.creditorName || 'Creditor',
            },
            Dbtr: {
              Nm: tx.debtorName || 'Debtor',
            },
          },
        },
      ],
    },
  }

  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    Document: {
      '@_xmlns': 'urn:iso:std:iso:20022:tech:xsd:pacs.002.001.10',
      ...doc,
    },
  }

  return builder.build(xmlObj)
}

export function buildPacs004(tx: Transaction): string {
  const msgId = `PACS004${tx.endToEndId.slice(0, 20)}`

  const doc: Pacs004Document = {
    FIToFIPmtRtr: {
      GrpHdr: {
        MsgId: msgId,
        CreDtTm: new Date().toISOString(),
        NbOfTxs: '1',
        TtlIntrBkSttlmAmt: tx.amount.toFixed(2),
        IntrBkSttlmDt: new Date().toISOString().slice(0, 10),
        SttlmInf: {
          SttlmMtd: 'CLRG',
        },
      },
      TxInf: [
        {
          PmtId: {
            EndToEndId: tx.endToEndId,
            TxId: tx.txId,
          },
          IntrBkSttlmAmt: tx.amount.toFixed(2),
          ChrgBr: 'SLEV',
          InstgAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: tx.creditorIspb,
              },
            },
          },
          DbtrAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: tx.creditorIspb,
              },
            },
          },
          CdtrAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: tx.debtorIspb,
              },
            },
          },
          Dbtr: {
            Nm: tx.creditorName || 'Creditor',
          },
          Cdtr: {
            Nm: tx.debtorName || 'Debtor',
          },
          RtrInf: {
            Rsn: {
              Cd: tx.returnReason || 'FRAD',
            },
            AddtlInf: tx.returnRejectionReason || 'Return requested',
          },
          OrgnlGrpInf: {
            OrgnlMsgId: `PACS008${tx.endToEndId.slice(0, 20)}`,
            OrgnlMsgNmId: 'pacs.008.001.08',
            OrgnlCreDtTm: tx.createdAt,
          },
          OrgnlPmtInfAndSts: {
            OrgnlEndToEndId: tx.originalEndToEndId || tx.endToEndId,
            OrgnlTxId: tx.txId,
            TxSts: 'RETURN',
          },
        },
      ],
    },
  }

  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    Document: {
      '@_xmlns': 'urn:iso:std:iso:20022:tech:xsd:pacs.004.001.09',
      ...doc,
    },
  }

  return builder.build(xmlObj)
}
