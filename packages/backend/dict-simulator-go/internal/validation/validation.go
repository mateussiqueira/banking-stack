package validation

import (
	"fmt"
	"regexp"
	"strings"
)

func ValidateCPF(cpf string) bool {
	cpf = strings.ReplaceAll(cpf, ".", "")
	cpf = strings.ReplaceAll(cpf, "-", "")
	cpf = strings.ReplaceAll(cpf, " ", "")

	if len(cpf) != 11 {
		return false
	}

	// Verificar sequências inválidas (todos dígitos iguais)
	invalid := []string{"00000000000", "11111111111", "22222222222", "33333333333",
		"44444444444", "55555555555", "66666666666", "77777777777",
		"88888888888", "99999999999"}
	for _, inv := range invalid {
		if cpf == inv {
			return false
		}
	}

	// Validar dígitos verificadores
	sum := 0
	for i := 0; i < 9; i++ {
		sum += int(cpf[i]-'0') * (10 - i)
	}
	remainder := sum % 11
	digit1 := 0
	if remainder >= 2 {
		digit1 = 11 - remainder
	}

	sum = 0
	for i := 0; i < 10; i++ {
		sum += int(cpf[i]-'0') * (11 - i)
	}
	remainder = sum % 11
	digit2 := 0
	if remainder >= 2 {
		digit2 = 11 - remainder
	}

	return int(cpf[9]-'0') == digit1 && int(cpf[10]-'0') == digit2
}

func ValidateCNPJ(cnpj string) bool {
	cnpj = strings.ReplaceAll(cnpj, ".", "")
	cnpj = strings.ReplaceAll(cnpj, "-", "")
	cnpj = strings.ReplaceAll(cnpj, "/", "")
	cnpj = strings.ReplaceAll(cnpj, " ", "")

	if len(cnpj) != 14 {
		return false
	}

	// Validar dígitos verificadores
	weights1 := []int{5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}
	weights2 := []int{6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}

	sum := 0
	for i := 0; i < 12; i++ {
		sum += int(cnpj[i]-'0') * weights1[i]
	}
	remainder := sum % 11
	digit1 := 0
	if remainder >= 2 {
		digit1 = 11 - remainder
	}

	sum = 0
	for i := 0; i < 13; i++ {
		sum += int(cnpj[i]-'0') * weights2[i]
	}
	remainder = sum % 11
	digit2 := 0
	if remainder >= 2 {
		digit2 = 11 - remainder
	}

	return int(cnpj[12]-'0') == digit1 && int(cnpj[13]-'0') == digit2
}

func ValidateEmail(email string) bool {
	email = strings.ToLower(strings.TrimSpace(email))
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	matched, _ := regexp.MatchString(pattern, email)
	return matched
}

func ValidatePhone(phone string) bool {
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")
	phone = strings.ReplaceAll(phone, "(", "")
	phone = strings.ReplaceAll(phone, ")", "")

	if len(phone) < 10 || len(phone) > 13 {
		return false
	}

	// Deve começar com +
	if !strings.HasPrefix(phone, "+") && len(phone) < 11 {
		return false
	}

	return true
}

func ValidateRandomKey(key string) bool {
	pattern := `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
	matched, _ := regexp.MatchString(pattern, key)
	return matched
}

func ValidateKeyType(key, keyType string) error {
	switch keyType {
	case "CPF":
		if !ValidateCPF(key) {
			return fmt.Errorf("invalid CPF: %s", key)
		}
	case "CNPJ":
		if !ValidateCNPJ(key) {
			return fmt.Errorf("invalid CNPJ: %s", key)
		}
	case "EMAIL":
		if !ValidateEmail(key) {
			return fmt.Errorf("invalid email: %s", key)
		}
	case "PHONE":
		if !ValidatePhone(key) {
			return fmt.Errorf("invalid phone: %s", key)
		}
	case "RANDOM":
		if !ValidateRandomKey(key) {
			return fmt.Errorf("invalid random key (must be UUID): %s", key)
		}
	default:
		return fmt.Errorf("invalid key type: %s", keyType)
	}
	return nil
}

func FormatPixKey(key, keyType string) string {
	switch keyType {
	case "CPF", "CNPJ":
		return strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(key, ".", ""), "-", ""), "/", "")
	case "EMAIL":
		return strings.ToLower(strings.TrimSpace(key))
	case "PHONE":
		return strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(key, " ", ""), "-", ""), "(", ""), ")", ""), "+", "")
	case "RANDOM":
		return strings.ToLower(strings.TrimSpace(key))
	default:
		return key
	}
}

func ValidateISPB(ispb string) bool {
	if len(ispb) != 8 {
		return false
	}
	for _, c := range ispb {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}
