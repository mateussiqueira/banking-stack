package iso20022

import "encoding/xml"

// Pacs008 - Credit Transfer (FIToFICstmrCdtTrf)
type Pacs008Document struct {
	XMLName                    xml.Name                     `xml:"Document"`
	FIToFICstmrCdtTrf         FIToFICstmrCdtTrf            `xml:"FIToFICstmrCdtTrf"`
}

type FIToFICstmrCdtTrf struct {
	XMLName                xml.Name                   `xml:"FIToFICstmrCdtTrf"`
	GrpHdr                 GroupHeader                `xml:"GrpHdr"`
	CdtTrfTxInf            []CreditTransferTransaction `xml:"CdtTrfTxInf"`
}

type GroupHeader struct {
	MsgId    string `xml:"MsgId"`
	CreDtTm  string `xml:"CreDtTm"`
	NbOfTxs  int    `xml:"NbOfTxs"`
	SttlmInf struct {
		SttlmMtd string `xml:"SttlmMtd"`
	} `xml:"SttlmInf"`
}

type CreditTransferTransaction struct {
	PmtId struct {
		EndToEndId string `xml:"EndToEndId"`
		TxId       string `xml:"TxId"`
	} `xml:"PmtId"`
	InstgAgt struct {
		FinInstnId struct {
			ClrSysId struct {
				MmbId string `xml:"MmbId"`
			} `xml:"ClrSysId"`
		} `xml:"FinInstnId"`
	} `xml:"InstgAgt"`
	IntrBkSttlmAmt struct {
		Value float64 `xml:",chardata"`
		Ccy   string  `xml:"Ccy,attr"`
	} `xml:"IntrBkSttlmAmt"`
	ChrgBr string `xml:"ChrgBr"`
	Dbtr struct {
		Nm string `xml:"Nm"`
	} `xml:"Dbtr"`
	DbtrAcct struct {
		Id struct {
			IBAN string `xml:"IBAN"`
		} `xml:"Id"`
	} `xml:"DbtrAcct"`
	DbtrAgt struct {
		FinInstnId struct {
			ClrSysId struct {
				MmbId string `xml:"MmbId"`
			} `xml:"ClrSysId"`
		} `xml:"FinInstnId"`
	} `xml:"DbtrAgt"`
	CdtrAgt struct {
		FinInstnId struct {
			ClrSysId struct {
				MmbId string `xml:"MmbId"`
			} `xml:"ClrSysId"`
		} `xml:"FinInstnId"`
	} `xml:"CdtrAgt"`
	Cdtr struct {
		Nm string `xml:"Nm"`
	} `xml:"Cdtr"`
	CdtrAcct struct {
		Id struct {
			IBAN string `xml:"IBAN"`
		} `xml:"Id"`
	} `xml:"CdtrAcct"`
}

// Pacs002 - Status Report (FIToFIPmtStsRpt)
type Pacs002Document struct {
	XMLName            xml.Name              `xml:"Document"`
	FIToFIPmtStsRpt    FIToFIPmtStsRpt      `xml:"FIToFIPmtStsRpt"`
}

type FIToFIPmtStsRpt struct {
	GrpHdr              GroupHeader              `xml:"GrpHdr"`
	TransactionInformationAndStatus []TransactionInformation `xml:"TxInfAndSts"`
}

type TransactionInformation struct {
	OrgnlEndToEndId string `xml:"OrgnlEndToEndId"`
	OrgnlTxId       string `xml:"OrgnlTxId"`
	TxSts           string `xml:"TxSts"`
	StsRsnInf       *struct {
		Rsn struct {
			Cd string `xml:"Cd"`
		} `xml:"Rsn"`
		AddtlInf string `xml:"AddtlInf"`
	} `xml:"StsRsnInf,omitempty"`
}

// Pacs004 - Payment Return (FIToFIPmtRtr)
type Pacs004Document struct {
	XMLName         xml.Name           `xml:"Document"`
	FIToFIPmtRtr    FIToFIPmtRtr       `xml:"FIToFIPmtRtr"`
}

type FIToFIPmtRtr struct {
	GrpHdr           GroupHeader        `xml:"GrpHdr"`
	PmtRtr           []PaymentReturn    `xml:"PmtRtr"`
}

type PaymentReturn struct {
	PmtId struct {
		EndToEndId string `xml:"EndToEndId"`
		TxId       string `xml:"TxId"`
	} `xml:"PmtId"`
	IntrBkSttlmAmt struct {
		Value float64 `xml:",chardata"`
		Ccy   string  `xml:"Ccy,attr"`
	} `xml:"IntrBkSttlmAmt"`
	RtrInf struct {
		Rsn struct {
			Cd string `xml:"Cd"`
		} `xml:"Rsn"`
		AddtlInf string `xml:"AddtlInf,omitempty"`
	} `xml:"RtrInf"`
	OrgnlGrpInf struct {
		OrgnlMsgId string `xml:"OrgnlMsgId"`
	} `xml:"OrgnlGrpInf"`
	OrgnlPmtInfAndSts struct {
		OrgnlEndToEndId string `xml:"OrgnlEndToEndId"`
	} `xml:"OrgnlPmtInfAndSts"`
}
