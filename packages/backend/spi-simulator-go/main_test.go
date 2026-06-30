package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestProcessPayment_ValidRequest(t *testing.T) {
	store = NewTransactionStore()
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/spi/pacs.008", processPayment)

	body := `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>MSG001</MsgId>
      <NbOfTxs>1</NbOfTxs>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>E2E123456</EndToEndId>
        <TxId>TX001</TxId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="BRL">150.00</IntrBkSttlmAmt>
      <InstgAgt><FinInstnId><ClrSysMmbId><MmbId>00000001</MmbId></ClrSysMmbId></FinInstnId></InstgAgt>
      <Dbtr><Nm>Debtor Name</Nm></Dbtr>
      <CdtrAgt><FinInstnId><ClrSysMmbId><MmbId>00000002</MmbId></ClrSysMmbId></FinInstnId></CdtrAgt>
      <Cdtr><Nm>Creditor Name</Nm></Cdtr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/spi/pacs.008", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/xml")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	tx, exists := store.Get("E2E123456")
	if !exists {
		t.Fatal("transaction not stored")
	}
	if tx.Amount != 150.00 {
		t.Errorf("expected amount 150.00, got %f", tx.Amount)
	}
	if tx.Status != StatusAccepted {
		t.Errorf("expected status ACCEPTED, got %s", tx.Status)
	}
}

func TestProcessPayment_DuplicateEndToEndId(t *testing.T) {
	store = NewTransactionStore()
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/spi/pacs.008", processPayment)

	body := `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr><MsgId>MSG001</MsgId><NbOfTxs>1</NbOfTxs></GrpHdr>
    <CdtTrfTxInf>
      <PmtId><EndToEndId>DUP123</EndToEndId><TxId>TX001</TxId></PmtId>
      <IntrBkSttlmAmt Ccy="BRL">100.00</IntrBkSttlmAmt>
      <InstgAgt><FinInstnId><ClrSysMmbId><MmbId>0001</MmbId></ClrSysMmbId></FinInstnId></InstgAgt>
      <Dbtr><Nm>D</Nm></Dbtr>
      <CdtrAgt><FinInstnId><ClrSysMmbId><MmbId>0002</MmbId></ClrSysMmbId></FinInstnId></CdtrAgt>
      <Cdtr><Nm>C</Nm></Cdtr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`

	for i := 0; i < 2; i++ {
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/spi/pacs.008", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/xml")
		r.ServeHTTP(w, req)
		if i == 0 && w.Code != http.StatusOK {
			t.Fatalf("first request: expected 200, got %d: %s", w.Code, w.Body.String())
		}
		if i == 1 && w.Code != http.StatusConflict {
			t.Errorf("second request: expected 409, got %d: %s", w.Code, w.Body.String())
		}
	}
}

func TestProcessPayment_InvalidAmount(t *testing.T) {
	store = NewTransactionStore()
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/spi/pacs.008", processPayment)

	body := `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr><MsgId>MSG001</MsgId><NbOfTxs>1</NbOfTxs></GrpHdr>
    <CdtTrfTxInf>
      <PmtId><EndToEndId>AMT001</EndToEndId><TxId>TX001</TxId></PmtId>
      <IntrBkSttlmAmt Ccy="BRL">0</IntrBkSttlmAmt>
      <InstgAgt><FinInstnId><ClrSysMmbId><MmbId>0001</MmbId></ClrSysMmbId></FinInstnId></InstgAgt>
      <Dbtr><Nm>D</Nm></Dbtr>
      <CdtrAgt><FinInstnId><ClrSysMmbId><MmbId>0002</MmbId></ClrSysMmbId></FinInstnId></CdtrAgt>
      <Cdtr><Nm>C</Nm></Cdtr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/spi/pacs.008", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/xml")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid amount, got %d: %s", w.Code, w.Body.String())
	}
}

func TestProcessPayment_MissingAmount(t *testing.T) {
	store = NewTransactionStore()
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/spi/pacs.008", processPayment)

	body := `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr><MsgId>MSG001</MsgId><NbOfTxs>1</NbOfTxs></GrpHdr>
    <CdtTrfTxInf>
      <PmtId><EndToEndId>AMT002</EndToEndId><TxId>TX001</TxId></PmtId>
      <IntrBkSttlmAmt Ccy="BRL"></IntrBkSttlmAmt>
      <InstgAgt><FinInstnId><ClrSysMmbId><MmbId>0001</MmbId></ClrSysMmbId></FinInstnId></InstgAgt>
      <Dbtr><Nm>D</Nm></Dbtr>
      <CdtrAgt><FinInstnId><ClrSysMmbId><MmbId>0002</MmbId></ClrSysMmbId></FinInstnId></CdtrAgt>
      <Cdtr><Nm>C</Nm></Cdtr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/spi/pacs.008", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/xml")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing amount, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHealthCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/spi/health", healthCheck)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("GET", "/spi/health", nil))

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestParseAmountValue(t *testing.T) {
	v, err := parseAmountValue("150.00")
	if err != nil || v != 150.00 {
		t.Errorf("expected 150.00, got %f, err=%v", v, err)
	}
	_, err = parseAmountValue("")
	if err == nil {
		t.Error("expected error for empty string")
	}
	_, err = parseAmountValue("-1")
	if err == nil {
		t.Error("expected error for negative amount")
	}
	_, err = parseAmountValue("abc")
	if err == nil {
		t.Error("expected error for non-numeric")
	}
}
