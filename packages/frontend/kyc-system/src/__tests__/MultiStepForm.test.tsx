import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { ThemeProvider } from '@/lib/theme/theme';
import { useKYCStore } from '@/store/kycStore';

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

describe('MultiStepForm', () => {
  beforeEach(() => {
    useKYCStore.getState().reset();
  });

  it('should start at step 0 (personal info)', () => {
    renderApp();
    expect(screen.getByText('Dados Pessoais')).toBeDefined();
  });

  it('should display personal info form fields', () => {
    renderApp();
    expect(screen.getByLabelText('Nome Completo')).toBeDefined();
    expect(screen.getByLabelText('E-mail')).toBeDefined();
    expect(screen.getByLabelText('Telefone')).toBeDefined();
  });

  it('should navigate to next step when "Próximo" is clicked', async () => {
    renderApp();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nome Completo'), 'João Silva');
    await user.type(screen.getByLabelText('E-mail'), 'joao@email.com');
    await user.type(screen.getByLabelText('Telefone'), '(11) 99999-9999');

    const dateInput = screen.getByLabelText('Data de Nascimento');
    await user.type(dateInput, '2000-01-01');

    const countrySelect = screen.getByLabelText('País');
    await user.selectOptions(countrySelect, 'BR');

    const nextBtn = screen.getByText('Próximo');
    await user.click(nextBtn);

    expect(screen.getByText('Endereço')).toBeDefined();
  });

  it('should go back to previous step', async () => {
    renderApp();
    const user = userEvent.setup();

    useKYCStore.getState().setPersonalInfo({
      fullName: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999',
      dateOfBirth: '2000-01-01',
      country: 'BR',
    });
    useKYCStore.getState().setCurrentStep(1);

    const backBtn = screen.getByText('Voltar');
    await user.click(backBtn);

    expect(useKYCStore.getState().currentStep).toBe(0);
  });

  it('should show all 5 steps in step indicator', () => {
    renderApp();
    const steps = ['Dados Pessoais', 'Endereço', 'Identidade', 'Selfie', 'Revisão'];
    steps.forEach((step) => {
      expect(screen.getAllByText(step).length).toBeGreaterThan(0);
    });
  });

  it('should disable Voltar on first step', () => {
    renderApp();
    useKYCStore.getState().setCurrentStep(0);
    const backBtn = screen.getByText('Voltar');
    expect(backBtn.closest('button')).toBeDisabled();
  });
});
