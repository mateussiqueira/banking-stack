package iso20022

import (
	"encoding/xml"
	"fmt"
)

func ParsePacs008(xmlData []byte) (*Pacs008Document, error) {
	var doc Pacs008Document
	if err := xml.Unmarshal(xmlData, &doc); err != nil {
		return nil, fmt.Errorf("failed to parse pacs.008: %w", err)
	}

	if doc.FIToFICstmrCdtTrf.GrpHdr.MsgId == "" {
		return nil, fmt.Errorf("missing MsgId")
	}

	if len(doc.FIToFICstmrCdtTrf.CdtTrfTxInf) == 0 {
		return nil, fmt.Errorf("no credit transfer transactions found")
	}

	for i, tx := range doc.FIToFICstmrCdtTrf.CdtTrfTxInf {
		if tx.PmtId.EndToEndId == "" {
			return nil, fmt.Errorf("transaction %d: missing EndToEndId", i)
		}
	}

	return &doc, nil
}

func ParsePacs002(xmlData []byte) (*Pacs002Document, error) {
	var doc Pacs002Document
	if err := xml.Unmarshal(xmlData, &doc); err != nil {
		return nil, fmt.Errorf("failed to parse pacs.002: %w", err)
	}
	return &doc, nil
}

func ParsePacs004(xmlData []byte) (*Pacs004Document, error) {
	var doc Pacs004Document
	if err := xml.Unmarshal(xmlData, &doc); err != nil {
		return nil, fmt.Errorf("failed to parse pacs.004: %w", err)
	}
	return &doc, nil
}
