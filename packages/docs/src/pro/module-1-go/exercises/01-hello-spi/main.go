package main

import "fmt"

// TransacaoSPI representa uma transação no Sistema de Pagamentos Instantâneos
type TransacaoSPI struct {
	EndToEndID  string
	Valor       float64
	ISPBOrigem  string
	ISPBDestino string
	Status      string
}

// formatarMensagem formata a transação para exibição
func formatarMensagem(t TransacaoSPI) string {
	return fmt.Sprintf(
		"[SPI] E2E: %s | R$ %.2f | %s → %s | Status: %s",
		t.EndToEndID,
		t.Valor,
		t.ISPBOrigem,
		t.ISPBDestino,
		t.Status,
	)
}

// validarISPB verifica se o ISPB tem 8 dígitos
func validarISPB(ispb string) error {
	if len(ispb) != 8 {
		return fmt.Errorf("ISPB deve ter 8 dígitos, recebido: %d", len(ispb))
	}
	for _, c := range ispb {
		if c < '0' || c > '9' {
			return fmt.Errorf("ISPB deve conter apenas dígitos")
		}
	}
	return nil
}

func main() {
	fmt.Println("=== Banking Stack Pro - Aula 01 ===")
	fmt.Println()

	// Criar transação
	tx := TransacaoSPI{
		EndToEndID:  "E2E20240101120000ABC12345",
		Valor:       150.50,
		ISPBOrigem:  "00000000", // Banco do Brasil
		ISPBDestino: "60701190", // Itaú BBA
		Status:      "ACCEPTED",
	}

	// Validar ISPBs
	if err := validarISPB(tx.ISPBOrigem); err != nil {
		fmt.Printf("Erro ISPB Origem: %v\n", err)
		return
	}
	if err := validarISPB(tx.ISPBDestino); err != nil {
		fmt.Printf("Erro ISPB Destino: %v\n", err)
		return
	}

	// Imprimir mensagem
	fmt.Println(formatarMensagem(tx))
	fmt.Println()

	// Exemplo com erro
	fmt.Println("Teste com ISPB inválido:")
	if err := validarISPB("123"); err != nil {
		fmt.Printf("  Erro: %v\n", err)
	}

	fmt.Println()
	fmt.Println("✅ Exercício concluído!")
}
