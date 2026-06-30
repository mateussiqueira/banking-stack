package iso20022

import (
	"encoding/xml"
	"fmt"
	"time"
)

func BuildPacs008(endToEndID, txID string, amount float64, creditorISPB, creditorName, debtorISPB, debtorName string) ([]byte, error) {
	doc := Pacs008Document{
		FIToFICstmrCdtTrf: FIToFICstmrCdtTrf{
			GrpHdr: GroupHeader{
				MsgId:   fmt.Sprintf("MSG%s", time.Now().Format("20060102150405")),
				CreDtTm: time.Now().Format(time.RFC3339),
				NbOfTxs: 1,
			},
			CdtTrfTxInf: []CreditTransferTransaction{
				{
					PmtId: struct {
						EndToEndId string `xml:"EndToEndId"`
						TxId       string `xml:"TxId"`
					}{
						EndToEndId: endToEndID,
						TxId:       txID,
					},
					InstgAgt: struct {
						FinInstnId struct {
							ClrSysId struct {
								MmbId string `xml:"MmbId"`
							} `xml:"ClrSysId"`
						} `xml:"FinInstnId"`
					}{
						FinInstnId: struct {
							ClrSysId struct {
								MmbId string `xml:"MmbId"`
							} `xml:"ClrSysId"`
						}{
							ClrSysId: struct {
								MmbId string `xml:"MmbId"`
							}{
								MmbId: debtorISPB,
							},
						},
					},
					IntrBkSttlmAmt: struct {
						Value float64 `xml:",chardata"`
						Ccy   string  `xml:"Ccy,attr"`
					}{
						Value: amount,
						Ccy:   "BRL",
					},
					ChrgBr: "DEBT",
					Dbtr: struct {
						Nm string `xml:"Nm"`
					}{
						Nm: debtorName,
					},
					DbtrAgt: struct {
						FinInstnId struct {
							ClrSysId struct {
								MmbId string `xml:"MmbId"`
							} `xml:"ClrSysId"`
						} `xml:"FinInstnId"`
					}{
						FinInstnId: struct {
							ClrSysId struct {
								MmbId string `xml:"MmbId"`
							} `xml:"ClrSysId"`
						}{
							ClrSysId: struct {
								MmbId string `xml:"MmbId"`
							}{
								MmbId: debtorISPB,
							},
						},
					},
					CdtrAgt: struct {
						FinInstnId struct {
							ClrSysId struct {
								MmbId string `xml:"MmbId"`
							} `xml:"ClrSysId"`
						} `xml:"FinInstnId"`
					}{
						FinInstnId: struct {
							ClrSysId struct {
								MmbId string `xml:"MmbId"`
							} `xml:"ClrSysId"`
						}{
							ClrSysId: struct {
								MmbId string `xml:"MmbId"`
							}{
								MmbId: creditorISPB,
							},
						},
					},
					Cdtr: struct {
						Nm string `xml:"Nm"`
					}{
						Nm: creditorName,
					},
				},
			},
		},
	}

	return xml.MarshalIndent(doc, "", "  ")
}

func BuildPacs002(endToEndID, txID, status string) ([]byte, error) {
	doc := Pacs002Document{
		FIToFIPmtStsRpt: FIToFIPmtStsRpt{
			GrpHdr: GroupHeader{
				MsgId:   fmt.Sprintf("RPT%s", time.Now().Format("20060102150405")),
				CreDtTm: time.Now().Format(time.RFC3339),
				NbOfTxs: 1,
			},
			TransactionInformationAndStatus: []TransactionInformation{
				{
					OrgnlEndToEndId: endToEndID,
					OrgnlTxId:       txID,
					TxSts:           status,
				},
			},
		},
	}

	return xml.MarshalIndent(doc, "", "  ")
}

func BuildPacs004(endToEndID, txID string, amount float64, reasonCode, additionalInfo string) ([]byte, error) {
	doc := Pacs004Document{
		FIToFIPmtRtr: FIToFIPmtRtr{
			GrpHdr: GroupHeader{
				MsgId:   fmt.Sprintf("RTR%s", time.Now().Format("20060102150405")),
				CreDtTm: time.Now().Format(time.RFC3339),
				NbOfTxs: 1,
			},
			PmtRtr: []PaymentReturn{
				{
					PmtId: struct {
						EndToEndId string `xml:"EndToEndId"`
						TxId       string `xml:"TxId"`
					}{
						EndToEndId: fmt.Sprintf("RET%s", endToEndID),
						TxId:       fmt.Sprintf("RET%s", txID),
					},
					IntrBkSttlmAmt: struct {
						Value float64 `xml:",chardata"`
						Ccy   string  `xml:"Ccy,attr"`
					}{
						Value: amount,
						Ccy:   "BRL",
					},
					RtrInf: struct {
						Rsn struct {
							Cd string `xml:"Cd"`
						} `xml:"Rsn"`
						AddtlInf string `xml:"AddtlInf,omitempty"`
					}{
						Rsn: struct {
							Cd string `xml:"Cd"`
						}{
							Cd: reasonCode,
						},
						AddtlInf: additionalInfo,
					},
					OrgnlPmtInfAndSts: struct {
						OrgnlEndToEndId string `xml:"OrgnlEndToEndId"`
					}{
						OrgnlEndToEndId: endToEndID,
					},
				},
			},
		},
	}

	return xml.MarshalIndent(doc, "", "  ")
}
